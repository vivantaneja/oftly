# Oftly

**A calmer way to study. Serious spaced repetition, simple flashcards, and cards you can take with you.**

Built by [Vivan Taneja](https://github.com/vivantaneja) and [Ashvant (@MilesatAshvantAnand)](https://github.com/MilesatAshvantAnand).

We built Oftly during our study period because we were fed up with how difficult Anki was to navigate, while Quizlet’s repetition didn’t feel rigorous enough for the way we wanted to learn. We wanted Anki’s memory scheduling in an interface that made sense immediately, with room to rethink how good flashcards are made.

Oftly is a local-first React web app backed by the **official Anki engine**. No account, subscription, analytics, or AI API key is needed. Your cards and review history live in a real Anki collection on your computer.

![Daily study view with a demonstration deck](docs/images/today.png)

## Features

- **Native FSRS scheduling:** retrieve, reveal, compare and rate. Real interval previews, compact Again/Hard/Good/Easy buttons, keyboard shortcuts and undo.
- **Anki and Quizlet imports:** preview modern/legacy APKG packages, or paste/upload Quizlet exports and CSV/TSV/text. Optionally keep Anki review history.
- **Structured cards:** question, answer, explanation, source and IDs stay distinct. Imported custom template CSS and scripts are removed from the app’s copy. Cloze, reversed and typed-answer cards use a consistent layout.
- **Optional writing guidance:** suggestions for splitting cards, long targets, vague cues, cloze structure and missing sources. Turn off any kind or all suggestions. Nothing is rewritten automatically.
- **Anki Star integration:** review, edit and select mixed-note JSON; preserve sources, explanations and tags; save selected drafts back to JSON.
- **Manual assistant handoff:** prepare source-grounded prompts, including explanation, comparison and application questions. Paste into your assistant and review the response. The app never sends coursework automatically.
- **Folders and subfolders:** Anki deck paths become an expandable hierarchy. Create folders, choose a location for new decks, search across nested decks and study an entire folder.
- **A complete local library:** create, search, edit, pause and delete notes; see actual review activity; export an Anki backup with supported media and scheduling.

![Study card with explanation, source and compact rating buttons](docs/images/study.png)

## Run locally

Tested on macOS Apple Silicon with **Python 3.11** and **Node.js 24**. The native Anki wheel must support your OS and Python version. Supplied scripts use macOS/Linux virtualenv paths.

```sh
git clone https://github.com/vivantaneja/recall.git
cd recall
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm ci
npm run build
npm start
```

Open [localhost:8766](http://127.0.0.1:8766). Stop with Ctrl+C. After installation/building, study works offline while the service runs. For development, `npm run dev` starts the engine on 8766 and Vite on 5173. Node 22.12+ is required; Node 24 is recommended.

On Windows, use `.venv\Scripts\python.exe` and the equivalent uvicorn command directly. Windows has not been verified.

## Learning, with evidence

The production scheduler is native FSRS, starting at 90% requested retention and 10 new cards per deck per day. Siblings are separated, due reviews come first, and learning steps are not silently fast-forwarded. Retention is a model target, not a guarantee; default parameters are not per-user optimization.

The learning layer adds source-grounded explanation/application prompts, corrective feedback, typed attempts and optional authoring guidance. We distinguish evidence-informed design from demonstrated improvements in learning. We compared **FSRS-7, SBD, neural predictors and KAR³L**; they remain research candidates, not silently installed schedulers or claims of universal superiority.

- [Learning evidence](docs/LEARNING-RESEARCH.md)
- [Engine comparison and evaluation plan](docs/ENGINE-COMPARISON.md)
- [Anki Star source review and integration](docs/ANKI-STAR-INTEGRATION.md)

## Your data and compatibility

Data lives under `.data/`, ignored by Git. Oftly owns a separate collection and does not open your installed Anki profile. Use **Settings → Download Anki backup** and keep a copy outside this project. Importing a backup merges matching notes. `RECALL_DATA_DIR` selects another app-owned directory.

Run one service per collection; exchange APKG files with Anki instead of opening the same database in two applications. The clean-layout migration saves `.data/before-clean-layout.apkg` before changing existing template designs. The server binds to `127.0.0.1`; this is a local app, not a public multi-user service. There is no AnkiWeb or cross-device sync.

| Format | Support and limits |
| --- | --- |
| Anki APKG | Native cards, note fields, history and supported media; 50 MB upload. Custom CSS/scripts removed. Image occlusion and add-on-dependent interactions may need editing. |
| Quizlet / text | Pasted exports, TXT/CSV/TSV, delimiter selection and preview. Two content columns; Quizlet images are not included in text exports. |
| Anki Star JSON | Basic, reversed, typing and cloze; source/explanation/tags. 500 notes / 2 MB. Plain text; exact first-field duplicates within a note type are skipped across decks. |
| Assistant workflow | Manual prompt copy/paste and reviewed drafts. No automatic AI generation, OCR, semantic grading or factual verification. |

Writing suggestions are local heuristics, not scientific word-count limits or guarantees. Check generated facts and sources.

## Development

```sh
npm test
npm run build
npm run test:e2e
```

Tests use disposable Anki collections, never the learner’s `.data`. Browser journeys cover import, study, undo, editing, backup, mixed note types, suggestion preferences, error recovery, field order, large text, responsive layout and automated accessibility checks. Tests use Google Chrome; install it or run `npx playwright install --with-deps chrome` in a suitable CI environment.

Stack: React, TypeScript, Vite, Lucide, DOMPurify, FastAPI and the pinned Anki Python/Rust engine. See [architecture](docs/ARCHITECTURE.md), [verification](docs/VERIFICATION.md), [design system](DESIGN.md), and the [Apple Design Skill review](docs/APPLE-DESIGN-REVIEW.md).

Issues and pull requests are welcome. Keep the core flow small, preserve card identities/history, and support learning claims with evidence. Use synthetic cards in reports. [Contributing guide](CONTRIBUTING.md).

## Credits and licence

Created by [@vivantaneja](https://github.com/vivantaneja) and [@MilesatAshvantAnand](https://github.com/MilesatAshvantAnand). Thanks to [Anki](https://apps.ankiweb.net/), the spaced-repetition research community and [Anki Star](https://github.com/MilesatAshvantAnand/anki-star).

**AGPL-3.0-or-later** — see [LICENSE](LICENSE). Vendored Anki Star modules retain their MIT licence. [Third-party notices](THIRD-PARTY-NOTICES.md).

Independent project; not affiliated with or endorsed by Anki, Quizlet or Apple.
