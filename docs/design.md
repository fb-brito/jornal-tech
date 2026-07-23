# Design — Jornal Tech

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre
editorial

## Macrostructure family
- Marketing pages: Manifesto
- App pages:       Long Document
- Content pages:   Long Document

## Theme
- `--color-paper`:      oklch(92%  0.045 50)
- `--color-paper-2`:    oklch(89%  0.050 50)
- `--color-ink`:        oklch(15%  0.030 25)
- `--color-ink-2`:      oklch(20%  0.030 28)
- `--color-rule`:       oklch(68%  0.030 40)
- `--color-accent`:     oklch(32%  0.10 28)
- `--color-focus`:      oklch(48%  0.18 30)

## Typography
- Display: "Playfair Display", serif, weight 700, style normal
- Body:    "Crimson Pro", serif, weight 400
- Label:   "Inter", sans-serif, weight 500
- Display tracking: -0.02em
- Type scale anchor: --text-display = clamp(2.5rem, 5vw, 4rem)

## Spacing
4-point named scale. The values are in `globals.css`. Pages must use named
tokens (`var(--space-md)`), never raw values.

## Motion
- Easings: cubic-bezier(0.16, 1, 0.3, 1) named `--ease-out`
- Reveal pattern: horizontal sweep on section entry or no reveal.
- Reduced-motion fallback: opacity-only, ≤ 150 ms.

## Microinteractions stance
- Hover delay 0 ms
- Sharp transitions for editorial brutalism

## CTA voice
- Primary CTA: oversized solid block, accent colour, square edges (radius 0).
- Secondary CTA: outline style, sharp edges.

## Per-page allowances
- Marketing pages MAY use large typographic bleeds.
- App pages MUST NOT use enrichment — function carries the page.
- Content pages: typography only.

## What pages MUST share
- The accent colour and its placement.
- The display + body fonts.
- The CTA voice (button shape, border-radius 0).
- Section heading rhythm (numeral + label + display heading pattern).

## What pages MAY differ on
- Macrostructure within the page-type family.
