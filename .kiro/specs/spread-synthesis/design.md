# Design Document — Card Reveal & Export Redesign

## Overview

Complete rework of the card reveal experience and JPG export layout. The reveal becomes a ceremonial multi-card experience with simultaneous flip animation, and the card back introduces a two-column layout (sacred text | AI synthesis). Downloads are always vertical, mobile-first, with all cards stacked in one tall image.

## Architecture Changes

### 1. Two-Column Card Back (Screen + JPG)

The revealed card back shows two columns, both center-aligned:

- **Column 1 (Left):** Title, Pillar, Purpose, Meaning, Mantra — the sacred authored content
- **Column 2 (Right):** Pollinations AI synthesis — personalized interpretation

Both columns auto-balance in height. If one is longer, the other stretches to match (CSS flexbox with align-items: stretch). All text center-aligned within each column.

Styling: Same dark background (#060810), gold borders (D4AF37), Cinzel for headings, Cormorant Garamond for body. Each column has its own inner wrapping/border.

### 2. Reveal Flow by Product

#### Single Card (Quick Insight - Product 1)
- Fan ? pick 1 card ? card flips ? shows front (artwork) ? user taps to flip ? two-column back
- Synthesis generates on flip
- Save button in page body (not on card)

#### 3 Cards (Past, Present, Future - Product 2)
- Fan ? pick 3 cards sequentially ? they stack face-down on screen
- Once all 3 selected: cards spread out in a row
- Center card glows/vibrates
- User touches center card ? ALL 3 flip to show fronts simultaneously (cascade pulse)
- User taps individual cards to flip to back (two-column)
- Spread synthesis generates once all fronts are visible
- Save button in page body — downloads 1 vertical composite image

#### 5 Cards (Deep Dive - Product 3)
- Fan ? pick 5 cards sequentially ? they stack face-down
- Once all 5 selected: cards spread out in W-shape or row
- Center card glows/vibrates
- User touches center card ? ALL 5 flip face-up simultaneously
- User taps individual cards to see backs
- Spread synthesis generates once all fronts visible
- Save = 1 vertical composite image

#### Subscription 2/day (Product 5)
- Each card is a SEPARATE reveal throughout the day
- Same flow as single card (fan ? pick ? flip ? back ? save)
- Each has its own synthesis, its own download
- NOT grouped

#### Subscription 3/day (Product 6)
- Same as sub 2 — 3 separate reveals throughout the day
- Each is independent with own synthesis and download

### 3. Download/Export Layout (Vertical, Mobile-First)

All exports are vertical images, 900px wide, optimized for phone gallery viewing.

#### 1 Card Export:
```
+---------------------+
¦    CARD FRONT (A)   ¦  ? Full artwork, tarot proportions
+---------------------¦
¦  Col1    ¦    Col2  ¦  ? Sacred text | AI synthesis
+---------------------¦
¦      FOOTER         ¦  ? Tessera Lumen branding + Pollinations attribution
+---------------------+
```

#### 3 Card Export (1 tall image):
```
+---------------------+
¦    CARD 1 FRONT     ¦
+---------------------¦
¦  Col1    ¦    Col2  ¦  ? Card 1 sacred | Card 1 individual meaning
+---------------------¦
¦    CARD 2 FRONT     ¦
+---------------------¦
¦  Col1    ¦    Col2  ¦  ? Card 2
+---------------------¦
¦    CARD 3 FRONT     ¦
+---------------------¦
¦  Col1    ¦    Col2  ¦  ? Card 3
+---------------------¦
¦   SPREAD SYNTHESIS  ¦  ? Combined narrative connecting all 3
+---------------------¦
¦      FOOTER         ¦
+---------------------+
```

#### 5 Card Export — same pattern, all 5 stacked, spread synthesis at bottom.

### 4. Card Dimensions
- Real tarot proportions: approximately 2:3.5 ratio (like 900px × 1575px per card front)
- In the composite, card fronts can be slightly smaller to keep file size reasonable
- Export at 900px wide, JPG quality 0.92

### 5. Two-Column Auto-Balance Rules
- Both columns are flex children with `align-items: stretch`
- Content within each column is `text-align: center`
- If Column 1 text is much longer, Column 2 adds vertical padding to match
- Gold divider line between columns (1px, rgba(212,175,55,0.3))
- Each column has its own border/wrapping matching the card aesthetic

### 6. Files to Modify/Create

| File | Change |
|------|--------|
| `frontend/src/utils/readingExport.js` | Rebuild `buildCompositionDOM` for two-column layout + composite export function |
| `frontend/src/screens/RevealScreen.jsx` | Multi-card stacking flow, simultaneous reveal animation, new phase states |
| `frontend/src/components/SynthesisDisplay.jsx` | May become part of the card back rather than separate |
| `frontend/src/components/CardBack.jsx` | NEW — two-column card back component for screen display |
| `frontend/src/components/CardStack.jsx` | NEW — multi-card stacking + simultaneous flip logic |
| `frontend/src/services/synthesisService.js` | No changes needed (already handles single + spread) |

### 7. Build Order

1. **Two-column card back layout** — CardBack component + export DOM rebuild
2. **Single card flow** — integrate new back into existing reveal
3. **Multi-card selection** — stack face-down, spread on completion
4. **Simultaneous reveal** — center card glow, tap to flip all
5. **Individual card flip** — tap to see back
6. **Composite vertical export** — stacked cards + spread synthesis
7. **Test all products** — 1, 3, 5 card + subscriptions

### 8. What Does NOT Change
- Fan card selection mechanic (user picks from the arc)
- Card artwork/images
- Fonts (Cinzel, Cormorant Garamond)
- Color palette (dark #060810, gold #D4AF37)
- Card border styling
- Pollinations API integration (synthesisService.js)
- Payment flow
- Subscription logic
- Android WebView shell
