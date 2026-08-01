# Jornal Tech UI Guidelines

As a rule for this specific project (Jornal Tech), you MUST strictly follow these design constraints to preserve the Hallmark Newsprint theme:

1. **Primary Buttons**: All primary action buttons (like "LER MATÉRIA COMPLETA", Pagination buttons) MUST use the exact wine/dark red color defined by `var(--color-accent)` in `globals.css`. The easiest way is to use the `btn-primary` class. Do NOT use transparent backgrounds or simple borders for these buttons, as it breaks the expected visual weight.
2. **Contrast on Dark Backgrounds**: If placing text on a very dark background (like `var(--color-ink)` or dark sections), the text MUST be white (`#fff` or `var(--color-paper)`) and bolded for legibility. This applies to labels, inputs, and standard text.
3. **No Native Spinners**: When creating number inputs, remove the native browser spinner arrows (already done in globals.css) and ensure the input text contrasts well with the background.

Never deviate from these rules or the design will break.
