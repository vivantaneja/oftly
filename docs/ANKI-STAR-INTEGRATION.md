# Anki Star integration assessment

Inspected 10 November 2026 at commit `63e55713fc3f22d2ef0ce95be881b936b8449854`. This assessment uses the source code, not just the project description. The two imported Python modules remain pinned to that commit.

## Recommendation and implementation

Anki Star is useful as a **card-authoring and interchange component**. It does not provide a new long-term memory scheduler. Recall now uses its dependency-light JSON validation and native collection adapter, with a React review interface. Installing the desktop add-on or its Qt dependencies is unnecessary.

| Component | Fit for Recall | Current implementation |
| --- | --- | --- |
| Mixed Basic, Reversed, Type Answer and Cloze JSON | Strong: explicit fields avoid guessing column meanings | Preview, edit, select, import; save selected drafts as compatible JSON |
| Sources, explanation, tags | Strong: supports reviewable answers and traceability | Preserved in native note fields; Sources/Explanation shown after reveal; tags in Card details |
| Native note creation | Strong: the app already owns an official Anki collection | Reuses the pinned adapter; duplicate detection and failure rollback verified locally |
| Assistant prompt preparation | Useful without a new service | Local prompt builder; manual copy/paste; no AI credentials or automatic sends |
| Qt desktop dialog | Does not fit the browser interface | Rebuilt as React controls; desktop entry point excluded |
| Apple Vision OCR | Possible through the local Python service, macOS only | Not integrated; no OCR binary installed |
| Learn/Test/Match modes | Possible, but require separate learning-efficacy decisions | Not copied into the study loop |
| Spaced repetition | Supplied by Anki, not this add-on | Existing native FSRS remains responsible for due dates |

The repository’s [core module](https://github.com/MilesatAshvantAnand/anki-star/blob/63e55713fc3f22d2ef0ce95be881b936b8449854/addon/core.py) defines a strict plain-text exchange schema. Recall retains that contract: `type`, `front`, `back`, `extra`, `source`, `tags`, up to 500 notes and 2 MB. A prompt response is untrusted draft material. Every selected edited note is validated again before collection mutation. The import boundary does not automatically trust an assistant’s factual accuracy.

The [collection module](https://github.com/MilesatAshvantAnand/anki-star/blob/63e55713fc3f22d2ef0ce95be881b936b8449854/addon/collection.py) has no Qt dependency. It creates dedicated native note types, skips exact first-field duplicates within each type across decks, and groups/rolls back failed imports. A reversed note makes two cards; cloze creates one card per deletion number. The adapter does not merge semantically similar questions or overwrite an existing answer with a duplicate. Recall’s UI reports notes separately from generated cards.

## Compatibility issue found and fixed

The native backend renders Anki’s typed-answer filter as `[[type:Back]]`; Anki’s desktop reviewer normally completes that interaction. Simply inserting the rendered text into a web page leaves the marker and can omit the expected answer. The local compatibility experiment reproduced this. Recall now presents the question with its own typed-attempt control and renders the answer after reveal. Marking stays with the learner, so a harmless wording difference does not automatically become a failed review.

The user’s imported seven-field note type starts with `ID`, `Module`, and `Kind`. Reading its first two fields as question and answer was incorrect. Recall now maps recognized field names for study, library and package previews. `Question`/`Answer` form the main content, `Extra` becomes an explanation, `Source` becomes a labelled reference, and authored/native IDs remain available in collapsed Card details. Anki still renders cloze ordinals and card direction. Unknown templates receive a sanitized fallback; arbitrary add-on-dependent behavior is not promised.

## Design and data boundary

Imported custom template CSS, inline template styling and scripts are removed from the app’s copy. Basic semantic formatting, supported local images/audio, source links and native note fields remain. The original Anki profile is never opened. Before the one-time cleanup of an existing Recall collection, the service writes `.data/before-clean-layout.apkg` with scheduling and media. Note/card IDs, sources, tags and review history remain native and survive package export.

This is local interchange, not live AnkiWeb synchronization. JSON carries draft content; use APKG for cards, supported media and scheduling history. Image occlusion and add-on scripts can require editing after import. The app does not execute imported JavaScript or adopt third-party visual themes.

## Why its practice rules are not our new scheduler

The [practice UI](https://github.com/MilesatAshvantAnand/anki-star/blob/63e55713fc3f22d2ef0ce95be881b936b8449854/addon/ui.py) advances Learn items after two consecutive successes, resets that count after a miss, and requeues unfinished items. The first pass uses choice when alternatives exist; later passes use typed recall. Its scoring compares normalized strings with a user override. These are understandable local practice rules, not a fitted memory model or evidence of durable mastery. They do not write scheduled review history. Copying them wholesale would also add practice exposure that our scheduler does not observe.

Our implemented extension asks an external assistant for explanation, comparison and application questions when supported by the source. It retains short answer rubrics, corrective explanations, and references. This is evidence-informed authoring, not a replication of KAR³L or a claim of superior learning. See [the engine comparison](ENGINE-COMPARISON.md).

## Licence and verification

The project is [MIT licensed](https://github.com/MilesatAshvantAnand/anki-star/blob/63e55713fc3f22d2ef0ce95be881b936b8449854/LICENSE). The copyright and licence are retained under `server/vendor/anki_star/`. Recall’s official Anki dependency has its separate AGPL obligations; reuse of an MIT component does not replace them.

The author’s [validation report](https://github.com/MilesatAshvantAnand/anki-star/blob/63e55713fc3f22d2ef0ce95be881b936b8449854/docs/VALIDATION.md) reports 35 tests on Anki 26.9.3 and 25.9.2; that is upstream evidence, not tests we independently ran. We tested our adapter against Anki 26.9.4 with disposable collections: all four types, card counts, hidden clozes, typed answers, duplicate skipping, invalid-batch rejection, injected-failure rollback, field/ID preservation, native scheduling and undo, source metadata, clean templates, and APKG round-trips. Browser checks cover draft editing/selection through study, keyboard focus, responsive rendering and accessibility.
