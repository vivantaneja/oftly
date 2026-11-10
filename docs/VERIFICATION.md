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
- Local service update verified all 39 cards, 39 notes and 8 review records unchanged using full-row digests while the collection was closed, then restarted the service successfully.
- Independent Impeccable review returned `ship` for the folder extension with no material fixes. Advisory: indentation is capped after four levels to protect narrow layouts; opening a folder resets the visible depth and breadcrumbs preserve its ancestry.
