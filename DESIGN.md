---
name: "Recall"
description: "A quiet local flashcard workspace with familiar controls and room to think."
colors:
  pine: "#174c3c"
  pine-hover: "#103d2f"
  eucalyptus: "#f0f5ef"
  eucalyptus-selected: "#dfeadc"
  canvas: "#fcfdfc"
  white: "#fff"
  soft: "#f0f5f0"
  body-ink: "#283c34"
  ink: "#243a30"
  muted: "#53685b"
  line: "#e2e8e3"
  field-border: "#6f8874"
  focus: "#477451"
  button-border: "#ced9d0"
  focus-panel: "#edf3ec"
  card-border: "#dbe4da"
  rating-border: "#d9e2d8"
  good: "#edf4e9"
  due-soft: "#edf3e8"
  due-ink: "#50703b"
  danger: "#a33c34"
  danger-soft: "#fcece8"
  error-soft: "#fff0ed"
  error-ink: "#8a322b"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "2rem"
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "1.1rem"
    fontWeight: 620
    letterSpacing: "-0.018em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "0.9rem"
    fontWeight: 550
  control:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "0.9rem"
    fontWeight: 560
  study-question:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "1.65rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.018em"
  study-answer:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  tag: "4px"
  small: "5px"
  search: "6px"
  control: "7px"
  panel: "8px"
  editor: "9px"
  mobile-card: "10px"
  card: "12px"
spacing:
  tight: "8px"
  small: "12px"
  medium: "16px"
  large: "24px"
  section: "32px"
  wide: "40px"
  major: "48px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-primary-hover:
    backgroundColor: "{colors.pine-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-text:
    textColor: "{colors.pine}"
    padding: "8px 3px"
  button-icon:
    textColor: "{colors.muted}"
    rounded: "{rounded.small}"
    width: "36px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
  navigation-selected:
    backgroundColor: "{colors.eucalyptus-selected}"
    rounded: "{rounded.control}"
    padding: "12px 15px"
  due-count:
    backgroundColor: "{colors.due-soft}"
    textColor: "{colors.due-ink}"
    rounded: "{rounded.small}"
    padding: "4px 8px"
  flashcard:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "40px 42px"
  rating:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  rating-good:
    backgroundColor: "{colors.good}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  draft-note:
    padding: "18px 0 26px"
  card-guidance:
    padding: "14px 0"
---

# Design System: Recall

## Overview

**Creative North Star: "The Focused Study Desk"**

A focused study desk: cool white space, pale eucalyptus surfaces, dark pine actions, and readable graphite-green text. Familiar navigation, aligned rows, and compact controls make the next action clear while leaving the learning material room to breathe.

This document captures the implemented interface and the user’s clean, simple, low-bloat direction. Recall is a working name, not an approved permanent identity. Personality comes from color, proportion, and clear language rather than ornament.

**Key Characteristics:**

- Cool white canvas with eucalyptus tonal grouping.
- Dark pine actions and clear keyboard focus.
- System sans typography, aligned rows, and restrained borders.
- Generous study space with a stable question and an answer revealed beneath it.

## Colors

White and muted green establish the quiet workspace; pine supplies action contrast. Frontmatter is normative for exact values.

### Primary

- **Pine / Pine Hover:** primary actions, links, checkbox accents, and cloze emphasis.
- **Eucalyptus / Eucalyptus Selected:** navigation surface and selected rows.
- **Focus Panel:** the daily study invitation. **Good:** subtle successful-recall emphasis.
- **Due Soft / Due Ink:** small ready-card counts. **Focus:** visible keyboard outlines.

**The Action Contrast Rule.** Use dark pine for the next meaningful action; keep supporting surfaces pale and readable.

### Secondary

- **Danger / Danger Soft:** explicitly labeled destructive controls.
- **Error Ink / Error Soft:** readable inline error messages. These are semantic feedback colors, not a second brand palette.

### Neutral

- **Canvas / White / Soft:** workspace, fields and study card, then quiet icon hover surfaces.
- **Body Ink / Ink / Muted:** default copy, field and control text, then supporting information.
- **Line / Card Border / Rating Border / Button Border:** separators and container boundaries.
- **Field Border:** the stronger editable-control boundary, distinct from decorative separators.

Deck icon tiles also use the source's muted green, blue-gray, and sand variations to distinguish adjacent rows; they are not status colors.

## Typography

Use the native system sans stack in frontmatter, with a root size of (15px). There is no downloaded display face or separate monospace identity. The hierarchy is practical rather than a rigid mathematical scale.

- **Headline:** page titles; at the phone breakpoint use (1.7rem) with tracking of (-0.03em).
- **Title:** section headings. The daily invitation has a larger contextual heading (1.8rem, weight 580, line-height 1.25).
- **Body:** paragraph line-height is (1.65); supporting interface copy typically ranges from (0.75rem) to (0.94rem).
- **Label / Control:** medium weights distinguish fields and actions without making every element bold.
- **Study Question / Study Answer:** a larger centered retrieval prompt above a left-aligned answer. On phones these become (1.4rem) and (1rem).

Counts use tabular numerals. Keyboard hints inherit the system font. Introductory descriptions cap at (65ch), daily-invitation copy at (43ch), and completion copy at (52ch). Long titles and card content wrap.

## Layout

Desktop has a fixed navigation rail (225px), an offset workspace, and a top bar (84px). Main content is centered, capped at (1200px), with padding of (44px 46px 32px). Forms/settings cap at (760px); study at (850px). The spacing tokens are repeated source values, not a new grid imposed on every gap.

Decks use full-width table-like rows with title, total, ready count, and directional icon. Their minimum height is (85px). The daily invitation and compact activity area use (1.6fr / 1fr) columns, a minimum supporting width of (245px), and a (40px) gap.

| Viewport | Adaptation |
| --- | --- |
| Up to 1100px | Rail (195px); content side padding (28px); controls tighten. |
| Up to 800px | Rail (174px); daily layout and form rows stack; ratings use two columns. |
| Up to 600px | Bottom navigation (64px plus safe-area inset); content side padding (22px), bottom clearance (85px); deck rows hide total count and retain ready count, with minimum height (92px). |
| From 1500px | Main top padding (55px); daily-layout gap (50px); roomier invitation padding. |

Focused mobile study hides bottom navigation and the top bar. It retains finish/undo controls and uses main padding of (18px 17px 28px). Rating controls are centered within a maximum width of (640px). Assistant/JSON import stays within the narrow form width, with a (22px) vertical gap; its format tabs wrap on phones.

## Elevation & Depth

Pale tonal grouping, white fields, and fine boundaries provide depth. The study card alone uses a faint shadow: `0 9px 25px -16px #1b402925`. Navigation, rows, forms, and ordinary buttons are flat; the implementation uses no backdrop blur or decorative gradients.

**The Quiet Depth Rule.** Use borders and tonal surfaces for grouping. Reserve the faint shadow for the study card.

## Shapes

Controls use the **control** radius; icon buttons and count chips use **small**; search uses **search**. Instruction panels and ratings use **panel**. Study and daily-focus surfaces use **card**, with study switching to **mobile-card** on phones. Note editors use **editor**. Preserve these observed differences rather than adopting a pill-shaped default.

Boundaries are generally (1px). Active import tabs use a (2px) bottom stroke. Keyboard focus uses a (3px) outline offset by (3px); search uses a (2px) outline offset by (2px). Completion marks are circular.

## Components

### Buttons

Quiet and direct. Primary/secondary controls use padding (12px 19px), minimum height (44px), and an icon gap of (10px). Primary hover deepens pine; secondary hover adds soft green. Compact controls use padding (8px 13px) and minimum height (38px). Text actions underline on hover; icon controls are (36px) squares. Danger controls remain explicitly labeled. Disabled buttons use opacity (0.5). Preserve visible keyboard focus.

### Inputs / Fields

White fields have the stronger **Field Border**, control radius, and padding (12px 13px). Labels sit above with a (9px) gap. Textareas use line-height (1.65) and resize vertically. Search combines its icon and input inside a wrapper that receives focus as a unit. Errors use distinct inline text and a pale red panel; the source does not define a separate invalid-field border.

### Navigation and Deck Rows

Desktop navigation uses icon-and-label rows, pale selected fill, and a heavier selected label. Items use padding (12px 15px) and icon gap (13px). Mobile items stack icon over label, omit count badges and selected fills, and emphasize the selected icon stroke. Settings stays reachable. Deck rows remain flat, lightly tint on hover, and wrap long titles; compact ready-count chips are noninteractive.

### Study Card and Answer Reveal

The white card uses desktop padding (40px 42px). Its centered question region retains a minimum height of (150px) before and after reveal. The answer unfolds beneath a separator without moving the question. Images fit the available width and cap at (350px) high; audio fits the container; preformatted text wraps.

Reveal takes (200ms), from opacity (0.75) and vertical offset (5px) to rest, using `cubic-bezier(0.16, 1, 0.3, 1)`. Button/link color transitions take (160ms). Reduced-motion mode disables both. The reveal button is at least (230px) wide and (48px) high on phones. Written attempts use an ordinary labeled textarea: optional for ordinary cards and shown by default for typed-answer cards.

Supporting material follows the answer in a clear reading order. **Explanation** uses muted text at (0.93rem) after a (24px) gap. **Sources** use muted text at (0.8rem), separated by a top border and padding (16px), with underlined links that wrap. **Card details** is collapsed by default, uses (0.78rem) text, and expands to labeled rows for extra metadata, note/card IDs, note type, and tags. Its label/value grid is (minmax(85px, 1fr) / minmax(0, 3fr)) with a (12px) gap. Preserve the native disclosure control and visible keyboard focus.

### Ratings

After reveal, show **Again — Forgot**, **Hard — Recalled with effort**, **Good — Recalled**, and **Easy — Recalled effortlessly**. Each carries its actual Anki interval and keyboard hint (1–4). Four equal desktop columns with an (8px) gap become two columns at widths up to (800px). The group is capped at (640px); each control uses padding (10px 12px) and minimum height (76px). Descriptions sit (3px) below labels and intervals (4px) below descriptions. Good has a pale-green default fill. Again has a pale-red hover; the others have soft-green hover. Meaning remains explicit in text.

### Import Panels

Format selection uses a simple underlined tab group: **Quizlet / text**, **Anki package**, and **Assistant / JSON**. Text-import instructions use a pale panel; package upload has a dashed boundary; the text preview is a two-column question/answer table. These stay within the narrow content width and the same visual system.

Assistant/JSON import uses the same labeled fields and actions. An optional prompt builder is collapsed between thin horizontal borders; it expands to source material, focus, a question-style checkbox, and the prepared prompt with a copy action. Supporting copy states that the learner transfers the prompt to their assistant; nothing is sent automatically.

Review presents editable notes as flat fieldsets, separated by a top rule, with padding (18px 0 26px). Each note has an inclusion checkbox, a type selector for Basic / Reversed / Typed answer / Cloze, question, answer when relevant, and source. **Explanation and tags** stay collapsed until needed. Show selected-note and generated-card counts separately, paginate ten notes at a time, and keep **Import notes** and **Save JSON** together in a wrapping action row. Preserve edits and selection as visible learner choices.

### Card Guidance and Preferences

Writing hints are optional, local, and visually subordinate to the editor. A **Suggestions** section uses thin borders above and below, margin-top (20px), padding (14px 0), and body text (0.85rem). Messages form a plain list, with an accessible per-kind turn-off icon at the right; **Turn off all** is a text action in the heading. Hints update after a short pause in editing (400ms) and appear only when applicable and enabled. Turning them off returns focus to the note's question field.

Preferences uses the existing checkbox style: **Show card suggestions** controls all hints, followed by Splitting cards, Long questions and answers, Unclear questions, Cloze structure, and Missing sources. The section starts after a top rule with margin (38px) and padding (28px); options have a (14px) gap. Changes save immediately. When the global control is off, the option group is disabled with opacity (0.55), retaining each saved choice for re-enabling.

## Do's and Don'ts

### Do:

- Do preserve the pine, eucalyptus, and white palette with readable muted text.
- Do keep the visible focus outline and stronger field border.
- Do use aligned, wrapping deck rows with tabular numerals for counts.
- Do keep the question in place while revealing the answer below it.
- Do show the actual Anki interval alongside each rating and its recall description.
- Do preserve responsive navigation and the focused mobile study layout.
- Do respect reduced-motion preferences.
- Do keep explanations, sources, and optional writing hints subordinate to the recall task, with clear disclosure and preference controls.

### Don't:

- Don't add gamified dashboards, decorative widget grids, or unnecessary interface chrome.
- Don't turn every content block into an elevated card or add stronger ambient shadows.
- Don't replace the stable reveal with a card flip, layout jump, or automatic advance.
- Don't communicate rating meaning, selection, or errors through color alone.
- Don't treat synthesized preview ramps as production tokens or the working name as a permanent brand.

<!-- Extracted and updated 2026-11-10 from src/styles.css, src/App.tsx, src/components/Study.tsx, src/components/DeckView.tsx, src/components/Import.tsx, src/components/StarImport.tsx, src/components/CardGuidance.tsx, and src/lib/suggestions.tsx. Evidence: .impeccable/review/desktop.png, mobile.png, study-desktop.png, study-mobile.png, import-desktop.png, structured-study-desktop.png, structured-study-mobile.png, star-review-desktop.png, star-import-mobile.png, suggestions-desktop.png. Code-led implementation; no comp or QUALITY BAR was supplied. Impeccable launcher/detector unavailable. Sidecar tonal ramps are synthesized preview metadata, not CSS tokens. -->
