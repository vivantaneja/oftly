# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Delegated by user: React + TypeScript + Vite, matching neighboring projects. A local Python service embeds the official Anki engine, as explicitly requested. No accounts or cloud service.
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
- Anki owns scheduling and card generation; the UI owns clarity.
- Make imports, corrections and data portability easy.
- Keep complexity behind meaningful tasks.


## Implemented authoring extension

Mixed Anki Star JSON import offers selection, editing, preserved sources/explanations/tags and an optional manual assistant prompt builder. Structured Anki field mapping keeps IDs out of study text. Optional local writing suggestions can be disabled globally or by kind. The current production timing remains native FSRS; newer engine candidates and an evaluation plan are documented in docs/ENGINE-COMPARISON.md.
