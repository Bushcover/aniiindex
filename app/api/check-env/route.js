// TEMPORARY diagnostic route — added to debug NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY not reaching Vercel. Delete this file once
// the Supabase env var issue is confirmed fixed.
//
// This reports what this route handler's live process.env sees right now
// (route handlers are dynamic Node functions, not statically inlined the
// way NEXT_PUBLIC_ vars are for the browser JS bundle — confirmed locally:
// building with these vars absent, then starting the server with them
// present, still produced the real values here, not a stale build-time
// snapshot). If this route shows the values as missing, they are not
// reaching this deployment's server process at all — most likely because
// the Vercel env vars are scoped to "Production" only, and this specific
// deployment (e.g. a preview deploy from a non-main branch) is a Preview
// deployment, which doesn't get Production-scoped vars.

export const dynamic = "force-dynamic";

function mask(value) {
  if (!value) return null;
  if (value.length <= 12) return `${value} (len ${value.length})`;
  return `${value.slice(0, 10)}…${value.slice(-4)} (len ${value.length})`;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const present = Boolean(url) && Boolean(anonKey);

  return Response.json({
    checkedAt: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV ?? null, // "production" | "preview" | "development" | null (not on Vercel)
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    NEXT_PUBLIC_SUPABASE_URL: url ?? null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(anonKey),
    diagnosis: present
      ? "Both values are present in this deployment's server process."
      : `Missing here. Check "vercelEnv" above — if it's "preview" and the Supabase vars in Vercel are scoped to Production only, that's the cause: add them for Preview too (or All Environments), then redeploy.`,
  });
}
