import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listMyClasses from "./tools/list-my-classes";
import listMyCertificates from "./tools/list-my-certificates";
import listMyHomework from "./tools/list-my-homework";

// Direct Supabase issuer required by mcp-js; project ref is inlined by Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "deutsch-meister-mcp",
  title: "Deutsch Meister",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Deutsch Meister learning platform. Callers act as their own signed-in user; row-level security applies to every query.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listMyClasses, listMyCertificates, listMyHomework],
});
