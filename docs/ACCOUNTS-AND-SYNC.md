# Accounts and sync

Guest study remains local. Optional Google or email-link accounts synchronize the browser edition's decks, notes, FSRS memory state, review history, media, preferences and saved study plan. The native Anki edition is separate. There is no AnkiWeb synchronization.

## Using an account

Start from the planner or Sign in. Open an email sign-in link in the same browser that requested it: PKCE binds the link to that browser. Google requests basic identity only. After sign-in, Account shows synchronization status, a manual sync action, exportable conflict recovery, sign-out and account deletion.

Guest cards are not uploaded automatically. An empty account offers an explicit copy from the device's guest library. To combine populated libraries, export/import deliberately; the app does not silently merge colliding Anki identities between guest and account libraries. Restoring an Oftly backup can replace matching notes and progress; export both libraries before combining them.

Offline edits remain in IndexedDB and synchronize when connectivity returns. Opening a signed-in library after its stored authentication session expires can require reconnecting and signing in again; the local data is retained. A three-way record merge combines independent changes. If two devices edit the same record, the learner chooses which library to continue with; both copies remain exportable. This can also happen when both devices review the same card offline. Download recovery copies before choosing. Synchronization is not a replacement for backups.

Ordinary sign-out leaves the account's offline database on the device, separate from guest storage. Clear site storage on shared devices. Account deletion removes private server attachments and the identity (cascading card data), then removes this browser's account cache. Other offline devices can still hold copies. Deletion may need retrying if attachment cleanup fails.

## Hosted configuration

Oftly uses Supabase project `bhapnkflyqvpfcmqnrcr` in Ireland. `src/lib/cloud/config.ts` contains only its public URL and publishable key. Access depends on authentication and row-level policies, not on hiding that key. Google and Resend secrets are stored in Supabase settings. The Resend key can only send using `oftly.vivantaneja.com`. It has no account-wide administration permission.

The canonical frontend is `https://oftly.vivantaneja.com`. Supabase redirect allowlists include the exact canonical root and `http://127.0.0.1:5174/` for local verification. Google redirects only to `https://bhapnkflyqvpfcmqnrcr.supabase.co/auth/v1/callback`. Preview origins need their own exact Supabase redirect entry; a preview is not automatically an authorized callback.

For a fork:

1. Create your own Supabase project. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using `.env.example`; never use a secret/service-role key in Vite variables.
2. Link using `npx supabase link`, then apply the committed migration with `npx supabase migration up --remote --yes` after inspecting the target project.
3. Adjust the exact frontend origins in `supabase/functions/delete-account/index.ts` and the CSP host in `vercel.json`. Deploy with `npx supabase functions deploy delete-account --yes`.
4. Configure Supabase site URL and exact allowed redirect URLs. Configure Google OAuth with the new project's exact callback and basic identity scopes. Provide a real homepage and public privacy page.
5. Configure custom SMTP with a verified domain and a sending-only key. Set the sender name/address, TLS host/port and provider credentials in Supabase, never frontend files.
6. Review provider quotas, email rate limits, backups and operational logs. The free tiers are bounded; this repository makes no availability guarantee. Rotate SMTP/OAuth credentials in their providers and update Supabase if access is lost or exposed.

`supabase/config.toml` describes the **local test stack**, not a production auth configuration. Do not push the whole local config into production. Private CLI outputs/passwords belong only in ignored `supabase/.temp/`, with restricted permissions. Do not commit them.

## Local verification

Node 24 and the pinned Supabase CLI are installed by `npm ci`. The managed native stack requires no Docker on supported hosts. Tests refuse to run against any API URL except localhost port 54321.

```sh
npx supabase start --runtime native --exclude realtime,studio,analytics,pooler --eager
npx supabase migration up
mkdir -p supabase/.temp
npx supabase status --output-format json > supabase/.temp/local-status.json
npm run test:cloud
npx supabase db lint --schema public --fail-on warning
npx supabase stop
```

Tests create synthetic users and local Mailpit email, exercise two browser contexts, and delete only those test users. Never replace the local status file with production keys. The status file contains local administrative credentials and is ignored by Git.

The migration and deletion function are the authorization boundary. Keep database row-level security and RPC grants in review whenever adding a record type or changing access. Media is immutable and scoped to the caller's ID; unused uploads can remain until account deletion. Storage is not end-to-end encrypted, and service administrators can access data.
