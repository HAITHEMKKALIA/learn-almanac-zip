// AI grading for exam open answers and homework submissions.
// Body: { kind: "exam", submission_id } | { kind: "homework", submission_id }
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
import { createClient } from "jsr:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rateLimit.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GRADE_OPEN_SCHEMA = {
  name: "grade_open_answer",
  parameters: {
    type: "object",
    properties: {
      score_ratio: { type: "number", description: "0..1 quality of the answer." },
      feedback_fr: { type: "string", description: "Court feedback en français pour l'élève (1-3 phrases)." },
      correction: { type: "string", description: "Réponse corrigée idéale en allemand." },
    },
    required: ["score_ratio", "feedback_fr"],
  },
};
const GRADE_HW_SCHEMA = {
  name: "grade_homework",
  parameters: {
    type: "object",
    properties: {
      score: { type: "number" },
      feedback_fr: { type: "string" },
      strengths: { type: "string" },
      weaknesses: { type: "string" },
      corrected_version: { type: "string" },
    },
    required: ["score", "feedback_fr"],
  },
};

async function aiCall(schema: any, sys: string, user: string) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{ type: "function", function: schema }],
      tool_choice: { type: "function", function: { name: schema.name } },
    }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "teacher" || r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const rl = rateLimit(`grade:${u.user.id}`, 20, 60_000);
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) } });
    }
    // Quota check + usage log via user JWT (RLS-friendly)
    const { data: quotaOk } = await sb.rpc("check_ai_quota", { _school_id: null });
    if (quotaOk === false) {
      return new Response(JSON.stringify({ error: "quota_exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    sb.from("ai_generation_logs").insert({
      user_id: u.user.id, type: "ai-grade", model: "google/gemini-2.5-flash", status: "validated",
    }).then(({ error }) => { if (error) console.error("log insert", error.message); });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    const kind = String(body?.kind || "exam");
    const submission_id = String(body?.submission_id || "");
    if (!submission_id) throw new Error("submission_id required");

    if (kind === "homework") {
      const { data: sub } = await admin.from("homework_submissions").select("*, homework(title, instructions, max_points, level, category, teacher_id)").eq("id", submission_id).single();
      if (!sub) throw new Error("not found");
      if (sub.homework.teacher_id !== u.user.id) throw new Error("forbidden");
      const sys = `Du bist ein erfahrener DaF-Lehrer. Bewerte die Schülerarbeit objektiv. Antworte nur über das Tool grade_homework. Note maximale: ${sub.homework.max_points}.`;
      const usr = `Niveau: ${sub.homework.level || "?"}\nKategorie: ${sub.homework.category}\nTitre: ${sub.homework.title}\nConsignes: ${sub.homework.instructions || "(aucune)"}\n\nRéponse de l'élève:\n${sub.content || "(aucun texte écrit, audio/fichier joint)"}`;
      const r = await aiCall(GRADE_HW_SCHEMA, sys, usr);
      const score = Math.max(0, Math.min(sub.homework.max_points, Math.round(Number(r.score) || 0)));
      const fb = `${r.feedback_fr || ""}${r.strengths ? `\n\n✓ Points forts: ${r.strengths}` : ""}${r.weaknesses ? `\n\n✗ À améliorer: ${r.weaknesses}` : ""}${r.corrected_version ? `\n\n📝 Correction proposée:\n${r.corrected_version}` : ""}`;
      await admin.from("homework_submissions").update({
        score, teacher_feedback: fb, status: "graded",
        graded_at: new Date().toISOString(), ai_graded: true,
      }).eq("id", submission_id);
      return new Response(JSON.stringify({ ok: true, score, feedback: fb }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (kind === "homework_questions") {
      const { data: sub } = await admin.from("homework_submissions")
        .select("*, homework(title, max_points, level, category, teacher_id)")
        .eq("id", submission_id).single();
      if (!sub) throw new Error("not found");
      if (sub.homework.teacher_id !== u.user.id) throw new Error("forbidden");
      const { data: qs } = await admin.from("homework_questions").select("*").eq("homework_id", sub.homework_id).order("position");
      const { data: ans } = await admin.from("homework_question_answers").select("*").eq("submission_id", submission_id);
      const ansMap = new Map((ans || []).map((a: any) => [a.question_id, a]));
      let total = 0;
      for (const q of (qs || []) as any[]) {
        const pts = q.points || 1;
        total += pts;
        const a: any = ansMap.get(q.id);
        if (!a || !a.answer) {
          if (a) await admin.from("homework_question_answers").update({ awarded_points: 0, is_correct: false, teacher_comment: "Aucune réponse" }).eq("id", a.id);
          continue;
        }
        const sys = `Du bist DaF-Korrektor (Niveau ${sub.homework.level || "A1"}). Bewerte die Antwort. Tool: grade_open_answer.`;
        const usr = `Frage: ${q.prompt}\nErwartete Antwort: ${q.expected_answer || "(keine Referenz)"}\nSchüler-Antwort: ${a.answer}\nMax. Punkte: ${pts}`;
        try {
          const r = await aiCall(GRADE_OPEN_SCHEMA, sys, usr);
          const ratio = Math.max(0, Math.min(1, Number(r.score_ratio) || 0));
          const awarded = Math.round(ratio * pts * 100) / 100;
          const comment = `${r.feedback_fr || ""}${r.correction ? `\n\nCorrection: ${r.correction}` : ""}`;
          await admin.from("homework_question_answers").update({
            awarded_points: awarded, is_correct: ratio >= 0.5, teacher_comment: comment,
          }).eq("id", a.id);
        } catch (e) { console.error("grade fail", q.id, e); }
      }
      const { data: fresh } = await admin.from("homework_question_answers").select("awarded_points").eq("submission_id", submission_id);
      const score = Math.round((fresh || []).reduce((s: number, r: any) => s + (Number(r.awarded_points) || 0), 0));
      return new Response(JSON.stringify({ ok: true, score, total }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // EXAM
    const { data: sub } = await admin.from("submissions").select("*, assignments(teacher_id, level)").eq("id", submission_id).single();
    if (!sub) throw new Error("not found");
    if (sub.assignments.teacher_id !== u.user.id) throw new Error("forbidden");

    const onlyQuestionId = body?.question_id ? String(body.question_id) : null;
    const { data: aq } = await admin.from("assignment_questions")
      .select("question_id, points_override, question_bank(id, kind, prompt_de, correct_answer, points, explanation_fr)")
      .eq("assignment_id", sub.assignment_id);
    const { data: answers } = await admin.from("submission_answers").select("*").eq("submission_id", submission_id);
    const ansMap = new Map((answers ?? []).map((a) => [a.question_id, a]));

    let totalScore = sub.score || 0;
    // recompute total from existing autograded
    let recomputedScore = 0;
    let total = 0;
    const openKinds = ["write", "translate", "speak", "open"];
    let graded = 0;
    for (const row of (aq ?? []) as any[]) {
      const q = row.question_bank;
      const pts = row.points_override ?? q.points ?? 1;
      total += pts;
      if (onlyQuestionId && q.id !== onlyQuestionId) continue;
      const a = ansMap.get(q.id);
      if (!openKinds.includes(q.kind)) {
        if (a?.is_correct) recomputedScore += Number(a.awarded_points ?? pts);
        continue;
      }
      if (!a || !a.answer) {
        if (a) await admin.from("submission_answers").update({ awarded_points: 0, is_correct: false, ai_graded: true, teacher_comment: "Aucune réponse", grading_status: "ai_graded" }).eq("id", a.id);
        continue;
      }
      const sys = `Du bist DaF-Korrektor (Niveau ${sub.assignments.level || "A1"}). Bewerte die Antwort. Tool: grade_open_answer.`;
      const usr = `Frage: ${q.prompt_de}\nRichtige Antwort (Referenz): ${q.correct_answer}\n${q.explanation_fr ? `Explication: ${q.explanation_fr}\n` : ""}Antwort des Schülers: ${a.answer}\nMax. Punkte: ${pts}`;
      try {
        const r = await aiCall(GRADE_OPEN_SCHEMA, sys, usr);
        const ratio = Math.max(0, Math.min(1, Number(r.score_ratio) || 0));
        const awarded = Math.round(ratio * pts * 100) / 100;
        recomputedScore += awarded;
        const comment = `${r.feedback_fr || ""}${r.correction ? `\n\nCorrection: ${r.correction}` : ""}`;
        await admin.from("submission_answers").update({
          awarded_points: awarded, is_correct: ratio >= 0.5,
          ai_graded: true, teacher_comment: comment,
          grading_status: "ai_graded",
        }).eq("id", a.id);
        graded++;
      } catch (e) {
        console.error("grade fail", q.id, e);
        await admin.from("submission_answers").update({ grading_status: "ai_failed" }).eq("id", a.id);
      }
    }

    // Promote any non-open MCQ-type answers that already have awarded_points to ai_graded
    await admin.from("submission_answers")
      .update({ grading_status: "ai_graded" })
      .eq("submission_id", submission_id)
      .not("awarded_points", "is", null)
      .in("grading_status", ["pending", "ai_running"]);

    if (!onlyQuestionId) {
      await admin.from("submissions").update({
        score: Math.round(recomputedScore), total,
      }).eq("id", submission_id);
    }

    return new Response(JSON.stringify({ ok: true, graded, score: Math.round(recomputedScore), total }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("ai-grade error", e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
