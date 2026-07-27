// Create a school (super_admin only) and optionally provision the owner account.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "not_authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rolesRows } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const roles = (rolesRows || []).map((r: any) => r.role);
    if (!roles.includes("super_admin")) {
      return json({ error: "not_authorized" }, 403);
    }

    const body = await req.json();
    const {
      name, slug, legal_name, city, country, phone, email, website, address, status,
      owner_email, owner_password, owner_name,
    } = body || {};
    if (!name || !slug) return json({ error: "missing_name_or_slug" }, 400);

    let owner_id: string | null = null;

    if (owner_email && String(owner_email).trim()) {
      const targetEmail = String(owner_email).trim().toLowerCase();

      // Try existing profile first
      const { data: prof } = await admin.from("profiles").select("user_id").ilike("email", targetEmail).maybeSingle();
      if (prof?.user_id) {
        owner_id = prof.user_id;
        if (owner_password) {
          await admin.auth.admin.updateUserById(owner_id, { password: String(owner_password) });
        }
      } else {
        // Create new auth user
        if (!owner_password || String(owner_password).length < 8) {
          return json({ error: "owner_password_required_min_8" }, 400);
        }
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email: targetEmail,
          password: String(owner_password),
          email_confirm: true,
          user_metadata: { display_name: owner_name || targetEmail.split("@")[0] },
        });
        if (cErr || !created?.user) return json({ error: cErr?.message || "create_user_failed" }, 400);
        owner_id = created.user.id;
        // approve profile + give school_admin role
        await admin.from("profiles").update({ approved: true }).eq("user_id", owner_id);
      }

      // ensure school_admin role
      await admin.from("user_roles").insert({ user_id: owner_id, role: "school_admin" }).then(() => {}, () => {});
    } else {
      // No owner provided: caller becomes the owner
      owner_id = caller.id;
    }

    const { data: school, error: sErr } = await admin.from("schools").insert({
      name: String(name).trim(),
      slug: String(slug).trim(),
      legal_name: legal_name || null,
      city: city || null,
      country: country || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      address: address || null,
      status: status || "active",
      owner_id,
    }).select("id").single();
    if (sErr) return json({ error: sErr.message }, 400);

    await admin.from("school_members").insert({
      school_id: school.id, user_id: owner_id, role: "owner",
      space_role: "school_admin",
      status: "approved",
      approved_by: caller.id,
      approved_at: new Date().toISOString(),
    }).then(() => {}, () => {});

    await admin.from("school_settings").insert({ school_id: school.id }).then(() => {}, () => {});

    return json({ id: school.id, owner_id });
  } catch (e: any) {
    return json({ error: e?.message || "unknown_error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
