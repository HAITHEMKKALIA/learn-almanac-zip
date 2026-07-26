// School admin/owner creates an approved teacher or student account (email + password).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "not_authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const { school_id, email, password, display_name, role, class_id } = body || {};

    if (!school_id) return json({ error: "missing_school_id" }, 400);
    if (!email || !password) return json({ error: "missing_email_or_password" }, 400);
    if (String(password).length < 8) return json({ error: "password_min_8" }, 400);
    if (!["teacher", "student"].includes(role)) return json({ error: "invalid_role" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Authorization: super_admin/admin OR owner of this school
    const { data: rolesRows } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const roles = (rolesRows || []).map((r: any) => r.role);
    let authorized = roles.includes("super_admin") || roles.includes("admin");
    if (!authorized) {
      const { data: mem } = await admin.from("school_members")
        .select("role").eq("school_id", school_id).eq("user_id", caller.id).maybeSingle();
      authorized = mem?.role === "owner" || roles.includes("school_admin");
    }
    if (!authorized) return json({ error: "not_authorized" }, 403);

    const targetEmail = String(email).trim().toLowerCase();
    let user_id: string | null = null;

    // Reuse existing profile if email exists
    const { data: prof } = await admin.from("profiles").select("user_id").ilike("email", targetEmail).maybeSingle();
    if (prof?.user_id) {
      user_id = prof.user_id;
      await admin.auth.admin.updateUserById(user_id, { password: String(password), email_confirm: true });
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: targetEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: { display_name: display_name || targetEmail.split("@")[0] },
      });
      if (cErr || !created?.user) return json({ error: cErr?.message || "create_user_failed" }, 400);
      user_id = created.user.id;
    }

    // Approve + name
    await admin.from("profiles").update({
      approved: true,
      ...(display_name ? { display_name } : {}),
    }).eq("user_id", user_id);

    // App role
    await admin.from("user_roles").insert({ user_id, role }).then(() => {}, () => {});

    // School membership
    const schoolRole = role === "teacher" ? "teacher" : "student";
    await admin.from("school_members").upsert({
      school_id, user_id, role: schoolRole,
      status: "approved", approved_at: new Date().toISOString(),
    }, { onConflict: "school_id,user_id" }).then(() => {}, () => {});

    // Optional class assignment for students
    if (role === "student" && class_id) {
      await admin.from("class_members").insert({ class_id, student_id: user_id }).then(() => {}, () => {});
    }

    return json({ user_id, email: targetEmail });
  } catch (e: any) {
    return json({ error: e?.message || "unknown_error" }, 500);
  }
});
