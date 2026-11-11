# Publication review: 10 November 2026

Scope: repository contents/history, dependencies, imported HTML/media, compressed packages, browser persistence and public hosting. This is an engineering review with regression checks, not a guarantee that every vulnerability has been found.

## Findings addressed

- The native service owns one collection and is intentionally unauthenticated on localhost. Publishing it would not isolate visitors. The public build now uses browser-only FSRS-6 and IndexedDB, with no public Python API. Optional account sync uses an authenticated Supabase API and private media bucket. The native edition retains loopback, Host and Origin protections.
- Updated FastAPI, Starlette, Bleach, python-multipart and pytest to resolve reported dependency advisories. Both lockfiles are committed. A considered Vercel configuration helper introduced vulnerable transitive dependencies; it was removed in favor of JSON configuration.
- Imported HTML could activate app layout classes; unquoted remote-media attributes were insufficiently filtered. Storage and display now allow basic formatting, the cloze class, local media and safe source-link schemes. Scripts, styles, forms, embedded pages, arbitrary classes and remote media are stripped. Links use `noopener noreferrer`.
- Modern APKG files contain inner Zstandard compression, which ZIP limits alone did not bound. Both editions now bound inner expansion and decoder windows. Browser parsing runs in a worker with a 20-second timeout, 50 MB input and 128 MB expanded limits; the native guard caps expansion at 250 MB. Duplicate/path-containing archive names are rejected. SVG media is not imported. Browser media names use content hashes to avoid collisions.
- Browser mutations use Web Locks and IndexedDB revision checks. Stale tokens cannot rate a card after another tab changes the collection. Collection and media writes share one transaction; quota errors do not report success. A 45 MB collection budget keeps backups within the 50 MB restore limit.
- Backups are validated as untrusted input before persistence. Matching backup records restore the saved state; ordinary APKG imports skip existing notes to protect current edits and progress.
- Native note storage retains media basenames so exports include referenced files; `/media/` is a presentation route only.

## Evidence

- Scanning all historical text blobs found package-integrity checksums only, with no confirmed credentials. Working-tree scanning found an ignored pytest cache-tag false positive. Private collections, environment files and Vercel credentials are not tracked.
- Dependency audits are run against the npm lock and fully pinned Python lock. Rerun them as advisories change; a clean audit is not proof that all dependencies are vulnerability-free.
- Regression journeys cover scheduling, due-time gating, daily limits, undo, persistence, fresh-profile backup restoration, official Anki legacy/modern packages and images, metadata, duplicates, malicious HTML, stale cross-tab reviews, cloze/reversed cards, offline reload and malformed packages. Existing native tests remain in CI.
- Static-host headers restrict scripts and workers to the app origin; connections additionally allow the exact Oftly Supabase host. SQLite needs `wasm-unsafe-eval`, not unrestricted JavaScript `unsafe-eval`. Framing, objects, forms and unnecessary device permissions are disabled.

## Boundaries

Cards are not encrypted against someone with access to the same browser profile or a privileged extension. Guest storage is device/profile/origin-specific and can be erased by site-data clearing or eviction. Signed-in libraries use separate browser databases and optional private cloud sync. Ordinary sign-out leaves an offline copy on the device; clear site storage on shared devices. Keep exported backups. Offline caching contains only public assets.

Browser import intentionally supports less than Anki's full template/add-on system. Check imported cards. Anki dates/history and available FSRS memory values can be retained, but default FSRS-6 parameters, day cutoff and learning-step policies can produce different schedules. There is no claim of exact equivalence or improved learning outcomes.

The native backend remains localhost-only. It is not the backend for the public account edition. Privileged browser extensions, hosting-provider access, upstream supply-chain compromise and adversarial native-decoder exploitation are outside what these tests can rule out.

## Recheck

```sh
npm audit
uvx pip-audit --disable-pip --no-deps -r requirements.lock.txt
npm test
npm run build
npm run test:e2e
npm run build:web
.venv/bin/python -m tests.web.make_fixtures
npm run test:web
```

## Account extension: 10 November 2026

Supabase provides PKCE Google/email-link authentication. The browser includes only a publishable key, never an administrator or service-role key. Database tables use per-user row-level security; authenticated reads are restricted to the caller, direct writes are revoked, and two authenticated RPCs enforce account ownership, size limits and revision-checked transactions. Anonymous access is rejected. Media is private, content-hashed and immutable, under a caller-owned path. Requests are bound to the initiating account token to prevent account-switch races.

IndexedDB revisions and Web Locks protect local writes. A three-way merge combines independent records; concurrent changes to the same record retain both versions for explicit resolution. Recovery copies can be exported. The deletion function verifies the bearer token independently, restricts allowed origins, requires an explicit confirmation string, removes owned attachments and deletes that identity. It cannot delete an account selected by a client-supplied ID.

Automated tests use a separate local Supabase stack and synthetic users. They check account/media isolation, anonymous access, write conflicts, real email-link PKCE callbacks, two-browser sync, offline edits and conflict recovery. Production configuration has separate credentials. The Resend key is sending-only and scoped to the Oftly mail domain; the Google web client uses the exact production callback and basic identity scopes.

Limitations: this is access-controlled storage, not end-to-end encryption. Service operators can administer data. Local account copies survive ordinary sign-out; deletion cannot remotely erase another offline device. Failed uploads can leave unused private media until account deletion. Providers retain operational logs under their policies. Free-tier quotas and email limits can interrupt service; local study and backups remain available. Review [account operations](ACCOUNTS-AND-SYNC.md) before running a fork.
