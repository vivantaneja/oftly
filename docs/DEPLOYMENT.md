# Deploy the browser edition

The public site is a static Vite app. Its FSRS scheduler, imports and storage run on the visitor's device. Do not deploy the single-collection Python service as a public backend.

1. Import `vivantaneja/oftly` into Vercel, using the repository root and the latest `main` commit.
2. Use Node.js **24.x** and framework **Vite**. Remove any old FastAPI/Python override from a failed deployment.
3. The checked-in configuration sets install to `npm ci`, build to `npm run build:web`, and output to `dist-web`.
4. No environment variables, Anki wheel or Python runtime are needed. The build command sets `VITE_STORAGE=browser` itself.
5. Deploy the latest commit. Check creating a deck, reviewing a card, refreshing, and downloading/restoring an Oftly backup before sharing it.

If logs say `uv pip install` or complain about `anki==26.9.4`, they are still using the old/native configuration. Redeploy the latest commit with the settings above. Redeploying an old commit will not include these changes.

For `oftly.vivantaneja.com`, add that exact subdomain to the Vercel project's Domains page, then enter the exact CNAME target Vercel provides for host `oftly` in Namecheap Advanced DNS. Leave root-domain, mail and other records unchanged. The repository contains no DNS credentials.

Browser data is origin-specific. Preview URLs and the final custom domain have separate collections. Transfer through **Download Oftly backup**, then **Import → Anki / backup** on the destination. Prefer the final domain before serious studying.

`dist-web` contains only public application assets. `.data`, `.venv`, environment files, Python sources and private packages are excluded from upload. CSP permits same-origin SQLite WASM but blocks third-party media, embedded pages and form submissions. Fonts are self-hosted.

Offline caching holds public assets only; the collection lives in IndexedDB. Close existing tabs to permit an updated service worker to activate. Keep regular backups: browsers may refuse persistent-storage requests and may erase local data.

If using an older Vercel CLI, update it with `npm i -g vercel@latest` before linking and deploying.

## Optional accounts

The browser build now supports Google/email accounts and private cross-device sync through Supabase. The Oftly installation includes only its public project URL and publishable key; secret SMTP/OAuth credentials live in the backend. A fork should use its own project and exact redirect allowlist. Follow [account setup and operations](ACCOUNTS-AND-SYNC.md). The native Python service remains localhost-only and must not be deployed as the account backend.
