// Avatar TTS — proxy to Lovable AI Gateway, returns MP3 bytes.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { rateLimit } from "../_shared/rateLimit.ts";

const ALLOWED_VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]);

function getPublishableKey(): string {
  const legacyKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyKey) return legacyKey;
  const configured = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!configured) return "";
  try {
    const keys = JSON.parse(configured) as Record<string, string>;
    return keys.default ?? "";
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const publishableKey = getPublishableKey();
    if (!token || !supabaseUrl || !publishableKey) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = rateLimit(`avatar-tts:${user.id}`, 30, 60_000);
    if (!limit.ok) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after: limit.retryAfter }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfter),
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body.text ?? "").trim();
    const requestedVoice = String(body.voice ?? "sage");
    const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : "sage";
    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: "text too long (max 2000)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: text,
        voice,
        response_format: "mp3",
        instructions: "Speak clearly with a native German accent, natural teacher pace.",
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: "tts_failed", status: upstream.status, details: err }), {
        status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
