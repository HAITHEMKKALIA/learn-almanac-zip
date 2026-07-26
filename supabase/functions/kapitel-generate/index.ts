const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
import { createClient } from "jsr:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SECTIONS: Array<{ kind: string; title: string; minutes: number }> = [
  { kind: "intro", title: "Einstieg", minutes: 5 },
  { kind: "wortschatz", title: "Wortschatz", minutes: 15 },
  { kind: "grammatik", title: "Grammatik", minutes: 20 },
  { kind: "hoeren", title: "Hören", minutes: 15 },
  { kind: "lesen", title: "Lesen", minutes: 15 },
  { kind: "sprechen", title: "Sprechen", minutes: 15 },
  { kind: "schreiben", title: "Schreiben", minutes: 15 },
  { kind: "uebung", title: "Übungen", minutes: 20 },
  { kind: "minitest", title: "Mini-Test", minutes: 10 },
];

const SCHEMA = {
  name: "kapitel_section_content",
  description: "Structured content for one section of a German lesson chapter.",
  parameters: {
    type: "object",
    properties: {
      objectives: { type: "array", items: { type: "string" } },
      intro_de: { type: "string" },
      intro_fr: { type: "string" },
      key_phrases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            de: { type: "string" },
            fr: { type: "string" },
          },
          required: ["de", "fr"],
        },
      },
      grammar_rules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation_fr: { type: "string" },
            examples: { type: "array", items: { type: "string" } },
          },
          required: ["title", "explanation_fr", "examples"],
        },
      },
      dialogue: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: { type: "string" },
            de: { type: "string" },
            fr: { type: "string" },
          },
          required: ["speaker", "de"],
        },
      },
      reading_text: { type: "string" },
      reading_translation_fr: { type: "string" },
      writing_prompt: { type: "string" },
      speaking_prompt: { type: "string" },
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["mcq", "fill", "match", "order"] },
            prompt: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
            explanation_fr: { type: "string" },
          },
          required: ["type", "prompt", "answer"],
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[kapitel-generate ${reqId}]`, ...a);
  const errlog = (...a: unknown[]) => console.error(`[kapitel-generate ${reqId}]`, ...a);

  if (req.method === "OPTIONS") {
    log("OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    log("→", req.method, req.url);
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) {
      errlog("no Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = auth.replace("Bearer ", "");
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: uErr } = await sb.auth.getUser(token);
    if (uErr || !userData?.user) {
      errlog("auth.getUser failed", uErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    log("user", userData.user.id);

    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", userData.user.id);
    const ok = roles?.some((r) => r.role === "teacher" || r.role === "admin");
    log("roles", roles, "allowed=", ok);
    if (!ok) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { kapitel_id } = body || {};
    log("payload", { kapitel_id });
    if (!kapitel_id) return new Response(JSON.stringify({ error: "Missing kapitel_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: kap, error: kErr } = await admin.from("kapitel").select("*").eq("id", kapitel_id).maybeSingle();
    if (kErr) errlog("kapitel fetch error", kErr);
    if (!kap) return new Response(JSON.stringify({ error: "Kapitel not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    log("kapitel", kap.level, kap.number, kap.title_de);

    // Avoid duplicating sections if already generated
    const { count: existing } = await admin.from("kapitel_sections").select("id", { count: "exact", head: true }).eq("kapitel_id", kapitel_id);
    log("existing sections", existing);
    if ((existing ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: true, count: 0, message: "already_generated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const created: any[] = [];

    for (let i = 0; i < SECTIONS.length; i++) {
      const sec = SECTIONS[i];
      const sys = `Du bist ein erfahrener DaF-Lehrer. Erstelle didaktisch hochwertige Inhalte gemäß GER-Niveau ${kap.level}. Antworte ausschließlich über das Tool kapitel_section_content. Texte und Beispiele müssen original sein und das Kapitelthema treffen.`;
      const user = `Niveau: ${kap.level}\nKapitel ${kap.number}: ${kap.title_de} — ${kap.subtitle ?? ""}\nLernziele: ${(kap.objectives ?? []).join(", ")}\nThemen Wortschatz: ${(kap.vocab_themes ?? []).join(", ")}\n\nErstelle den Abschnitt "${sec.title}" (${sec.kind}). Liefere nur Felder, die für diesen Abschnitt relevant sind, aber mindestens "objectives" und passenden Inhalt. Bei "wortschatz": key_phrases (10-15). Bei "grammatik": 1-2 grammar_rules mit Erklärung auf Französisch. Bei "hoeren"/"lesen": dialogue oder reading_text. Bei "sprechen": speaking_prompt. Bei "schreiben": writing_prompt. Bei "uebung"/"minitest": 6-10 exercises (Mix aus mcq/fill).`;

      const tSec = Date.now();
      log(`section ${i + 1}/${SECTIONS.length} (${sec.kind}) → AI call`);
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          tools: [{ type: "function", function: SCHEMA }],
          tool_choice: { type: "function", function: { name: "kapitel_section_content" } },
        }),
      });

      if (!r.ok) {
        const txt = await r.text();
        errlog(`section ${sec.kind} AI HTTP ${r.status}`, txt.slice(0, 400));
        if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        continue;
      }
      const j = await r.json();
      const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      let content: any = {};
      try { content = args ? JSON.parse(args) : {}; } catch (e) { errlog("JSON parse failed", e); }
      const sizeKb = (JSON.stringify(content).length / 1024).toFixed(2);
      log(`section ${sec.kind} ✓ AI ${Date.now() - tSec}ms, payload ${sizeKb}KB`);

      const { data: ins, error: insErr } = await admin.from("kapitel_sections").insert({
        kapitel_id,
        kind: sec.kind,
        title: sec.title,
        position: i,
        content,
        estimated_minutes: sec.minutes,
      }).select().single();
      if (insErr) errlog(`insert ${sec.kind} failed`, insErr);
      else created.push(ins);
    }

    log(`DONE ${created.length}/${SECTIONS.length} in ${Date.now() - t0}ms`);
    return new Response(JSON.stringify({ ok: true, count: created.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    errlog("unhandled", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

