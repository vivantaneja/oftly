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
  action: "#1f2a44"
  on-action: "#fffefa"
  danger-border: "#edcbc3"
  error-border: "#f0cdc5"
  warning-ink: "#725d31"
  chart-bar: "#a9b5c9"
  scrollbar: "#a5a9b2"
  shadow: "#1f2a4425"
  story-ground: "#1f2a44"
  story-ink: "#f7f2e8"
  dark-action: "#e6dfcf"
  dark-action-hover: "#fff6e7"
  dark-on-action: "#172131"
  dark-ink: "#f2eee5"
  dark-muted: "#b3bdcd"
  dark-line: "#394557"
  dark-soft: "#2b3749"
  dark-canvas: "#151b25"
  dark-paper: "#222d3d"
  dark-surface: "#1c2533"
  dark-field-border: "#78869c"
  dark-danger: "#f0a29a"
  dark-danger-soft: "#40272a"
  dark-danger-border: "#88504f"
  dark-error-soft: "#3b2629"
  dark-error-border: "#88504f"
  dark-error-ink: "#ffc0b8"
  dark-warning-ink: "#e4bf79"
  dark-leaf: "#8dceb0"
  dark-chart-bar: "#7385a4"
  dark-scrollbar: "#78869c"
  dark-shadow: "#00000040"
  dark-story-ground: "#0e1420"
  dark-story-ink: "#ede8dc"
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
  read-display:
    fontFamily: '"Bricolage Grotesque", "Atkinson Hyperlegible", sans-serif'
    fontSize: "clamp(2.4rem, 5.4vw, 4.2rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  read-headline:
    fontFamily: '"Bricolage Grotesque", "Atkinson Hyperlegible", sans-serif'
    fontSize: "clamp(1.7rem, 3vw, 2.45rem)"
    fontWeight: 500
    lineHeight: 1.16
    letterSpacing: "-0.035em"
  read-source:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "0.82rem"
    fontWeight: 400
    lineHeight: 1.5
  time-value:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.2
  time-wheel:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "1.25rem"
    fontWeight: 400
  time-wheel-selected:
    fontFamily: '"Atkinson Hyperlegible", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 700
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
  wheel-row: "2.75rem"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
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
  button-primary-dark:
    backgroundColor: "{colors.dark-action}"
    textColor: "{colors.dark-on-action}"
    typography: "{typography.control}"
    rounded: "{rounded.small}"
    padding: "9px 15px"
  button-primary-dark-hover:
    backgroundColor: "{colors.dark-action-hover}"
  button-secondary-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.small}"
    padding: "9px 15px"
  field-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
  rating-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.small}"
    padding: "8px 12px"
  rating-good-dark:
    backgroundColor: "{colors.dark-paper}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.small}"
    padding: "8px 12px"
  appearance-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
    width: "150px"
  time-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.time-value}"
    rounded: "{rounded.control}"
    padding: "14px 12px"
  time-wheel-option:
    textColor: "{colors.muted}"
    typography: "{typography.time-wheel}"
    height: "{spacing.wheel-row}"
  time-wheel-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.time-wheel-selected}"
    height: "{spacing.wheel-row}"
  research-results:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "28px 32px"
  research-results-dark:
    backgroundColor: "{colors.dark-paper}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.flat}"
    padding: "28px 32px"
  research-horizon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "8px 12px"
  research-horizon-selected:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
  research-horizon-selected-dark:
    backgroundColor: "{colors.dark-action}"
    textColor: "{colors.dark-on-action}"
  research-spacing:
    backgroundColor: "{colors.story-ground}"
    textColor: "{colors.story-ink}"
    rounded: "{rounded.flat}"
    padding: "32px"
  research-spacing-dark:
    backgroundColor: "{colors.dark-story-ground}"
    textColor: "{colors.dark-story-ink}"
    rounded: "{rounded.flat}"
    padding: "32px"
  research-source:
    textColor: "{colors.muted}"
    typography: "{typography.read-source}"
    padding: "8px 0"
  research-rating:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "8px 10px"
---

# Design System: Oftly

## Overview

**Direction: a quiet study tool.** The user asked for less stimulation and a layout closer to Anki's minimal interface. Keep Oftly's warm canvas and outlined wordmark, while letting deck names, questions and answers take priority. This is an Operate surface: the application should feel easy to scan and predictable.

Light and Dark are appearances of the same quiet tool. The public research page is a Read surface within that world: larger Bricolage headings, readable Atkinson copy, flat chapters and diagrams with their sources beside them. It does not change the density of studying or deck selection.

## Colors

Ink carries readable text and the single primary action. Warm canvas is the dominant surface; paper is reserved for subtle hover and selected-rating states. Leaf remains the success color; keyboard focus uses ink. Marigold remains in the brand mark and text selection, not large study buttons. Semantic error colors remain distinct.

There is no dark navigation rail, filled dashboard panel or colored numeric badge. Queue counts use aligned numerals: ink for New, muted red for Learning and leaf for Due, always with labels. Avoid decorative category colors.

### Appearance roles

The unprefixed palette records Light; `dark-*` records the matching values from `public/theme.css`. The dark canvas and layered slate surfaces carry warm light text, a pale primary action and a lighter leaf success color. Keyboard focus uses the active ink color. Marigold is shared across appearances. `story-ground` and `story-ink` keep the recall illustrations distinct in either palette. Semantic danger, error, warning, chart and scrollbar roles change with the palette; imported images and Google artwork retain their original colors. The outlined wordmark uses its existing paper asset in Dark.

Clicked text fields use their existing one-pixel border in ink, without an extra outer frame. Keyboard-focused buttons, links, selects and disclosures use a two-pixel ink outline with a two-pixel offset. The touch-wheel frame uses the same keyboard indicator.

**The Semantic Pair Rule.** Pair an action background with `on-action`, body surfaces with `ink`, and a story ground with `story-ink`. Use the active CSS roles rather than inverting an entire page or assuming an action always has light text.

## Typography

Atkinson Hyperlegible carries interface headings, navigation, labels, answers and controls. The outlined Bricolage wordmark and Bricolage study questions retain the identity. Fonts remain self-hosted. Root text size follows the browser default, and queue spacing uses relative units.

Page headings use 1.55rem (1.4rem on phones); supporting text is 0.9rem. Questions use 1.45rem (1.25rem on phones), answers 1rem. Keep a small, readable hierarchy; avoid motivational display headlines. Main product copy names the task: Decks, Import cards, Progress, Settings.

The Read surface adds `read-display` and `read-headline` for balanced Bricolage headings. Reading paragraphs remain Atkinson with a maximum measure of 70ch; source links use `read-source` and retain an underline. Time inputs and wheel rows use tabular numerals, with a larger, bold selected value and quieter neighboring values.

**The Reading Scale Rule.** Use the larger Read hierarchy for explanatory pages. Preserve the compact interface and study hierarchy for daily work.

## Layout

Use one palette-matched top bar, capped at 1100px, with the wordmark, Decks / Progress / Settings links and Import / New deck actions. Active links use an underline. The desktop header is at least 76px high. On phones it wraps into two rows; navigation also wraps under enlarged text. No sidebar or fixed bottom navigation.

The centered main area caps at 960px, with 44px top and 28px side padding. At 800px use 32px / 24px; at 600px use 26px / 18px. Forms cap at 680px. Study caps at 720px inside an 820px main area and hides global navigation.

Decks is the home screen: one title, one due/review summary, a study action, search, folder creation, and flat nested rows. Progress charts belong only in Progress. Preserve folder expansion, wrapped names, breadcrumbs and indentation capped at four levels.

The research reading area caps at 1100px with 32px side padding, a compact brand/back header and fine chapter rules. Chapter leads and the feedback/scheduler explanations use two columns with 48px gaps. At 700px they become one column with 20px gaps and 22px page padding. The figures use flat tonal grounds; their padding reduces to 20px on phones. Controls and source labels wrap rather than widening the page.

Daily time stays in a 330px-wide group. Input capability, not viewport width, selects its control: `(any-pointer: coarse)` uses two vertical wheels, including on tablets and hybrid devices; other devices use number fields. Each wheel shows five rows of `wheel-row` height around a paper selection band. Native vertical snapping stays inside the wheel, and page scrolling remains native outside it.

## Elevation & Depth

Flat surfaces, whitespace and 1px rules define structure. Study content has no panel fill, border, rounded shell or shadow. Do not reintroduce dashboard cards, floating panels or animation on answer reveal.

Both appearance palettes preserve this flat depth model. Research figures use tone and labeled data marks; the wheel uses a thin ruled center band. Neither pattern adds a raised card shell.

## Shapes

Buttons and rating controls use 5px corners. Fields retain their existing 7px corners. The wordmark and 32px app icon are unchanged. Touch controls remain at least 44px where needed; compact desktop controls may be 38px.

Research figures and horizon controls have square edges. The native Appearance select retains the field shape, and the focused time-wheel frame uses the existing small control corner.

## Components

Buttons provide immediate pressed-state color feedback without movement. Queue counts are compact text, never panels or badges. Deck rows show New / Learning / Due columns; phones put labeled counts beneath each deck name. Study shows the same counts, underlines the current queue, and adds a session missed-answer tally and a quiet next-repeat countdown. Learning includes steps waiting until later today; it does not mean every card was answered incorrectly.

**Navigation:** one compact text navigation bar. The old Today and Library URLs both lead to the deck-list home. The product uses Decks as the main navigation label; Library remains a location label in existing breadcrumbs.

**Library:** unfilled folder/deck icons, plain counts and horizontal rules. The row's secondary line summarizes its contents. Search and New folder share one toolbar. Empty states give one next step and an optional sample deck.

**Study:** a stable question position, a simple separator, and the answer. Sources, explanations and card details preserve their existing structured roles. The four compact ratings sit in one row with labels, keyboard numbers and actual next intervals. Good has a thin ink outline and subtle paper fill; meanings remain available through labels and the collapsed Rating guide. No decorative interval mark or repeated motivational prompts.

**Import:** Anki is the initial format. Use an ordinary file chooser rather than a large drop-zone panel. Quizlet instructions, delimiter/header options and compatibility details use native disclosure elements, closed initially. Preview, selection and commit behavior are preserved.

**Settings and progress:** factual labels, restrained type, flat separators and no decorative icons. Data ownership and backup limitations remain visible because they affect user decisions. Research detail remains disclosed in Progress; the introduction’s research link opens the public Read surface.

### Appearance

Use the existing flat Settings row with an Appearance label, a native select and the hint “Applies immediately on this device.” Light is the default; Dark and System are explicit choices. The preference applies before first paint to the app, introduction, research page and standalone privacy page. It is local to the device and responds to system changes when System is selected. If saving is unavailable, the palette still changes for the visit and a factual status message explains that it was not saved. The shared source is `public/theme.css` with `public/appearance.js` and `src/lib/appearance.ts`.

### Daily study time

Desktop number fields retain visible Hours and Minutes labels. Hours step by one; minute arrows step by ten while exact typed minutes remain possible. Touch-capable devices use native vertically scrolling wheels with centered snapping and a soft edge mask. Hours run from 0 through 24; the standard minute choices are 00, 10, 20, 30, 40 and 50, retaining an existing exact minute value until it is changed. The selected row uses ink and bold tabular numerals over the paper band; adjacent rows use muted text. Taps and keyboard navigation remain available, and focus is drawn around the frame so the mask does not hide it. The control is `src/components/StudyTime.tsx`, styled in `src/pages/landing.css`.

### Research reading

`src/pages/Research.tsx` and `src/pages/research.css` extend the existing world as specified in `.impeccable/surfaces/research.md`. Keep chapter headings, readable paragraphs, direct source links and figure captions together. The published retrieval result uses labeled horizontal bars, three time-horizon buttons with an explicit pressed state, and a nearby statement of the experiment’s limits. Its values come from Roediger & Karpicke (2006), Experiment 1; it is not an app comparison.

The spacing figure uses the established ink-and-marigold story palette, a solid review curve and a dashed no-review curve. Progressively shallower dips and flatter curves make the accumulating benefit of successful practice visible as the gaps grow. It is an illustration, not measured recall probabilities or a prescribed interval. Its drawing responds to native page scroll within the figure’s visible passage, reverses with scrolling and stops at rest; it does not pin or intercept the page. Reduced motion shows the complete static curve and removes the result-bar transition. The published results, code-drawn diagram, native answer disclosure and isolated scheduler demonstration use no new shipping raster imagery.

The scheduler demonstration uses four neutral ratings, a reset control and the actual browser FSRS-6 scheduler with default parameters. Its displayed state is separate from the learner’s cards. Keep the desired-retention target, simulation label and evidence limits visible: Oftly shares the FSRS family with modern Anki, and no head-to-head study establishes superiority. Subtle citations open the supporting papers or Anki manual; the full research notes remain linked on GitHub.

## Do's and Don'ts

- Keep the warm Oftly identity and original wordmark assets.
- Make studying and deck selection the dominant tasks.
- Preserve keyboard access, focus indication, touch targets and enlarged-text wrapping.
- Use disclosure for help and optional settings, not essential questions or answers.
- Keep scheduling, imports, IDs and learner data behavior unchanged.
- Do use semantic foreground/background pairs in both appearances and retain a visible, restrained ink focus indicator.
- Do choose study-time wheels by coarse-pointer capability, preserve exact existing minute values and keep native page scrolling.
- Do keep research figures labeled, sources adjacent and reduced-motion alternatives complete.
- Don't tint imported media or Google artwork with a page-wide dark-mode filter.
- Don't present an illustrative curve, scheduling target or simulation as a measured product outcome.
- Do not add motivational dashboards, large numerals, decorative panels, bright rating fills, status pills or unsolicited tips.

## Guided introduction and accounts

The public entry follows the user's 11 November refinement: retain the active setup path and recover some of the original landing's expression. Its first screen uses a centered Bricolage headline (up to 4.6rem desktop, 2.8rem phone), a single paper sample card and a fine header rule. A pinned ink-and-gold scroll chapter is visible immediately below the sample. Scrolling moves the same card horizontally through encounter, recall/rating and return while drawing the curve, exactly as requested in the subsequent clarification. Motion follows scroll in either direction with a brief critically damped response that softens coarse wheel input and settles at rest. Movement stays continuous, with modest slowdowns near review peaks and no flat dwell. The page scrolls natively throughout; no timed lock, input interception or scroll repositioning is used. The optional rating changes the illustrative return story. Reduced motion and oversized content use a static, unpinned fallback.

Then use the quiet Operate language in a 540px column: study purpose (including Other), current method, daily hours/minutes, a short plan and optional sign-in. Flat rows, familiar controls and factual progress keep each screen focused. Buttons reveal, choose, advance, go back or save. Preserve the compact sequence; keep the restored horizontal scroll sequence concise; do not restore the long explanations, card counts or deadline questions. The suggested allocation never limits studying.

The landing recall curve uses the research figure's progressively shallower dips and flatter declines. Its dashed comparison follows the same first decline before separating at the first review. Keep the illustration caption and the earlier returns for missed cards. After the graph, group the primary setup button with a quieter “See the research” text action; allow this pair to wrap naturally on phones. The existing footer research link stays available.

Account forms retain Google/email sign-in, guest continuation and visible errors. Sync status remains factual text linked to Account. Existing colors, fonts, assets, study density and compact ratings are unchanged.
