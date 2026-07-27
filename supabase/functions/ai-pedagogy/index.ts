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

const HOMEWORK_SCHEMA = {
  name: "homework_content",
  description: "Structured homework with title, instructions, and optional exercises.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      instructions: { type: "string", description: "Markdown-ready instructions in German for the student." },
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            answer: { type: "string" },
          },
          required: ["prompt"],
        },
      },
    },
    required: ["title", "instructions"],
  },
};

const EXAM_SCHEMA = {
  name: "exam_questions",
  description: "Generate exam questions for German learners.",
  parameters: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["qcm", "write", "translate"] },
            skill: { type: "string", enum: ["lesen", "hoeren", "schreiben", "sprechen", "grammatik", "wortschatz"] },
            prompt_de: { type: "string" },
            prompt_fr: { type: "string" },
            options_de: { type: "array", items: { type: "string" } },
            correct_answer: { type: "string" },
            explanation_fr: { type: "string" },
            points: { type: "integer" },
          },
          required: ["kind", "skill", "prompt_de", "correct_answer", "points"],
        },
      },
    },
    required: ["questions"],
  },
};

const HOMEWORK_QUESTIONS_SCHEMA = {
  name: "homework_questions",
  description: "Return a list of homework questions with expected answers.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Question text in German." },
            expected_answer: { type: "string", description: "Expected/model answer in German." },
            points: { type: "integer", minimum: 1, maximum: 10 },
          },
          required: ["prompt", "expected_answer"],
        },
      },
    },
    required: ["questions"],
  },
};

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[ai-pedagogy ${reqId}]`, ...a);
  const errlog = (...a: unknown[]) => console.error(`[ai-pedagogy ${reqId}]`, ...a);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = auth.replace("Bearer ", "");
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", userData.user.id);
    const ok = roles?.some((r) => r.role === "teacher" || r.role === "admin");
    if (!ok) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode || "homework"); // "homework" | "exam"
    const level = String(body?.level || "A1");
    const category = String(body?.category || "schreiben");
    const title = String(body?.title || "").slice(0, 300);
    const hint = String(body?.hint || "").slice(0, 2000);
    const sourceText = String(body?.source_text || "").slice(0, 30000);
    const count = Math.max(1, Math.min(20, Number(body?.count) || 8));

    log("mode", mode, "level", level, "category", category, "src.len", sourceText.length, "count", count);

    if (mode === "homework") {
      const sys = `Du bist ein erfahrener DaF-Lehrer. Erstelle Hausaufgaben für Niveau ${level} (GER). Antworte ausschließlich über das Tool homework_content. Schreibe Anweisungen klar, motivierend, auf Deutsch. Wenn ein Quelltext bereitgestellt wird, leite die Aufgabe daraus ab.`;
      const user = `Niveau: ${level}\nKategorie: ${category}\nTitel-Idee: ${title || "(keine)"}\nHinweis: ${hint || "(keine)"}\n${sourceText ? `\nQuelltext (PDF/Material):\n${sourceText}\n` : ""}\nErstelle eine vollständige Hausaufgabe: präziser Titel, klare Anweisungen (3-6 Sätze, ggf. mit Stichpunkten), und 3-6 konkrete Übungen/Fragen.`;

      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          tools: [{ type: "function", function: HOMEWORK_SCHEMA }],
          tool_choice: { type: "function", function: { name: "homework_content" } },
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        errlog("AI error", r.status, txt.slice(0, 400));
        if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const content = args ? JSON.parse(args) : {};

      // Format instructions including exercises
      let instructions = content.instructions || "";
      if (Array.isArray(content.exercises) && content.exercises.length > 0) {
        instructions += "\n\nÜbungen:\n" + content.exercises.map((e: any, i: number) => `${i + 1}. ${e.prompt}`).join("\n");
      }
      log("homework generated, len", instructions.length);
      return new Response(JSON.stringify({ ok: true, title: content.title, instructions, exercises: content.exercises ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "exam") {
      const sys = `Du bist ein erfahrener DaF-Prüfungsersteller. Erstelle ${count} hochwertige Prüfungsfragen für Niveau ${level} (GER), Kompetenz ${category}. Antworte ausschließlich über das Tool exam_questions. Erlaubte Fragetypen ("kind"): "qcm" (Multiple-Choice mit options_de = 4 Optionen, correct_answer = exakt eine davon), "write" (offene Schreibantwort), "translate" (Übersetzung). Verwende mehrheitlich "qcm".`;
      const user = `Thema/Titel: ${title || "(allgemein)"}\nHinweis: ${hint || "(keiner)"}\n${sourceText ? `\nQuelltext (PDF):\n${sourceText}\n` : ""}\nErstelle ${count} Fragen.`;

      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          tools: [{ type: "function", function: EXAM_SCHEMA }],
          tool_choice: { type: "function", function: { name: "exam_questions" } },
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        errlog("AI error", r.status, txt.slice(0, 400));
        if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : { questions: [] };
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      log("exam generated", questions.length);

      // Insert into question_bank
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const KIND_MAP: Record<string, string> = { mcq: "qcm", qcm: "qcm", multiple_choice: "qcm", true_false: "qcm", short: "write", fill: "write", write: "write", translate: "translate", audio: "audio", speak: "speak" };
      const rows = questions.map((q: any) => ({
        owner_id: userData.user.id,
        level,
        skill: q.skill || category,
        kind: KIND_MAP[String(q.kind || "").toLowerCase()] || "qcm",
        prompt_de: q.prompt_de,
        prompt_fr: q.prompt_fr || null,
        options_de: q.options_de ? q.options_de : null,
        correct_answer: String(q.correct_answer ?? ""),
        explanation_fr: q.explanation_fr || null,
        points: Number(q.points) || 1,
        source: "custom",
        is_public: false,
      }));
      const { data: inserted, error: insErr } = await admin.from("question_bank").insert(rows).select("id");
      if (insErr) { errlog("insert failed", insErr); return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      return new Response(JSON.stringify({ ok: true, count: inserted?.length || 0, question_ids: (inserted || []).map((r: any) => r.id), questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "homework_questions") {
      const sys = `Du bist ein erfahrener DaF-Lehrer. Erstelle ${count} Hausaufgaben-Fragen für Niveau ${level} (GER), Kompetenz ${category}. Jede Frage hat eine erwartete Musterantwort. Antworte ausschließlich über das Tool homework_questions.`;
      const usr = `Titel-Idee: ${title || "(keine)"}\nHinweis: ${hint || "(keiner)"}\n${sourceText ? `\nQuelltext:\n${sourceText}\n` : ""}\nErstelle ${count} Fragen mit erwarteten Antworten.`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
          tools: [{ type: "function", function: HOMEWORK_QUESTIONS_SCHEMA }],
          tool_choice: { type: "function", function: { name: "homework_questions" } },
        }),
      });
      if (!r.ok) {
        if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : { questions: [] };
      const questions = (parsed.questions || []).map((q: any) => ({
        prompt: String(q.prompt || "").slice(0, 1000),
        expected_answer: String(q.expected_answer || "").slice(0, 1000),
        points: Math.max(1, Math.min(10, Number(q.points) || 1)),
      }));
      return new Response(JSON.stringify({ ok: true, title: parsed.title || title, questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    errlog("unhandled", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
