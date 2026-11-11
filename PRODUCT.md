# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Delegated by user: React + TypeScript + Vite, matching neighboring projects. The native local edition embeds the official Anki engine in Python. On 10 November 2026 the user also authorized a public browser-local edition using FSRS with optional accounts added later that day; it uses IndexedDB and explicitly selects FSRS-6. The static frontend uses Supabase authentication and private storage for optional cross-device sync. Google and email-link sign-in are supported; guests can still study without signing in.
## Users
Learners who want Anki's spaced repetition with Quizlet's approachable daily workflow. Specific subjects and age groups are undecided.
## Product Purpose
Create, import, study, and retain flashcards with minimal interface overhead.
## Capabilities and Constraints
Local-first. Actual Anki collection and scheduler. Anki package and text imports; Quizlet text export imports. Research-backed study design. A working web application, not a visual prototype. The user's existing Anki profile is never opened or modified: this app owns a separate collection.
## Brand Commitments
Clean, simple, no UI bloat. Familiar flashcard workflow. User-selected visual authority: Oftly Brand Identity.pdf, supplied 10 November 2026. Use the lowercase Oftly wordmark and interval-dot mark, ink #1F2A44, index paper #F7F2E8, marigold #F4B23E for recall highlights, leaf #2F7A5F for success, Bricolage Grotesque for headings/questions and Atkinson Hyperlegible for body/UI. The guide is a visual reference; its preliminary naming screen is not a verified legal clearance.
## Evidence on Hand
Research synthesis in docs/LEARNING-RESEARCH.md. No user card data or brand assets supplied. Any example cards are explicitly labeled sample content; activity statistics must be real.
## Product Principles
- Reveal answers only after an attempt.
- Use the official Anki engine locally and the maintained FSRS implementation in the browser; the UI owns clarity.
- Make imports, corrections and data portability easy.
- Keep complexity behind meaningful tasks.


## Implemented authoring extension

Mixed Anki Star JSON import offers selection, editing, preserved sources/explanations/tags and an optional manual assistant prompt builder. Structured Anki field mapping keeps IDs out of study text. Optional local writing suggestions can be disabled globally or by kind. Timing is native FSRS locally and FSRS-6 in the public browser build; newer research candidates and evaluation are documented in docs/ENGINE-COMPARISON.md.

## Quiet interface refinement

The user requested less stimulation and a layout closer to Anki on 10 November 2026. Use a compact light top bar, a deck-list home, plain study content, neutral compact ratings and optional help behind disclosures. Remove the dark rail, motivational dashboard, decorative panels and repeated prompts. The Oftly identity and existing functionality remain. Omit subtitles that merely repeat a page title, motivational copy and repeated completion messages; retain counts, limits and instructions that help the learner act.

## Public introduction and optional accounts

On 11 November 2026 the user replaced the large scroll-led introduction with a compact, action-led setup. A subsequent refinement restores the original expressive headline, paper card and ink-and-gold recall graphic at the opening. The latest clarification specifically restores the horizontal scroll animation: a pinned chapter carries the same card across the page with the recall curve drawing alongside it. The chapter is available immediately and its final button opens setup. The opening persuades through a working example; setup remains an Operate surface with one question at a time, four study purposes, including Other, three study methods, and daily hours/minutes. The sample card supports reveal and a recall response; visitors may explore its scroll journey and proceed directly into the three setup questions. No scroll-only calls to action, card-count estimate or goal-horizon question. Returning users can sign in directly; guest continuation remains at the end.

The time input accepts 5 minutes through 24 hours, including an eight-hour study day. The result suggests short recall sessions within the total study budget; it does not impose a study limit or forecast mastery. The calculation is disclosed on request. Optional Google and email-link accounts synchronize cards, scheduling, history, media, preferences and the saved plan. Account libraries are separate from guest storage. Same-record conflicts require a choice and preserve recovery copies. Account deletion and export are available. The native Anki edition remains a separate localhost application.


## Appearance, time controls and research explanation

Settings offers Light, Dark and System appearance. The default remains Light. This preference belongs to the device, applies before first paint, and covers the app, introduction and standalone privacy page. Google artwork and imported images retain their original colors.

Desktop minute arrows use ten-minute steps; exact typed minutes remain possible. Touch-capable devices, including iPad, use native vertically scrolling wheels with centered snapping, taps and keyboard access. Scrolling outside them remains native. The study budget still supports up to 24 hours.

The research link opens a public Read surface at #research before sending anyone to GitHub. Interactive published results, a scroll-linked spacing illustration, answer feedback and an isolated real FSRS-6 simulation explain the mechanism. Subtle citations lead directly to primary sources, and the full GitHub research notes remain linked. Illustrations and simulations are labeled. The page distinguishes evidence for learning techniques from product efficacy: no head-to-head study establishes superiority over Anki, whose modern scheduler shares the FSRS foundation.
