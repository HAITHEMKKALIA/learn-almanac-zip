// Generates vocabulary entries for a (level, theme_slug) using Lovable AI and inserts them.
// Official global vocabulary: platform owner only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isPlatformOwner = roles?.some((r) => r.role === "super_admin");
    if (!isPlatformOwner) return json({ error: "Forbidden" }, 403);

    const { level, theme_slug, count = 30 } = await req.json();
    if (!level || !theme_slug) return json({ error: "level and theme_slug required" }, 400);

    const { data: theme } = await admin
      .from("vocab_themes")
      .select("*")
      .eq("level", level)
      .eq("slug", theme_slug)
      .maybeSingle();
    if (!theme) return json({ error: "Theme not found" }, 404);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du bist ein DaF-Lehrwerk-Autor (Niveau Netzwerk neu). Antworte NUR über das Tool." },
          {
            role: "user",
            content: `Erzeuge ${count} ESSENZIELLE Vokabeln für Niveau ${level}, Thema "${theme.name_de}" (${theme.name_fr}). Substantive MIT Artikel und Plural. Beispielsatz natürlich, kurz, niveaugerecht. Übersetzungen ins Französische und Arabische.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_vocab",
              description: "Speichere die Vokabelliste",
              parameters: {
                type: "object",
                properties: {
                  entries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string" },
                        article: { type: "string", enum: ["der", "die", "das", ""] },
                        plural: { type: "string" },
                        pos: { type: "string", description: "noun, verb, adj, adv, ..." },
                        translation_fr: { type: "string" },
                        translation_ar: { type: "string" },
                        example_de: { type: "string" },
                        example_fr: { type: "string" },
                      },
                      required: ["word", "translation_fr", "example_de", "pos"],
                    },
                  },
                },
                required: ["entries"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_vocab" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limit, réessaie plus tard" }, 429);
      if (aiResp.status === 402) return json({ error: "Crédits IA épuisés" }, 402);
      return json({ error: "AI gateway error" }, 500);
    }
    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "No tool output" }, 500);
    const parsed = JSON.parse(args);
    const entries = (parsed.entries || []).map((e: any) => ({
      word: String(e.word).trim(),
      article: e.article && ["der", "die", "das"].includes(e.article) ? e.article : null,
      plural: e.plural || null,
      pos: e.pos || null,
      level,
      theme_slug,
      translation_fr: e.translation_fr || null,
      translation_ar: e.translation_ar || null,
      example_de: e.example_de || null,
      example_fr: e.example_fr || null,
    }));

    const { error: insErr, data: inserted } = await admin
      .from("vocab_entries")
      .upsert(entries, { onConflict: "level,word,article", ignoreDuplicates: true })
      .select("id");
    if (insErr) {
      console.error("insert err", insErr);
      return json({ error: insErr.message }, 500);
    }
    return json({ ok: true, inserted: inserted?.length ?? 0, total: entries.length });
  } catch (e) {
    console.error("vocab-generate error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
