// Edge function: start (or resume) an exam session.
// - Verifies the student is a member of the class
// - Verifies the assignment is open and within the time window
// - Creates (or resumes) a submission with a server-computed expires_at
// - Returns the question list WITHOUT correct_answer / explanations
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

    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { assignment_id } = await req.json();
    if (!assignment_id) throw new Error("assignment_id required");

    const { data: a, error: aErr } = await admin.from("assignments").select("*").eq("id", assignment_id).single();
    if (aErr || !a) throw new Error("assignment not found");

    if (a.status !== "open") throw new Error("Examen non ouvert");
    const now = new Date();
    if (a.available_from && new Date(a.available_from) > now) throw new Error("Examen pas encore disponible");
    if (a.available_until && new Date(a.available_until) < now) throw new Error("Examen terminé");

    // Membership check
    const { data: member } = await admin.from("class_members").select("id").eq("class_id", a.class_id).eq("student_id", user.id).maybeSingle();
    if (!member) throw new Error("Vous n'êtes pas inscrit à cette classe");

    // Existing in_progress submission ?
    let { data: sub } = await admin.from("submissions").select("*").eq("assignment_id", assignment_id).eq("student_id", user.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle();

    if (sub && sub.status === "submitted") {
      // attempts limit
      const { count } = await admin.from("submissions").select("*", { count: "exact", head: true }).eq("assignment_id", assignment_id).eq("student_id", user.id).eq("status", "submitted");
      if ((count ?? 0) >= a.max_attempts) throw new Error("Nombre maximum de tentatives atteint");
      sub = null;
    }

    if (!sub || sub.status === "not_started") {
      const expires_at = new Date(now.getTime() + a.duration_minutes * 60_000).toISOString();
      const ins = await admin.from("submissions").insert({
        assignment_id, student_id: user.id,
        status: "in_progress", started_at: now.toISOString(),
        expires_at, attempt_no: (sub?.attempt_no ?? 0) + 1,
      }).select().single();
      if (ins.error) throw ins.error;
      sub = ins.data;
    } else if (sub.status === "in_progress" && sub.expires_at && new Date(sub.expires_at) < now) {
      // expired -> auto submit
      await admin.from("submissions").update({ status: "submitted", submitted_at: now.toISOString() }).eq("id", sub.id);
      throw new Error("Le temps imparti est écoulé");
    }

    // Fetch questions
    const { data: aq } = await admin.from("assignment_questions")
      .select("position, points_override, question_id, question_bank(id, kind, skill, level, prompt_de, prompt_fr, prompt_ar, options_de, options_fr, options_ar, audio_text, points)")
      .eq("assignment_id", assignment_id)
      .order("position");

    let questions = (aq ?? []).map((r: any) => ({
      ...r.question_bank,
      points: r.points_override ?? r.question_bank.points,
      position: r.position,
    }));
    if (a.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Existing answers
    const { data: answers } = await admin.from("submission_answers").select("question_id, answer").eq("submission_id", sub.id);

    return new Response(JSON.stringify({
      submission: sub,
      assignment: { id: a.id, title: a.title, description: a.description, level: a.level, duration_minutes: a.duration_minutes, lockdown_strict: a.lockdown_strict, passing_score: a.passing_score },
      questions,
      answers: answers ?? [],
      server_now: now.toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
