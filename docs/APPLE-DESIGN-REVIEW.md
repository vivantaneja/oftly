# Design review: Recall

Reviewed 10 November 2026 using [Apple Design Skill](https://github.com/dickwu/apple-design-skill/blob/main/SKILL.md) and Impeccable. At inspection the community skill had 3,082 stars and 238 forks. Those are adoption signals, not evidence that everyone uses it or that Apple endorses it. It was applied as a reference, not copied into this repository.

## Summary

Overall: **Good** within the tested scope. The task is straightforward daily retrieval. Recall’s character comes from quiet eucalyptus/pine colors, stable questions and clear answer feedback. This is a React web app: accessibility, hierarchy and feedback principles apply; native app-menu, Liquid Glass and App Store conventions do not impose a redesign.

## Improvements completed

- **Medium: error recovery.** Import errors now receive focus and scroll into view while preserving drafts. A browser test verifies a failed edited answer, correction and successful retry. `feedback.md › Best practices`: “Make sure all feedback is accessible.” [Reference](https://github.com/dickwu/apple-design-skill/blob/main/references/hig/feedback.md)
- **Medium: field-aware guidance.** Explicit missing-index fallback preserves an Answer field at index zero. A browser fixture verifies it. This is an implementation finding, not an Apple-specific rule.
- **Medium: larger text and touch.** Rating descriptions wrap; coarse-pointer icon buttons and checkbox labels have 44 CSS-pixel minimum targets. Tests double root text size on mobile Settings and an imported-note editor without overflow. CSS pixels are web measurements, not native point equivalence. `accessibility.md › Vision`: “Support larger text sizes.” [Reference](https://github.com/dickwu/apple-design-skill/blob/main/references/hig/accessibility.md)
- **Low: high contrast.** Forced-color mode preserves borders and focus using system colors. Reduced-motion support already disables nonessential transitions.

## What works

Equal-sized rating controls retain names, meanings, intervals and shortcuts. Verified desktop ratings are 76 CSS pixels high and less than 170 wide at default text size. Color is not the only signal.

Sources and explanations follow the answer; IDs and tags use a disclosure. `layout.md › Visual hierarchy`: “Use progressive disclosure to make layouts cleaner and easier to interact with.” [Reference](https://github.com/dickwu/apple-design-skill/blob/main/references/hig/layout.md)

Suggestions are optional and controllable in context. Per-kind preferences survive switching the entire feature off and on. [settings.md › Task-specific options](https://github.com/dickwu/apple-design-skill/blob/main/references/hig/settings.md)

Automated accessibility checks cover exercised Today, Study and Settings states. Input-safe shortcuts, labels, a skip link and focus transitions support keyboard use. The interface is already restrained; ornamental glass and animation would not help the learning task. That is product judgment.

## Platform notes and limits

Read references: accessibility, layout, typography, color, designing-for-iOS, cross-platform, entering-data, feedback, buttons, settings and code-audit. Source and rendered desktop/mobile evidence were reviewed. Native VoiceOver/Switch Control were not manually tested. Dark appearance is not implemented; the light study palette is the current design. Imported audio/images may need author-supplied transcripts or alternative text. No complete accessibility conformance or Apple certification is claimed.

Measured contrast on white: muted #53685b 6.00:1; pine #174c3c 9.83:1. Other surfaces were covered by the automated checks.


## Supplied Apple Design skill: queue refinement, 10 November 2026

Applied the user's supplied Apple Design skill to the current Oftly interface. The earlier review above describes the pre-brand version. The current brief remains a quiet, Anki-like study tool.

- Immediate pressed-state color feedback for study controls, deck rows and navigation actions; actions still commit on release and keyboard behavior remains native.
- Relative root text size respects browser font preferences. Queue spacing scales with text, numbers use tabular figures, and zero counts remain muted. Labels carry the meaning alongside color.
- A missed-answer tally remains visible on phones. Countdown updates are not announced every second by assistive technology. Deck study actions refresh when a repeat becomes due.
- Undo remains available, including across native deck-selection changes. Answer position stays stable and the existing reduced-motion behavior remains in place.
- Desktop, 320px mobile, enlarged-text and automated accessibility checks were exercised with synthetic cards. No motion library, gesture dependency or translucent surface was needed for this task. This is an implementation review, not an Apple endorsement or certification.
