import { createClient } from "npm:@supabase/supabase-js@2.119.0";
const origins = new Set([
  "https://oftly.vivantaneja.com",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:18766",
  "http://127.0.0.1:18767",
]);
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = {
    "Access-Control-Allow-Origin": origins.has(origin)
      ? origin
      : "https://oftly.vivantaneja.com",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST" || (origin && !origins.has(origin)))
    return new Response('{"error":"Not allowed"}', { status: 405, headers });
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token)
    return new Response('{"error":"Sign in first"}', { status: 401, headers });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);
  if (error || !user)
    return new Response('{"error":"Sign in again"}', { status: 401, headers });
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "delete my account")
    return new Response('{"error":"Deletion must be confirmed"}', {
      status: 400,
      headers,
    });
  try {
    // Only this authenticated user's immutable media folder is eligible.
    for (;;) {
      const { data, error } = await admin.storage
        .from("oftly-media")
        .list(user.id, { limit: 1000 });
      if (error) throw error;
      if (!data?.length) break;
      const removed = await admin.storage
        .from("oftly-media")
        .remove(data.map((x) => `${user.id}/${x.name}`));
      if (removed.error) throw removed.error;
    }
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw deleted.error;
    return new Response('{"deleted":true}', { headers });
  } catch {
    return new Response(
      '{"error":"Deletion could not finish. Some attachments may already be removed. Please retry."}',
      { status: 503, headers },
    );
  }
});
