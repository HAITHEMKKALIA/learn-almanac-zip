// Extract Goethe/ÖSD-style questions from raw text (or PDF text) using Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { text, level = "A2", source = "goethe", kind = "mixed" } = await req.json();
    if (!text || text.length < 20) throw new Error("Texte trop court");
    const kindHint: Record<string, string> = {
      qcm: "Privilégie des questions QCM (4 options).",
      grammar: "Privilégie la grammaire (déclinaisons, conjugaison, prépositions).",
      comprehension: "Privilégie la compréhension écrite/orale (skill=lesen ou hoeren).",
      mixed: "Mélange les types selon le contenu.",
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquante");

    const sys = `Tu es un assistant qui extrait des questions d'examens d'allemand depuis du texte brut (Goethe/ÖSD). ${kindHint[kind] || ""} Renvoie UNIQUEMENT un objet JSON valide via l'outil fourni.`;
    const usr = `Source: ${source}, Niveau: ${level}, Type: ${kind}.\n\nTexte de l'examen :\n${text.slice(0, 12000)}\n\nExtrait jusqu'à 15 questions. Pour chaque question, fournis prompt_de, prompt_fr (traduction française), prompt_ar (traduction arabe), kind (qcm|translate|write|audio), skill (lesen|hoeren|schreiben|wortschatz|grammatik|sprechen), options_de/fr/ar (4 options si qcm), correct_answer (index "0"-"3" si qcm sinon réponse attendue), explanation_fr, explanation_ar, points (1-5).`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        tools: [{
          type: "function",
          function: {
            name: "extract_questions",
            description: "Extract exam questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prompt_de: { type: "string" }, prompt_fr: { type: "string" }, prompt_ar: { type: "string" },
                      kind: { type: "string", enum: ["qcm","translate","write","audio","speak"] },
                      skill: { type: "string", enum: ["lesen","hoeren","schreiben","wortschatz","grammatik","sprechen"] },
                      options_de: { type: "array", items: { type: "string" } },
                      options_fr: { type: "array", items: { type: "string" } },
                      options_ar: { type: "array", items: { type: "string" } },
                      correct_answer: { type: "string" },
                      explanation_fr: { type: "string" }, explanation_ar: { type: "string" },
                      points: { type: "number" },
                    },
                    required: ["prompt_de","kind","skill","correct_answer"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_questions" } },
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte, réessayez plus tard" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error("AI gateway " + r.status);
    const j = await r.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { questions: [] };
    const questions = (parsed.questions || []).map((q: any) => ({ ...q, level, source, points: q.points || 1 }));

    return new Response(JSON.stringify({ questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
