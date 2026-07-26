// Edge function TTS — sert un MP3 généré par Google Translate (gratuit, marche
// sur tous les smartphones y compris Huawei sans Google Mobile Services).
// Si ELEVENLABS_API_KEY est défini, utilise ElevenLabs en priorité (meilleure qualité).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ELEVEN_VOICES: Record<string, string> = {
  "de-female": "EXAVITQu4vr4xnSDxMaL", // Sarah
  "de-male": "JBFqnCBsd6RMkjVDRZzb",   // George
  "fr-female": "XrExE9yKIg1WjnnlVkGX", // Matilda
  "fr-male": "onwK4e9ZLuTAKqWW03F9",   // Daniel
  "ar-female": "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "ar-male": "pqHfZKP75CvOlQylNhV4",   // Bill
};

function chunkText(text: string, max = 190): string[] {
  const out: string[] = [];
  let s = text.trim();
  while (s.length > max) {
    let cut = s.lastIndexOf(" ", max);
    if (cut < 60) cut = max;
    out.push(s.slice(0, cut));
    s = s.slice(cut).trim();
  }
  if (s) out.push(s);
  return out;
}

async function googleTranslateTts(text: string, lang: string): Promise<Uint8Array> {
  const parts = chunkText(text);
  const buffers: Uint8Array[] = [];
  for (const p of parts) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(p)}&tl=${lang}&client=tw-ob&ttsspeed=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Mobile Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`google tts ${res.status}`);
    buffers.push(new Uint8Array(await res.arrayBuffer()));
  }
  const total = buffers.reduce((n, b) => n + b.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const b of buffers) { merged.set(b, off); off += b.length; }
  return merged;
}

async function elevenLabsTts(text: string, lang: string, gender: string): Promise<Uint8Array | null> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return null;
  const voiceId =
    ELEVEN_VOICES[`${lang}-${gender}`] ||
    ELEVEN_VOICES[`${lang}-female`] ||
    ELEVEN_VOICES["de-female"];
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      }),
    }
  );
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth guard — prevent unauthenticated TTS/ElevenLabs credit abuse
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    const { rateLimit } = await import("../_shared/rateLimit.ts");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rl = rateLimit(`tts:${uid}`, 60, 60_000);
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
      });
    }

    let text = "";

    let lang = "de";
    let gender = "female";

    if (req.method === "GET") {
      const u = new URL(req.url);
      text = u.searchParams.get("text") ?? "";
      lang = (u.searchParams.get("lang") ?? "de").slice(0, 2);
      gender = u.searchParams.get("gender") ?? "female";
    } else {
      const body = await req.json().catch(() => ({}));
      text = String(body.text ?? "");
      lang = String(body.lang ?? "de").slice(0, 2);
      gender = String(body.gender ?? "female");
    }

    text = text.replace(/[\u0000-\u001F]/g, " ").trim().slice(0, 800);
    if (!text) {
      return new Response(JSON.stringify({ error: "missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { de: "de", fr: "fr", ar: "ar", en: "en" };
    const tl = langMap[lang] || "de";

    let audio = await elevenLabsTts(text, lang, gender).catch(() => null);
    if (!audio) audio = await googleTranslateTts(text, tl);

    return new Response(audio, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "tts error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
