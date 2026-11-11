# Verification record

Verified on 10 November 2026, macOS Apple Silicon, Node 24.12, Python 3.11, Anki 26.9.4, Google Chrome through Playwright.

- `npm run build`: passed TypeScript and the Vite production build. Approximately 92 KB compressed application JavaScript and 6 KB compressed CSS; the native engine runs locally outside the browser bundle.
- `npm test`: 7 integration tests passed. Fresh native Anki collections covered FSRS memory-state writes, reveal-before-rating, stale/duplicate answer rejection, native undo, daily limits, no early learning steps, Unicode/quoted CSV/duplicates/errors, safe rendering and request boundaries, edit/pause/delete, modern `.apkg` cloze/media import, export and native re-import, and malformed package recovery.
- `npm run test:e2e`: 2 browser tests passed. The full flow covers sample opt-in, answer hiding, written attempt, reveal/rate/undo, Quizlet text preview/commit, add/edit/reload, settings and backup download. The focused regression test checks question/answer/completion focus, Space and numeric shortcuts, long-answer position stability at 1440px and 390px, and import format selection with Enter.
- Automated axe WCAG A/AA and WCAG 2.1 AA checks passed on the tested desktop Today/study and mobile Today views. This is not a claim of exhaustive manual assistive-technology certification.
- Desktop (1440px) and mobile (390px) captures inspected. No horizontal overflow in the tested mobile Today, study, or long-answer states. Screenshot-only compositor artifacts were recaptured rather than treated as UI defects.
- Independent Impeccable finish review identified four material fixes. Its verdict pass scored all four resolved and returned `ship` at that scope: study focus, control contrast, stationary question on reveal, and import keyboard semantics.
- Impeccable's launcher/concept/detector could not run because its binary was not installed and its cache setup was unavailable under the initial sandbox. References were read directly. No automated Impeccable detector pass is claimed.
- One upstream Starlette/AnyIO deprecation warning appeared in the Python test runner. Tests passed; the warning does not affect the observed application flow.

All integration/browser tests use temporary collections. The running app uses its own `.data` collection, separate from an existing Anki desktop profile. No real user Anki/Quizlet export was supplied; compatibility was exercised with native-engine-generated packages and representative text fixtures. Add-on-dependent decks and the renderer exclusions documented in README.md remain outside the tested compatibility claim.


## Final publication checks — 10 November 2026

- Production build passed (about 97 KB gzipped JavaScript).
- 12 native integration tests passed, covering Anki Star mixed notes, literal-text safety, duplicate handling, injected rollback, source/ID preservation, template cleanup, APKG round-trip, typed answer presentation, FSRS/undo and preferences.
- 5 browser journeys passed, including edited-draft error focus/retry, per-kind and global suggestion persistence, Answer-first note fields, 200% root text size, desktop/mobile rendering and automated accessibility checks. Tests use disposable data.
- Impeccable’s scoped finish review marked both material fixes resolved and returned ship. Apple Design Skill review and limits are recorded separately.
- The running collection retained its card and completed-review counts across the service/layout migration. No learner collection, media, backups or private coursework is included in the public source repository.
- GitHub Actions will run the same build/native/browser checks on Ubuntu. Local results above are macOS evidence; hosted CI status is tracked separately.


## Folder hierarchy extension — 10 November 2026

- Production build, 13 native integration tests and 6 browser journeys passed.
- New native coverage checks nested creation, folder aggregate counts, parent-folder study, duplicate/missing-parent errors, persistent empty folders and unchanged card identities/review logs after reopening the collection.
- New browser coverage imports a four-level native path, expands/collapses with keyboard and pointer, searches through collapsed ancestors, opens breadcrumbs, creates a subfolder and a deck in it, verifies persistence, and recovers from a duplicate-name error. A folder with both direct cards and child decks is included.
- Desktop (1440px), mobile folder contents (390px) and mobile creation captures inspected. No horizontal overflow in the tested mobile states; axe WCAG A/AA and WCAG 2.1 AA checks passed on the tested folder views.
- The Impeccable detector ran for this extension; it reported typography/palette advisories, including existing stylesheet values. Existing design tokens and system files are preserved for this ordinary extension.
- Local service update verified all cards, notes and review records unchanged using full-row digests while the collection was closed, then restarted the service successfully.
- Independent Impeccable review returned `ship` for the folder extension with no material fixes. Advisory: indentation is capped after four levels to protect narrow layouts; opening a folder resets the visible depth and breadcrumbs preserve its ancestry.


## Oftly brand redesign — 10 November 2026

- Implemented the supplied brand guide across Today, study, folders, authoring, imports, progress and settings. Typography is self-hosted; the logo and favicon are SVG.
- Production build passed. JavaScript is approximately 98 KB gzipped; CSS approximately 7 KB. Five local WOFF2 files total approximately 302 KB and carry their OFL licences.
- All 13 native integration tests and 6 browser journeys passed. The large-text regression now includes a 320px viewport with a 30px root size, covering wrapped header actions, equal-width mobile navigation and long backup controls.
- Desktop 1440px and mobile 390px captures inspected, including source/ID study presentation, compact ratings, folder creation, imports and suggestion settings. Additional 1280px Today, 800px Progress and 320px Settings checks found no horizontal overflow at normal text size. Font checks confirmed both intended families loaded; the checked routes made no external requests.
- Impeccable detector ran once for the redesign: 166 palette/type advisories against the old design-system documentation and zero non-advisory findings. The design system is refreshed from the supplied brand and finished implementation.
- Screenshot timing now waits for font readiness and completes finite animations, so captures show the final marigold recall accent. Public README screenshots contain only synthetic test cards and embedded capture provenance.
- The finish review identified a clipped retention value at enlarged text size. Its verdict pass marked the fix resolved and returned `ship` at that scope. The browser regression measures room for the selected value plus padding and native arrow.
- Restarted the updated local service and verified unchanged deck IDs, card count and completed-review count.


## Quieter interface — 10 November 2026

- Replaced the dark rail and dashboard hero with a light top navigation and one deck list. Moved weekly activity to Progress; reduced headlines, filled panels and decorative feedback. Study cards use plain question/answer content, compact ratings and an expandable rating guide. Import help and advanced options are collapsed by default.
- Native and browser production builds passed. All 6 native browser journeys and 7 browser-only journeys passed, covering imports, folders, study, keyboard shortcuts, backup, persistence, offline reload and HTML safety. The scheduling/storage implementations are unchanged.
- Inspected desktop and mobile screenshots. Additional checks covered Decks, Import, Progress and Settings at 320, 390, 800 and 1360px, with no horizontal overflow. A 320px Settings view with a 30px root font also passed; automated WCAG A/AA checks found no violations in the checked settings view. Existing journey accessibility checks also passed.
- Updated the design contract and public screenshots to match the quieter interface. Screenshot content is synthetic.


## Queue counts and repeat countdown — 10 November 2026

- Added New / Learning / Due counts to deck rows, deck/folder summaries and study. Learning includes pending intraday steps without making them available early. The session tally counts answers marked Again; undo removes the reverted answer. The countdown uses the selected deck/folder's actual next learning time.
- Native regression covers parent/child aggregation, waiting vs ready, unrelated decks, due reviews, suspension and undo. It exposed and fixed native deck-selection operations displacing the answer targeted by Undo.
- Browser regression covers Again, undo, scoped counts, the live countdown reaching zero, reopening the repeat, visible mobile session totals and enlarged text. All 16 native tests, 6 native browser journeys and 8 browser-only journeys passed. Final checks also cover mobile tally visibility, larger text and automatic study-button availability when a repeat becomes due.
- Queue terminology follows the [Anki study overview](https://docs.ankiweb.net/manual/studying). Counts are cards, not remaining repetitions or a claim of mastery.

## Public introduction and optional accounts — 10 November 2026

- Both production builds pass. Final local suites: 16 native integration tests, 6 native browser journeys, 8 browser-only journeys and 10 account/landing tests. npm audit reports zero vulnerabilities; the local database schema linter reports no errors.
- The new tests use a disposable localhost Supabase stack. They cover anonymous rejection, account and media isolation, direct-write rejection, revision conflicts, immutable uploads, two-device FSRS review/history/media sync, same-filename media replacement, offline edits, sign-out isolation, a queued save during an identity change, email-link PKCE, conflict recovery and authenticated account deletion.
- PostgreSQL JSONB object key ordering is ignored in record comparison, preventing unchanged server records from becoming false conflicts. Sync requests bind to the initiating identity. Snapshots and planner saves recheck identity inside the storage lock.
- The four-question planner uses disclosed time assumptions and no claimed mastery or grade predictions. Guest study remains available. Desktop and 390px mobile captures, normal-motion rating/return states, reduced-motion views, overflow checks and automated accessibility checks passed.
- Independent Impeccable review returned `ship` for the material fixes: the connected sample-card story, readable mobile graph labels, heading whitespace and persisted product/design scope. Existing tokens and assets are preserved. The detector ran once with advisory findings only. No new raster assets ship.
- Hosted Supabase migration and deletion function deployed. Live anonymous card/RPC/deletion requests return 401. Google OAuth is in production, and a real basic-identity login completed through Supabase back to the local frontend. Resend's verified Oftly sender delivered a sign-in email to the owner's account. Email callback completion is additionally covered by the local PKCE journey; the production email was verified as delivered, not opened during testing.
- Publication scan found no private credential patterns in tracked/publishable files. Backend secrets, project key dumps and private collections are ignored. The client includes the intended public Supabase URL and publishable key.
- This records local and provider verification. GitHub CI is checked separately after pushing. No Vercel deployment command was run. Provider quotas, session expiry while offline and retained device copies are described in the account guide.


## Compact guided setup — 11 November 2026

- Replaced the tall scroll introduction with a gated sample-card trial, study setting, current method, hours/minutes, a short plan and optional sign-in. Removed subject lists, card counts, goal horizons and scroll-only calls to action. Daily time accepts 5 minutes through 24 hours; the result is a disclosed starting allocation, not an enforced study limit or efficacy prediction.
- Browser production build passed. Removed Motion and its dependencies; the landing JavaScript chunk is approximately 9.74 KB (3.53 KB gzip). The existing brand tokens and assets are preserved.
- All 10 local account/landing tests and 8 browser-only journeys passed. The changed flow covers reveal/rating gates, keyboard progression and heading focus, an eight-hour day, Back and reload persistence, exact plan saving, guest continuation, existing account handoff, 5-minute/24-hour bounds and legacy plan labels. The account suite also retains its isolation, sync, offline, conflict, media, deletion and PKCE coverage.
- Inspected desktop 1440px, tablet 800px and phone 390/320px captures, plus mobile setting, time, plan and account screens. The first view fits its viewport; checked views pass automated accessibility checks. The account step remains within the width at 320px with a 30px root font.
- Impeccable detector ran once: 16 advisories and no primary findings. No new visual world, raster assets or design tokens were introduced.
- Fresh independent Impeccable review returned `ship` for this user-directed refinement after inspecting all eight captures, relevant implementation and persisted scope; no material fixes were identified. Dependency audit reports zero vulnerabilities.
