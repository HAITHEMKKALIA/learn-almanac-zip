// Adaptive learning: placement test generation + personalized recommendations
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { createClient } from "jsr:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLACEMENT_SCHEMA = {
  name: "placement_questions",
  description: "Generate an adaptive CEFR placement test for German learners (A1 to B2).",
  parameters: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"] },
            skill: { type: "string", enum: ["grammatik","wortschatz","lesen","hoeren"] },
            prompt_de: { type: "string" },
            options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
            correct: { type: "string", description: "Exactly one of the options" },
          },
          required: ["level","skill","prompt_de","options","correct"],
        },
      },
    },
    required: ["questions"],
  },
};

const RECO_SCHEMA = {
  name: "recommendations",
  description: "Personalized learning recommendations for a German learner.",
  parameters: {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["weak_area","next_step","review"] },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "number", minimum: 1, maximum: 10 },
          },
          required: ["kind","title","description","priority"],
        },
      },
    },
    required: ["recommendations"],
  },
};

async function callAI(messages: any[], tool: any) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Response(JSON.stringify({ error: `AI ${r.status}: ${txt.slice(0,200)}` }),
      { status: r.status === 429 || r.status === 402 ? r.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
  const j = await r.json();
  const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode || "placement");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (mode === "placement") {
      const sys = "Du bist ein DaF-Prüfer. Erstelle einen adaptiven CEFR-Einstufungstest mit 15 Multiple-Choice-Fragen, gestaffelt von A1.1 bis B2.2 (je ~2 pro Sublevel). Nur über das Tool placement_questions antworten.";
      const user = "Erstelle 15 Fragen zur Einstufung. Alle 4 Optionen plausibel; genau eine korrekt.";
      const parsed = await callAI(
        [{ role: "system", content: sys }, { role: "user", content: user }],
        PLACEMENT_SCHEMA,
      );
      const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 20) : [];
      const { data: row, error } = await admin.from("placement_tests")
        .insert({ user_id: uid, questions, status: "in_progress" })
        .select("id").single();
      if (error) throw error;
      return new Response(JSON.stringify({ id: row.id, questions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    if (mode === "grade_placement") {
      const testId = String(body?.test_id || "");
      const answers: string[] = Array.isArray(body?.answers) ? body.answers : [];
      const { data: test } = await admin.from("placement_tests").select("*").eq("id", testId).eq("user_id", uid).single();
      if (!test) return new Response(JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      const qs: any[] = Array.isArray(test.questions) ? test.questions : [];
      const perLevel: Record<string, { ok: number; total: number }> = {};
      const perSkill: Record<string, { ok: number; total: number }> = {};
      let correct = 0;
      qs.forEach((q, i) => {
        const ok = String(answers[i] || "").trim() === String(q.correct || "").trim();
        if (ok) correct++;
        const L = q.level || "A1.1"; const S = q.skill || "grammatik";
        perLevel[L] = perLevel[L] || { ok: 0, total: 0 };
        perSkill[S] = perSkill[S] || { ok: 0, total: 0 };
        perLevel[L].total++; perSkill[S].total++;
        if (ok) { perLevel[L].ok++; perSkill[S].ok++; }
      });
      const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
      // Recommended level = highest level with >=70% success
      const ORDER = ["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"];
      let rec = "A1.1";
      for (const L of ORDER) {
        const p = perLevel[L]; if (!p || p.total === 0) continue;
        if (p.ok / p.total >= 0.7) rec = L;
      }
      const strengths = Object.entries(perSkill).filter(([_, v]) => v.total > 0 && v.ok / v.total >= 0.7).map(([k]) => k);
      const weaknesses = Object.entries(perSkill).filter(([_, v]) => v.total > 0 && v.ok / v.total < 0.5).map(([k]) => k);
      await admin.from("placement_tests").update({
        status: "completed", answers, score, recommended_level: rec,
        strengths, weaknesses, completed_at: new Date().toISOString(),
      }).eq("id", testId);
      return new Response(JSON.stringify({ score, recommended_level: rec, strengths, weaknesses }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    if (mode === "recommend") {
      // Aggregate signals
      const [{ data: stats }, { data: subs }] = await Promise.all([
        admin.from("user_stats").select("*").eq("user_id", uid).maybeSingle(),
        admin.from("submissions").select("score,status").eq("student_id", uid).limit(50),
      ]);
      const avg = subs && subs.length ? (subs.reduce((s: number, r: any) => s + (Number(r.score) || 0), 0) / subs.length).toFixed(1) : "0";
      const sys = "Du bist ein DaF-Lernberater. Erstelle 4-6 sehr konkrete, umsetzbare Empfehlungen (Französisch) für einen Deutschlerner. Prioritäten 1 (hoch) bis 10. Nur über das Tool recommendations antworten.";
      const user = `Profil élève:\n- XP: ${stats?.xp ?? 0}\n- Niveau app: ${stats?.level ?? 1}\n- Streak: ${stats?.current_streak ?? 0} jours\n- Moyenne devoirs: ${avg}/100 (${subs?.length ?? 0} rendus)\n\nDonne 4-6 recommandations personnalisées en français, ciblées sur ses lacunes probables et prochaines étapes CECRL.`;
      const parsed = await callAI(
        [{ role: "system", content: sys }, { role: "user", content: user }],
        RECO_SCHEMA,
      );
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      if (recs.length) {
        // Replace prior active recs
        await admin.from("learning_recommendations").update({ status: "dismissed" })
          .eq("user_id", uid).eq("status", "active");
        await admin.from("learning_recommendations").insert(
          recs.map((r: any) => ({
            user_id: uid, kind: r.kind || "next_step",
            title: String(r.title || "").slice(0, 200),
            description: String(r.description || "").slice(0, 1000),
            priority: Math.max(1, Math.min(10, Number(r.priority) || 5)),
          })),
        );
      }
      return new Response(JSON.stringify({ recommendations: recs }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ error: "unknown_mode" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});
