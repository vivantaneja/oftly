# Architecture and delivery notes

## What runs where

```text
React + TypeScript (Vite build)
        │ same-origin JSON requests; no external services
        ▼
FastAPI, bound to 127.0.0.1:8766
        │ one process / one event-loop owner
        ▼
Official anki 26.9.4 Python API → native Rust backend
        ├── .data/collection.anki2 (SQLite + native schema)
        └── .data/collection.media/
```

The actual Anki engine, requested explicitly by the user, owns scheduling, generated cards, note types, review logs, package imports/exports and undo. No JavaScript recreation of SM-2 or FSRS is used. We omit Anki's Qt desktop frontend; the browser is the interface. Python dependencies are isolated in `.venv`, with a locked frontend dependency tree in `package-lock.json`.

## Review lifecycle

`GET /api/study/next` selects a deck and calls `get_queued_cards()`. The service retains the native scheduling states and a started card timer, issuing an opaque session token. Only question HTML crosses this boundary. Repeating the request in the same scope returns the same question.

`POST /api/study/reveal` validates the token and returns sanitized answer HTML plus `describe_next_states()` labels. A rating before reveal is rejected. A valid rating goes through `build_answer()` and `answer_card()`, producing native FSRS memory state and a native revlog entry. Tokens are consumed so duplicate or stale clicks cannot schedule twice. UI mutations invalidate cached state. Undo invokes native collection undo and is available only for the most recent review in the current service session.

Anki counts, daily limits, deck selection, scheduling fuzz, learning steps, rollover and sibling burying remain native. New cards are limited per deck/preset, not as a global daily cap. The all-decks flow prioritizes decks with reviews/learning available, then new-only decks. It does not implement category-balanced interleaving. Learning look-ahead is zero, so a future learning step is not silently pulled into a session. Daily statistics use the engine's study-day cutoff; seven-day buckets use 24-hour offsets, so across a daylight-saving transition a historical bucket can differ from a calendar-local day by an hour.

## Storage and concurrency

Native collection mutations commit to SQLite. The service's async routes execute native operations synchronously on the same event-loop thread; collection objects are not shared across a thread pool. Run one uvicorn worker. Large imports block other requests during the native import; this is acceptable for the bounded single-user local app. Moving imports to an isolated worker would need a deliberate collection ownership protocol, not a generic executor.

Cards and history survive browser reload and server restart. Active review tokens and import previews do not; restart means opening a new study session or previewing again. Anki itself handles matching package note GUIDs. Text imports normalize visible question/answer pairs, deduplicate within the batch and against the same deck's Recall Basic notes. The custom Basic note type avoids collisions with imported or localized Basic types.

## Import transaction boundaries

1. Text parsing is non-mutating. It reports malformed rows and ignored extra columns; quoted delimiters and multiline quoted fields use Python's CSV parser. Preview produces a token.
2. Anki package preview writes an upload to a temporary directory, checks declared ZIP expansion, then imports it into a temporary native collection. The active collection is untouched.
3. Confirmed import calls the native importer on the active collection. Package deck names are retained. `with_scheduling` follows the checkbox; `with_deck_configs` is false to protect app study settings. Import warnings explain renderer limitations.
4. Successful package commits delete their temporary upload. Remaining previews are cleaned up on service shutdown. Tokens expire after an hour; a later preview is required after expiry. A service interrupted forcibly can leave temporary directories in the OS temp location.

The ZIP size check limits declared ZIP expansion, not all possible nested compression behavior. The native library handles Anki's formats. This app is intended for user-selected deck files on a local machine, not hostile public uploads.

## Rendering boundary

Native card templates generate HTML. Server-side sanitation strips scripts/styles and restricts HTML attributes. Local media references are rewritten to `/media/`, remote images are removed, and only selected raster/audio/video extensions are served from the media directory. DOMPurify sanitizes again on the client. An explicit allowlist and resolved-path containment protect media paths. Scripts and image-occlusion JavaScript are never executed. Mathematical markup remains text until a separately validated renderer is added.

The server checks Host and Origin, and requires a custom request header on mutations. No permissive CORS is enabled. Production responses include a restrictive CSP. Vite development has its own dev-server policy. This prevents ordinary cross-site pages from driving the local mutation API, but is not an authentication system for public deployment.

## Main endpoints

| Endpoint | Responsibility |
| --- | --- |
| `GET /api/dashboard` | Real deck counts and review aggregates |
| `POST /api/decks` | Create a named deck |
| `GET /api/decks/{id}/notes` | Search and page notes |
| `POST /api/notes`, `PUT/DELETE /api/notes/{id}` | Create/edit/remove notes |
| `POST /api/notes/{id}/suspend` | Pause or resume generated cards |
| `/api/study/next`, `/reveal`, `/answer`, `/undo` | Native study lifecycle |
| `/api/import/text/preview`, `/anki/preview`, `/commit` | Inspect then commit imports |
| `GET /api/export` | Native all-decks Anki package download |
| `GET/PUT /api/settings` | Read/update new-card and retention defaults |
| `POST /api/sample` | Explicitly load a six-card sample; idempotent by content |

## Why no optimizer button yet

Native FSRS state adapts with each answer, but its parameter vector remains the upstream default. Parameter fitting needs clean history, an explicit job/progress model, and evaluation before adopting a fitted vector. The stored native revlogs make future use of Anki's own optimizer feasible. Avoid running optimization on every answer or presenting a button with no validated integration.

## Delivery scope and next steps

Delivered: installable local web app, responsive UI, working native data flow, research, code, tests, portable backup. Not delivered: cloud deployment, accounts/sync, AnkiWeb login, deck sharing, AI generation, games, image-occlusion interaction or custom add-on execution. Those would require additional product decisions and are intentionally outside this local-first build.

A future desktop wrapper can manage the local service lifecycle. A future multi-device version needs authentication, backups, migrations, conflict resolution and review-log merging before exposing this service to a network. Keep the native engine adapter boundary so UI work does not alter scheduling semantics.


## Structured presentation and authoring

`server/presentation.py` maps named Question/Answer fields independently of field position. It uses native rendering for cloze ordinals and direction, extracts known Source/Extra/ID/Module/Kind fields into reveal-only metadata, and provides a sanitized fallback for unknown templates. The imported collection copy loses custom template CSS/scripts; notes, identities and review events remain native. Existing collections receive a pre-cleanup package backup. Typed cards use the web written-attempt control, not aqt reviewer placeholders.

`server/vendor/anki_star/` pins two unmodified MIT modules. JSON drafts are validated before preview and after editing, then imported through native note APIs with duplicate checks and rollback. React supplies the editable, selectable draft review and manual prompt handoff. There is no Qt or automatic AI connection.

Recall Basic notes now include Question, Answer, Extra and Source. Existing two-field models are extended on use without changing note IDs. Older clients sending two edited fields preserve the stored extra/source fields. Suggestion preferences live in the collection’s `recall_suggestions` configuration. A global switch preserves individual category choices. UI-only heuristic analysis never sends card text to an external service. APKG backups transfer learning content/history/media; app-specific preference restoration is not promised.


## Folder hierarchy

Anki remains the source of truth: names retain native `::` hierarchy and existing deck/card IDs. The dashboard adds a folder flag for parent decks and explicitly created empty folders (IDs recorded in collection config `recall_folders`). Creating a deck or folder accepts a parent ID; the server resolves its native path and rejects missing parents and duplicate names.

The browser projects names into a nested list with expandable branches, short titles and navigable breadcrumbs. Folder totals sum direct card counts through descendants; ready counts use Anki’s existing aggregate, avoiding double-counting. A folder may contain cards of its own as well as child decks. Search reveals matching ancestors without changing saved deck paths or review history. No separate database or filesystem folders are introduced.
