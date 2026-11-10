import { createClient, type Session } from "@supabase/supabase-js";
import { publicCloud } from "./config";
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? publicCloud.url;
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  publicCloud.key;
export const cloudConfigured = Boolean(url && key);
export const cloud =
  url && key
    ? createClient(url, key, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
// Bind every sync to its initiating identity, including during an account change.
export function clientFor(session: Session) {
  if (!url || !key)
    throw Error("Accounts are not configured on this installation.");
  return createClient(url, key, {
    accessToken: async () => session.access_token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export const redirectURL = () => `${location.origin}${location.pathname}`;
