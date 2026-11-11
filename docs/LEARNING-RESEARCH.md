# Learning research and product decisions

Research checked 10 November 2026. This is a targeted evidence review, not a preregistered systematic review. It distinguishes controlled learning studies, meta-analyses, software documentation, and prediction benchmarks. The design recommendations are our inferences from those sources.

## The decision

See [current engine comparison](ENGINE-COMPARISON.md) for FSRS-7, SBD, neural predictors and KAR³L, and [Anki Star integration](ANKI-STAR-INTEGRATION.md) for the implemented authoring layer.

Build around effortful retrieval, visible corrective feedback, and repeated sessions over time. Use the official Anki engine and its native FSRS scheduler through a local service. A better scheduler can reduce wasted reviews, but it cannot repair ambiguous questions, incorrect answers, or shallow recognition-only practice. No evidence establishes one interval pattern or retention target as universally best for all learners, subjects, and deadlines.

## Visual research guide

The [in-app research guide](https://oftly.vivantaneja.com/#research) is the public entry to these notes. Its first comparison reproduces the reported mean proportion of prose idea units recalled in Experiment 1 of [Roediger & Karpicke (2006)](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf), checked against the author PDF on 11 November 2026:

| Final test delay | Restudy | Initial retrieval |
| --- | --- | --- |
| 5 minutes | 81% | 75% |
| 2 days | 54% | 68% |
| 1 week | 42% | 56% |

These results describe that experiment, not Oftly versus Anki or a forecast for an individual. The spacing curves are explicitly illustrative. The timing demo calls the same browser FSRS-6 scheduler and default 90% target as the app, advances a simulated clock to each next due time, and never saves a card or review to the learner’s library. Sources remain adjacent to their explanations; GitHub keeps the fuller research and engineering record.

## What the evidence actually supports

| Finding | Evidence and strength | Product implication |
| --- | --- | --- |
| Space practice across sessions | Cepeda et al. (2006), a meta-analysis covering 317 experiments, finds that useful spacing depends on the eventual retention interval. Strong evidence for spacing, not for one universal timetable. [Paper](https://pubmed.ncbi.nlm.nih.gov/16719566/) | Schedule each card; do not prescribe a fixed 1–3–7–14 day ladder. |
| Retrieve before seeing the answer | Roediger & Karpicke (2006) compared restudy and retrieval with prose. Restudy helped an immediate test; retrieval helped delayed tests. This is evidence about retention, not proof every flashcard interface improves understanding. [Author PDF](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf) | Hide the answer until an explicit reveal. Offer an optional written attempt without penalizing wording. |
| Give corrective feedback | Pashler et al. (2007) reviewed retrieval, feedback and spacing choices. Feedback is especially valuable after failed retrieval. Feedback timing is context dependent; immediate feedback is a practical choice here, not a universal research optimum. [Research review](https://pubmed.ncbi.nlm.nih.gov/17694899/) | Always show the answer before self-rating, including after a blank attempt. |
| Feedback can help uncertain correct answers too | Butler, Karpicke & Roediger (2008) found benefits of feedback for low-confidence correct answers in their test conditions. [Author PDF](https://learninglab.psych.purdue.edu/downloads/2008/2008_Butler_Karpicke_Roediger_JEPLMC.pdf) | Keep answer feedback on every card; do not skip it just because the learner typed a matching answer. |
| Relearning across days matters | Rawson and colleagues (2016) varied initial successful recalls and followed them with repeated weekly relearning. Additional initial drilling became relatively inefficient when later relearning occurred. [Study](https://pubmed.ncbi.nlm.nih.gov/27027887/) | Let the learner finish a manageable session; do not require repeated perfect rounds in one sitting. |
| Interleaving is conditional | Brunmair & Richter (2019) synthesized 59 studies. Benefits varied with learning material and similarity. Randomly mixing unrelated facts is not equivalent to helpful contrast between confusable categories. [Meta-analysis](https://pubmed.ncbi.nlm.nih.gov/31556629/) | Due cards may mix, but offer deck-specific study. Do not market shuffle as a universal learning improvement. |
| Retrieval can work in classrooms | McDaniel and colleagues tested classroom quizzing, including sixth-grade social studies. This supports relevance beyond laboratory word pairs while leaving scope limits. [Study](https://pubmed.ncbi.nlm.nih.gov/22082095/) | Treat recall as the central workflow, rather than hiding it behind games. |
| Understanding needs more than fact recall | Retrieval research includes conceptual material, but mastery of isolated facts does not guarantee transfer to unfamiliar problems. [Learning lab research program](https://learninglab.psych.purdue.edu/projects/) | Encourage explanation and application prompts; avoid a misleading mastered badge after one correct answer. |

## Recent evidence: what changes, and what does not

Yang et al. (2021) synthesized classroom quizzing data from 222 independent studies and 48,478 students. This broadens the basis for retrieval practice beyond the classic laboratory demonstrations, while heterogeneity means the average should not be treated as a guaranteed effect for this product. [Meta-analysis](https://pubmed.ncbi.nlm.nih.gov/33683913/)

Agarwal et al. (2021) reviewed applied school and classroom research, reporting benefits across several real teaching settings. That strengthens the case for retrieval as the default task. It does not establish that automatic marking, gamification or larger review queues improve it. [Systematic review](https://doi.org/10.1007/s10648-021-09595-9)

Ruitenburg et al., published **29 October 2026**, examined 53 studies and 7,303 participants in authentic primary and secondary classrooms. Their average effects were g=0.37 for retrieval, 0.20 for spacing and 0.40 for interleaving; moderators differed by strategy. These are standardized effects against different comparison conditions, not percentages or a fair ranking of the three methods. The authors emphasize context. Our inference: retain spacing and retrieval, let learners choose relevant decks, and avoid automatically adding random interleaving as a supposedly superior algorithm. [Open-access meta-analysis](https://link.springer.com/article/10.1007/s10648-026-10225-5)

The latest evidence strengthens the foundations, rather than identifying a new universal interval formula. The app therefore improves the conditions for honest retrieval and appropriate practice, without modifying Anki's memory equations. A future scheduler experiment should compare delayed recall per minute against the native FSRS baseline using preregistered outcomes.

## FSRS: engineering choice, not a claim of universal superiority

FSRS models difficulty, memory stability and retrievability. The scheduler uses the card state, elapsed time, rating and requested retention to estimate a new due date. The initial build uses the official Anki Python package and its Rust backend. The user subsequently broadened the brief to consider other engines; the comparative research and current implementation boundary are documented in ENGINE-COMPARISON.md. Only the engine is needed; the Qt desktop interface is omitted. This retains native scheduling and package semantics. [Official source](https://github.com/ankitects/anki)

The open spaced repetition benchmark compares algorithms on recorded review outcomes. Predictive calibration and log loss are useful, but observational review logs are not a randomized trial proving improved grades or lower effort for every student. We choose FSRS for a maintained implementation and strong predictive evidence; do not claim “scientifically best” or advertise a fixed percentage reduction in study time. [Benchmark and methods](https://github.com/open-spaced-repetition/srs-benchmark)

Start at a requested retention of 90%, an ordinary practical setting, with a small daily new-card budget. Raising the target normally requires more reviews. The target is a model parameter, not a guaranteed personal recall rate. Preserve raw review events so future parameter fitting is possible. Never claim personalization by optimization until an optimizer is actually integrated and validated. [Anki scheduling documentation](https://docs.ankiweb.net/manual/deck-options)

Keep the four scheduler ratings: Again = forgot; Hard = recalled with substantial effort; Good = recalled; Easy = recalled effortlessly. Hard must not mean “forgot but nearly knew.” Display those meanings and real next-interval previews. Add undo, because an accidental rating should not corrupt the learner history.

## Minimal learning loop

1. Open Today and see the cards actually available to review.
2. Study due cards first, then introduce up to the daily new-card limit.
3. Try to recall; optionally type an attempt. No answer leaks in the question view.
4. Reveal the correct answer and compare meaning, not exact spelling.
5. Rate recall; atomically save the new FSRS state and the review event.
6. A missed card returns only when its scheduled learning interval has elapsed. Do not silently fast-forward scheduled time to finish a session.
7. Finish with the number of reviews completed and the next scheduled review. No guilt-driven streak loss or artificial mastery score.

Sibling cards from the same note should not cue each other in the same day. When support is present, bury siblings until tomorrow. Repeated failures are an invitation to rewrite a card or pause it, not force still more repetitions.

## Card writing guidance

Use one clear question per card and include enough context to avoid guessing what the author meant. Keep the answer focused, then add an explanation or example when helpful. These are design heuristics consistent with retrieval practice, not independently proven numerical rules about word counts. Ask “Why?” and “Apply this idea” alongside definitions. Cloze deletion is useful when context matters, but avoid blanks that reveal the answer through grammar alone.

## Imports and honest compatibility

Anki exports packaged decks and tab-separated notes. A package can contain note types, generated cards, media and scheduling data; merely reading two note fields is not equivalent to full Anki compatibility. Keep the importer separate from the scheduler, preview results, and disclose unsupported templates before committing. [Anki export manual](https://docs.ankiweb.net/manual/exporting)

Quizlet documents a text-export workflow for sets the user created: export on the website, choose separators and copy text. Copied sets and images have restrictions. Support pasted exports and CSV/TSV files; do not promise arbitrary Quizlet URL scraping or bypass access controls. [Quizlet export guide](https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets)

## Evaluation before stronger claims

For software: test deterministic scheduler transitions, date persistence, undo, daily limits, duplicate detection, safe import rendering, malformed packages and backup restoration. For usability: measure time to first imported review, completion of a five-card session, and correct understanding of Again versus Hard.

For learning: use delayed recall after at least a week, report review time as well as recall, and separate new users from established learners. A fair comparison should hold content and practice time constant or explicitly model the tradeoff. Do not infer learning effectiveness from streak length, number of flips, satisfaction, or a scheduler's own predicted retention.

## Deliberately deferred

A per-user optimizer requires enough clean review history, fitting outside the core study bundle, versioned parameters, and holdout evaluation. Exam-deadline planning needs an explicit date and a workload model. Full Anki synchronization requires collection semantics, conflict resolution, media transport and compatibility testing beyond an import adapter. These are separate capabilities rather than implied benefits of selecting FSRS.
