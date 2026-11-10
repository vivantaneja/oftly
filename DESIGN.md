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
  danger: "#a33c34"
  danger-soft: "#fcece8"
  error-soft: "#fff0ed"
  error-ink: "#8a322b"
  success-soft: "#e8f1ec"
typography:
  headline:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "1.55rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "0em"
  body:
    fontFamily: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.9rem"
    fontWeight: 550
  control:
    fontFamily: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.9rem"
    fontWeight: 560
  study-question:
    fontFamily: '"Bricolage Grotesque", "Atkinson Hyperlegible", sans-serif'
    fontSize: "1.45rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "-0.018em"
  study-answer:
    fontFamily: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  flat: "0px"
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
    rounded: "{rounded.small}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.small}"
    padding: "9px 15px"
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
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "0"
  queue-count:
    textColor: "{colors.ink}"
  queue-learning:
    textColor: "{colors.danger}"
  queue-due:
    textColor: "{colors.leaf}"
  flashcard:
    backgroundColor: "transparent"
    rounded: "{rounded.flat}"
    padding: "24px 12px"
  rating:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "8px 12px"
  rating-good:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "8px 12px"
  draft-note:
    padding: "18px 0 26px"
  card-guidance:
    padding: "14px 0"
  folder-row:
    rounded: "{rounded.tag}"
    padding: "13px 8px"
---

# Design System: Oftly

## Overview

**Direction: a quiet study tool.** The user asked for less stimulation and a layout closer to Anki's minimal interface. Keep Oftly's warm canvas and outlined wordmark, while letting deck names, questions and answers take priority. This is an Operate surface: the application should feel easy to scan and predictable.

## Colors

Ink carries readable text and the single primary action. Warm canvas is the dominant surface; paper is reserved for subtle hover and selected-rating states. Leaf remains the focus/success color. Marigold remains in the brand mark and text selection, not large study buttons. Semantic error colors remain distinct.

There is no dark navigation rail, filled dashboard panel or colored numeric badge. Queue counts use aligned numerals: ink for New, muted red for Learning and leaf for Due, always with labels. Avoid decorative category colors.

## Typography

Atkinson Hyperlegible carries interface headings, navigation, labels, answers and controls. The outlined Bricolage wordmark and Bricolage study questions retain the identity. Fonts remain self-hosted. Root text size follows the browser default, and queue spacing uses relative units.

Page headings use 1.55rem (1.4rem on phones); supporting text is 0.9rem. Questions use 1.45rem (1.25rem on phones), answers 1rem. Keep a small, readable hierarchy; avoid motivational display headlines. Main product copy names the task: Decks, Import cards, Progress, Settings.

## Layout

Use one light top bar, capped at 1100px, with the wordmark, Decks / Progress / Settings links and Import / New deck actions. Active links use an underline. The desktop header is at least 76px high. On phones it wraps into two rows; navigation also wraps under enlarged text. No sidebar or fixed bottom navigation.

The centered main area caps at 960px, with 44px top and 28px side padding. At 800px use 32px / 24px; at 600px use 26px / 18px. Forms cap at 680px. Study caps at 720px inside an 820px main area and hides global navigation.

Decks is the home screen: one title, one due/review summary, a study action, search, folder creation, and flat nested rows. Progress charts belong only in Progress. Preserve folder expansion, wrapped names, breadcrumbs and indentation capped at four levels.

## Elevation & Depth

Flat surfaces, whitespace and 1px rules define structure. Study content has no panel fill, border, rounded shell or shadow. Do not reintroduce dashboard cards, floating panels or animation on answer reveal.

## Shapes

Buttons and rating controls use 5px corners. Fields retain their existing 7px corners. The wordmark and 32px app icon are unchanged. Touch controls remain at least 44px where needed; compact desktop controls may be 38px.

## Components

Buttons provide immediate pressed-state color feedback without movement. Queue counts are compact text, never panels or badges. Deck rows show New / Learning / Due columns; phones put labeled counts beneath each deck name. Study shows the same counts, underlines the current queue, and adds a session missed-answer tally and a quiet next-repeat countdown. Learning includes steps waiting until later today; it does not mean every card was answered incorrectly.

**Navigation:** one compact text navigation bar. The old Today and Library URLs both lead to the deck-list home. The product uses Decks as the main navigation label; Library remains a location label in existing breadcrumbs.

**Library:** unfilled folder/deck icons, plain counts and horizontal rules. The row's secondary line summarizes its contents. Search and New folder share one toolbar. Empty states give one next step and an optional sample deck.

**Study:** a stable question position, a simple separator, and the answer. Sources, explanations and card details preserve their existing structured roles. The four compact ratings sit in one row with labels, keyboard numbers and actual next intervals. Good has a thin ink outline and subtle paper fill; meanings remain available through labels and the collapsed Rating guide. No decorative interval mark or repeated motivational prompts.

**Import:** Anki is the initial format. Use an ordinary file chooser rather than a large drop-zone panel. Quizlet instructions, delimiter/header options and compatibility details use native disclosure elements, closed initially. Preview, selection and commit behavior are preserved.

**Settings and progress:** factual labels, restrained type, flat separators and no decorative icons. Data ownership and backup limitations remain visible because they affect user decisions. Research detail is disclosed in Progress.

## Do's and Don'ts

- Keep the warm Oftly identity and original wordmark assets.
- Make studying and deck selection the dominant tasks.
- Preserve keyboard access, focus indication, touch targets and enlarged-text wrapping.
- Use disclosure for help and optional settings, not essential questions or answers.
- Keep scheduling, imports, IDs and learner data behavior unchanged.
- Do not add motivational dashboards, large numerals, decorative panels, bright rating fills, status pills or unsolicited tips.

## Public landing and account extension

The public introduction is an explicit, user-requested exception to the quiet Operate surface. Preserve the same Oftly palette, assets and fonts. Larger Bricolage headings (up to 5.6rem desktop, 2.9rem phone) and a single ink-background chapter may explain the review cycle. Follow one clearly labeled sample card through retrieval, rating and return; tie scroll motion to that sequence and the illustrative curve. No automatic looping animation, decorative badges or invented metrics. Reduced motion presents the complete diagram and manually selectable stages. Labels remain readable independently of SVG scaling.

The planner uses ordinary grouped form controls and flat separators. Its numbers describe a disclosed time budget, not measured learning outcomes. Account forms use the incumbent control language, with Google/email sign-in, a guest option and visible error states. Sync status is factual text linked to Account; no account dashboard or new colored status badges. Preserve the study app's type scale, compact ratings and motion-free reveal. Keep the existing design tokens unchanged.
