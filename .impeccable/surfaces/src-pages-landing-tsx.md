---
version: 1
slug: "src-pages-landing-tsx"
primary_target: "src/pages/Landing.tsx"
related_targets: ["src/pages/landing.css", "src/lib/plan.ts", "src/lib/cloud/auth.tsx"]
---

# Guided first visit

Mode: Persuade at the opening, then Operate for setup. Existing Oftly identity; code-led refinement using the original landing as the explicit style reference, no new visual world or comp.

## User authority: 11 November 2026

The user rejected the tall scroll page, scrolling buttons, obscure subject choices, card-count/deadline questions and one-hour ceiling. They asked for an active, designated path with much less text/options and support for people studying eight hours a day. A subsequent request asks to tie back into the old landing style. Restore its expressive headline, paper sample card and ink-and-gold recall illustration while retaining the simpler questions. The latest clarification is explicit: “I LIKED THE SCROLL ANAIMATIONS GOOING ACROSS”. The horizontal, scroll-scrubbed card journey is the central requirement, not merely the old colors or a timed curve reveal.

## Direction contract

**THESIS**: Understand one card by using it, then make a simple study plan.

**OWN-WORLD**: Preserve Oftly's warm canvas, ink, fonts and existing icons. Restore the original first impression through centered editorial type, a single paper flashcard and a pinned ink-and-gold scroll chapter with the same card travelling across it. Keep the study application quiet.

**STORY**: Optional sample reveal/rating → scroll the same card left to right through encounter, recall/rating and return → study setting → current method → hours/minutes → a short suggested split → optional account or guest study. Each screen has one task. Back preserves answers and a reload resumes setup.

**FIRST VIEWPORT**: Brand/sign-in header, the original “One card. A longer-lasting memory.” headline, one short description, a paper sample card and Reveal answer. The sample action is visible at 320–1440px widths. The scroll chapter is available immediately below it, without requiring a rating to discover the animation. The final setup button advances to the first question.

**FORM**: Up to 1040px opening with centered 480px card; 540px task column for setup, flat choice rows, 44px controls, factual progress, no nested cards or arbitrary numeric efficacy claims. Three setting options and three methods; no card totals, horizons or long subject list. Daily time accepts 5 minutes to 24 hours. The suggested allocation never limits actual studying. Scrolling directly controls card translation and curve drawing, including reverse scrolling. It stops when scrolling stops, with no autoplay or loop. Forward wheel, touch and keyboard scrolling pauses for one second at the top of each review spike, once per pass. Reverse scrolling, Escape and focus navigation release the hold; reduced motion and oversized content never lock. Reduced motion and content taller than the viewport use an unpinned, complete illustration. The curve reflects the optional rating and is explicitly illustrative, without fabricated day counts.

**FINISH**: Inspect desktop, tablet and phone states; verify keyboard/large text, eight-hour input, plan persistence and account handoff. Fresh independent finish review includes the user's criticism. Existing design tokens and assets stay unchanged; no new rasters ship.

## Motion thesis

Focal moment: the same card travels from left to right while a pinned chapter stays in view. Continuity: encounter → answer/rating → returned question. Feedback: scroll position updates the card, active chapter and curve together; sample ratings alter the return story. Feedback includes a one-second hold at each of the two review peaks, calculated from the actual SVG path length. The card changes chapter at those peaks. Budget: one requestAnimationFrame per event batch, transform and stroke updates, a bounded timer per peak, and React updates only at stage boundaries. Input listeners intercept only forward crossings or active holds. No animation dependency.
