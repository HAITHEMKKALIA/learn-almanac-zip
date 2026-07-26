// Grade and finalize an exam submission.
// - MCQ / true_false: auto-graded (exact match, case-insensitive trim)
// - translation / open / audio: marked pending teacher review (is_correct = null)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const norm = (s: string) => (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, service);

    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { submission_id } = await req.json();
    const { data: sub, error } = await admin.from("submissions").select("*").eq("id", submission_id).single();
    if (error || !sub) throw new Error("submission not found");
    if (sub.student_id !== user.id) throw new Error("forbidden");
    if (sub.status === "submitted") {
      return new Response(JSON.stringify({ ok: true, score: sub.score, total: sub.total }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: aq } = await admin.from("assignment_questions")
      .select("question_id, points_override, question_bank(id, kind, correct_answer, points)")
      .eq("assignment_id", sub.assignment_id);

    const { data: answers } = await admin.from("submission_answers").select("*").eq("submission_id", submission_id);
    const ansMap = new Map((answers ?? []).map(a => [a.question_id, a]));

    let score = 0, total = 0, hasPending = false;
    for (const row of (aq ?? []) as any[]) {
      const q = row.question_bank;
      const pts = row.points_override ?? q.points ?? 1;
      total += pts;
      const a = ansMap.get(q.id);
      const autoKinds = ["qcm", "audio", "mcq", "true_false"];
      if (!autoKinds.includes(q.kind)) {
        // pending
        hasPending = true;
        if (a) {
          await admin.from("submission_answers").update({ is_correct: null, awarded_points: null }).eq("id", a.id);
        }
        continue;
      }
      // For QCM the stored correct_answer can be an index ("0"-"3") OR the literal option text.
      // The student answer is the option text (any language). We accept correct if:
      //  - normalized match, OR
      //  - correct_answer is a digit and equals the option index in question_bank.options_de/fr/ar
      let correct = false;
      if (a && a.answer != null) {
        const ansN = norm(a.answer);
        const ca = norm(q.correct_answer);
        if (ansN === ca) correct = true;
        else if (/^\d+$/.test(ca)) {
          // load options
          const { data: qFull } = await admin.from("question_bank").select("options_de, options_fr, options_ar").eq("id", q.id).single();
          const idx = parseInt(ca, 10);
          for (const arr of [qFull?.options_de, qFull?.options_fr, qFull?.options_ar]) {
            if (Array.isArray(arr) && arr[idx] && norm(String(arr[idx])) === ansN) { correct = true; break; }
          }
        }
      }
      const awarded = correct ? pts : 0;
      if (correct) score += pts;
      if (a) {
        await admin.from("submission_answers").update({ is_correct: correct, awarded_points: awarded }).eq("id", a.id);
      } else {
        await admin.from("submission_answers").insert({ submission_id, question_id: q.id, is_correct: false, awarded_points: 0 });
      }
    }

    await admin.from("submissions").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score, total,
    }).eq("id", submission_id);

    return new Response(JSON.stringify({ ok: true, score, total, hasPending }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
