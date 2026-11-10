---
name: "Oftly"
description: "A warm, readable workspace for returning to what you learn."
colors:
  ink: "#1f2a44"
  action-hover: "#131c30"
  paper: "#f7f2e8"
  marigold: "#f4b23e"
  marigold-hover: "#eaa52d"
  leaf: "#2f7a5f"
  canvas: "#fcfaf6"
  surface: "#fffefa"
  muted: "#596174"
  line: "#ded9ce"
  soft: "#f0eadf"
  field-border: "#747b89"
  rail-text: "#d4d8e2"
  rail-hover: "#ffffff12"
  danger: "#a33c34"
  danger-soft: "#fcece8"
  error-soft: "#fff0ed"
  error-ink: "#8a322b"
  success-soft: "#e8f1ec"
typography:
  headline:
    fontFamily: "\"Bricolage Grotesque\", \"Atkinson Hyperlegible\", sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "\"Bricolage Grotesque\", \"Atkinson Hyperlegible\", sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
    letterSpacing: "-0.018em"
  body:
    fontFamily: "\"Atkinson Hyperlegible\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "\"Atkinson Hyperlegible\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "0.9rem"
    fontWeight: 550
  control:
    fontFamily: "\"Atkinson Hyperlegible\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "0.9rem"
    fontWeight: 560
  study-question:
    fontFamily: "\"Bricolage Grotesque\", \"Atkinson Hyperlegible\", sans-serif"
    fontSize: "1.65rem"
    fontWeight: 650
    lineHeight: 1.55
    letterSpacing: "-0.018em"
  study-answer:
    fontFamily: "\"Atkinson Hyperlegible\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
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
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-text:
    textColor: "{colors.ink}"
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
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
  navigation-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 15px"
  due-count:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.small}"
    padding: "4px 8px"
  flashcard:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "40px 42px"
  rating:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  rating-good:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  draft-note:
    padding: "18px 0 26px"
  card-guidance:
    padding: "14px 0"
  folder-row:
    rounded: "{rounded.tag}"
    padding: "18px 12px"
---

# Design System: Oftly

## Overview

**Creative North Star: "The Oftly Study Desk"**

Oftly is a warm study workspace built around regular return. A deep ink rail anchors the interface; index-paper cards and a warm canvas make the work area feel quiet and familiar. Bricolage Grotesque gives headings and questions their character, while Atkinson Hyperlegible keeps answers, controls, and dense information readable.

The user-supplied Oftly Brand Identity guide governs the identity. The implemented system keeps familiar flashcard controls and restrained density: aligned folders and decks, short paths to study, and supporting material disclosed when useful. The interval mark and small marigold recall accents provide recognition without turning study into a game.

**Key Characteristics:**

- Ink navigation and actions on warm index-paper and canvas surfaces.
- Bricolage Grotesque headings/questions paired with Atkinson Hyperlegible UI/answers.
- Outlined lowercase wordmark and bottom-aligned interval dots.
- Stable question placement, compact ratings, and subordinate explanation/source details.

## Colors

The supplied guide establishes Ink, Index Paper, Marigold, and Leaf. The built interface adds warm neutral surfaces and explicit feedback colors. Frontmatter records the exact source values; no speculative tonal ramps are part of this system.

### Primary

- **Ink:** the navigation rail, headings, body copy, links, and primary actions. **Action Hover** deepens filled controls.
- **Index Paper:** study cards, the daily invitation, selected desktop navigation, and supporting panels.

### Secondary

- **Marigold:** Good-rating fill with ink text, the final interval dot, text selection, and visible focus within the dark rail. **Marigold Hover** is the implemented darker rating state.
- **Leaf:** success feedback and keyboard focus on light surfaces. **Success Soft** supports completion marks.

**The Recall Accent Rule.** Reserve marigold for the Good rating, interval-mark endpoint, selection, and focus on the dark rail. Use ink for normal text.

### Neutral

- **Canvas / Surface / Soft:** warm page ground, editable controls, then quiet hover and count surfaces.
- **Muted:** supporting copy, inactive icons, intervals, and metadata.
- **Line:** structural separators and panel boundaries. **Field Border:** the stronger edge of editable controls.
- **Rail Text / Rail Hover:** readable inactive navigation and its subtle hover treatment.
- **Danger / Danger Soft / Error Ink / Error Soft:** explicit destructive controls and inline errors; keep these semantic feedback colors distinct from brand accents.

Folder and deck symbols share the same neutral treatment. Avoid assigning arbitrary status meanings to icon colors.

## Typography

**Headings and questions:** Bricolage Grotesque, with the source's Atkinson/sans fallbacks. **Body, answers, and controls:** Atkinson Hyperlegible, with system sans fallbacks. Root size is (16px).

Both families are self-hosted under `public/fonts/`. Bricolage is variable (weights 200–800) with optical sizing enabled for headings; Atkinson supplies regular, bold, italic, and bold italic faces. Preserve the provided face selection and `font-synthesis: none`. Source URLs and OFL licenses are recorded alongside the files.

- **Headline:** page titles; phone size (1.7rem), tracking (-0.03em).
- **Title:** section headings. The daily invitation uses (1.8rem), weight (700), and line-height (1.25).
- **Body:** paragraph line-height (1.65); supporting UI commonly ranges from (0.75rem) to (0.94rem).
- **Label / Control:** use the source's requested medium weights; Atkinson resolves them against its supplied static faces.
- **Study Question / Study Answer:** a centered, weight-(650) Bricolage prompt above a left-aligned Atkinson answer. Phone sizes are (1.4rem) and (1rem).

Counts use tabular numerals. Keyboard hints inherit Atkinson. Introductory descriptions cap at (65ch), daily-invitation copy at (43ch), and completion copy at (52ch). Long titles, answers, rating descriptions, and mobile button labels wrap; page headings allow automatic hyphenation.

## Layout

The desktop shell retains a fixed rail (225px), offset workspace, and top bar (84px). Main content is centered, capped at (1200px), with padding (44px 46px 32px). Forms/settings cap at (760px); study at (850px). The daily invitation and activity region use (1.6fr / 1fr), a minimum supporting width (245px), and gap (40px).

The library uses flat folder/deck rows with a separate expansion control, icon, wrapping name and summary, ready count, and open indicator. Nested indentation is (24px) per level, visually capped at four levels. Folder creation remains inline; breadcrumbs wrap and preserve the current location.

| Viewport | Adaptation |
| --- | --- |
| Up to 1100px | Rail (195px); content side padding (28px); denser controls. |
| Up to 800px | Rail (174px); daily layout and form rows stack; ratings use two columns; library indent becomes (12px) per level. |
| Up to 600px | Paper bottom navigation (64px plus safe-area inset), with (75%) for the three main links and (25%) for Settings. Content side padding is (22px), bottom clearance (85px). The top bar wraps, has minimum height (68px), and padding (14px 22px). |
| From 1500px | Main top padding (55px), daily-layout gap (50px), roomier invitation padding. |

The phone header uses the ink wordmark (57px wide) with a (32px) app icon; the date yields its space. Focused mobile study hides the header and bottom navigation, retaining finish/undo controls and main padding (18px 17px 28px). Ratings are centered within (640px). Assistant/JSON import uses a (22px) vertical gap; its tabs and action rows wrap.

Coarse-pointer folder toggles, icon controls, checkboxes, and breadcrumb links receive (44px) targets where implemented. Preserve text enlargement and wrapping rather than fixed single-line mobile controls.

## Elevation & Depth

Warm tonal grouping, distinct fields, and fine boundaries provide depth. The study card alone uses `0 9px 25px -16px #1f2a4425`. Navigation, rows, forms, and ordinary buttons stay flat. The interface uses no decorative gradients or backdrop blur.

**The Quiet Depth Rule.** Use borders and warm tonal surfaces for grouping. Reserve the faint shadow for the study card.

## Shapes

Controls use **control** corners; small chips and icon buttons use **small**; search and library symbol tiles use **search**. Instruction panels and ratings use **panel**. Study and daily-focus surfaces use **card**, with study switching to **mobile-card** on phones. Note editors use **editor**. Library rows have small **tag** corners; they remain rows rather than a grid of cards.

Boundaries are generally (1px); active import tabs use a (2px) bottom stroke. Keyboard focus uses a (3px) outline offset by (3px); search uses a (2px) outline offset by (2px). Completion marks are circular.

The interval mark has radii (2.5, 3.5, 5, 7.5) and growing edge-to-edge gaps (3, 6, 12), with aligned bottoms. Preserve the outlined lowercase wordmark and the provided ink/paper SVG variants under `public/brand/`. The small favicon uses two dots. Do not substitute a font-rendered wordmark or shrink the mobile four-dot app icon below (32px).

## Components

### Buttons and Fields

Primary controls use ink fill and surface text; secondary controls use surface fill, ink text, and a line border. Both use padding (12px 19px), minimum height (44px), and icon gap (10px). Compact controls use (8px 13px) and minimum height (38px). Text actions underline on hover; icon buttons use a soft hover fill. Destructive controls retain explicit wording. Disabled buttons use opacity (0.5).

Fields use surface fill, the stronger Field Border, control corners, and padding (12px 13px). Labels sit above with gap (9px). Textareas use line-height (1.65) and resize vertically. Search receives focus as a unit. Errors use inline text and pale red panels. Preserve visible focus, coarse-pointer target rules, and the implemented forced-colors treatment.

### Navigation and Library

The ink rail presents the outlined paper wordmark and paper app icon, with paper selected rows and heavier selected labels. Mobile navigation uses paper ground, icon-over-label controls, and selected ink text/stroke instead of a filled tile. Settings remains available.

Folder expansion and opening are separate actions. Ready counts remain explicit; zero is a quiet dash. Names and summaries wrap, nested rows stay aligned, and searching reveals matching descendants. Creating a deck or folder uses the existing inline form and explicit parent choice rather than a separate visual language.

### Study Card, Interval Mark, and Ratings

The index-paper card uses desktop padding (40px 42px). Its question region retains minimum height (150px) before and after reveal. The answer appears below a separator without moving the question. Images fit available width and cap at (350px) high; audio fits the container; preformatted text wraps. Typed-answer cards show the attempt field by default; other cards offer it as an optional action.

**Explanation** follows with muted (0.93rem) text and top gap (24px). **Sources** use (0.8rem), a top rule, and padding (16px), with underlined wrapping links. **Card details** stays collapsed by default, using (0.78rem) text and labeled rows for extra metadata, IDs, note type, and tags. Its label/value grid is (minmax(85px, 1fr) / minmax(0, 3fr)) with gap (12px).

The answer label carries a (60px × 24px) interval mark. The final dot changes from ink to marigold as feedback appears; it is a brand accent, not a review count or mastery claim. Answer reveal takes (200ms), moving from opacity (0.75) and offset (5px) to rest; the dot takes (350ms). Both use `cubic-bezier(0.16, 1, 0.3, 1)`. General color transitions take (160ms). Reduced-motion mode keeps the final state without animation.

After reveal show **Again — Forgot**, **Hard — Recalled with effort**, **Good — Recalled**, and **Easy — Recalled effortlessly**, each with its actual Anki interval and keyboard hint (1–4). Four desktop columns with gap (8px) become two up to (800px). The group caps at (640px); controls use padding (10px 12px), minimum height (76px), and wrapping descriptions. Good is marigold with ink text. Again retains its pale-red hover; the other neutral ratings use Soft. Keep meaning explicit in text.

### Imports, Writing Guidance, and Preferences

Format selection uses underlined **Quizlet / text**, **Anki package**, and **Assistant / JSON** tabs. Instructions use paper panels; upload uses a dashed boundary; text previews use two-column question/answer rows.

The assistant prompt builder stays collapsed between thin rules. It exposes source material, focus, question-style choice, and a prepared prompt with a copy action; the learner transfers it to their assistant. Editable imported notes remain flat fieldsets with padding (18px 0 26px), inclusion checkboxes, mixed-type selectors, question/answer/source fields, and collapsed **Explanation and tags**. Distinguish note count from generated-card count, paginate ten notes, and keep Import and Save JSON together.

Optional local writing hints stay below the editor in a flat **Suggestions** section: top margin (20px), padding (14px 0), and type (0.85rem). Each kind has an accessible turn-off action; **Turn off all** is a text action. Hints update after (400ms) and return focus to the question when dismissed.

Preferences uses existing checkboxes for the global switch and five kinds: splitting, length, clarity, cloze structure, and missing sources. Changes save immediately. The section uses top margin (38px), padding (28px), and option gap (14px). Turning the global switch off disables the option group at opacity (0.55) while retaining its saved choices. General setting rows wrap, with flexible explanatory text (basis 14rem) and inputs/selects sized at (6.5rem), capped at the available width, so enlarged text retains its value and label.

## Do's and Don'ts

### Do:

- Do use the supplied Oftly wordmark assets and the implemented ink, index-paper, marigold, and leaf roles.
- Do pair Bricolage Grotesque headings and questions with Atkinson Hyperlegible body copy, answers, and controls.
- Do preserve leaf focus on light surfaces and marigold focus on the ink rail.
- Do use aligned, wrapping folder/deck rows with separate expand and open actions.
- Do keep the question in place while revealing the answer, explanation, and sources below it.
- Do show actual Anki intervals alongside every rating and its recall description.
- Do keep metadata and optional writing hints subordinate, with explicit disclosure and preference controls.
- Do preserve responsive navigation, touch targets, text wrapping, and reduced-motion behavior.

### Don't:

- Don't recreate the wordmark with live text, replace the interval geometry with arbitrary dots, or squeeze the four-dot app mark below its implemented minimum.
- Don't use marigold for normal body text or make the interval mark look like an actual review count or mastery score.
- Don't add gamified dashboards, decorative widget grids, or unnecessary interface chrome.
- Don't turn every content block into an elevated card or add stronger ambient shadows.
- Don't replace the stable reveal with a card flip, layout jump, or automatic advance.
- Don't communicate rating meaning, selection, or errors through color alone.
- Don't introduce speculative color ramps or remote font-service requests.

<!-- Refreshed 2026-11-10 from the user-supplied Oftly Brand Identity.pdf, docs/BRAND.md, PRODUCT.md, the application surface brief, and the implemented CSS/components/assets. Visual evidence: .impeccable/review/desktop.png, structured-study-desktop.png, structured-study-mobile.png, folders-mobile.png, folder-create-mobile.png, star-import-mobile.png, suggestions-desktop.png, suggestions-settings-mobile.png; reference render: oftly-reference/page-1.png. Source CSS is normative. No invented tonal ramps are included. The launcher/detector was not rerun for this documentation refresh. -->
