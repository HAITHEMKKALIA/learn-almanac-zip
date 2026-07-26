// Save (upsert) an answer for an in-progress submission.
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
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, service);

    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { submission_id, question_id, answer } = await req.json();
    const { data: sub, error } = await admin.from("submissions").select("*").eq("id", submission_id).single();
    if (error || !sub) throw new Error("submission not found");
    if (sub.student_id !== user.id) throw new Error("forbidden");
    if (sub.status !== "in_progress") throw new Error("submission not active");
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) throw new Error("expired");

    const { data: existing } = await admin.from("submission_answers").select("id").eq("submission_id", submission_id).eq("question_id", question_id).maybeSingle();
    if (existing) {
      await admin.from("submission_answers").update({ answer, answered_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await admin.from("submission_answers").insert({ submission_id, question_id, answer });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
