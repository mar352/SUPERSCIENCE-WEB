---
name: "SUPERSCIENCE"
description: "Minimalist Heavyweight Streetwear & Lifestyle Apparel - Gymshark E-Commerce Architecture"
colors:
  canvas-bg: "#ffffff"
  canvas-surface: "#f8f8f9"
  canvas-border: "#e5e5e7"
  text-primary: "#000000"
  text-secondary: "#666666"
  text-muted: "#999999"
  accent-dark: "#000000"
  accent-white: "#ffffff"
  badge-bg: "#000000"
  badge-text: "#ffffff"
typography:
  brand:
    fontFamily: "'Space Grotesk', -apple-system, sans-serif"
    fontWeight: 700
    fontStyle: "italic"
    letterSpacing: "-0.03em"
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    textTransform: "uppercase"
  headline:
    fontFamily: "'Inter', -apple-system, sans-serif"
    fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)"
    fontWeight: 700
    letterSpacing: "-0.01em"
    textTransform: "uppercase"
  body:
    fontFamily: "'Inter', -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  spec:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  sm: "0px"
  md: "0px"
components:
  announcement-bar:
    backgroundColor: "#000000"
    textColor: "#ffffff"
    height: "36px"
  button-primary:
    backgroundColor: "#000000"
    textColor: "#ffffff"
    rounded: "0px"
    padding: "14px 28px"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    border: "1px solid #000000"
    rounded: "0px"
    padding: "14px 28px"
---

# Design System: SUPERSCIENCE (Gymshark Architecture)

## 1. Overview & Creative North Star
**Reference Benchmark: Gymshark ([row.gymshark.com](https://row.gymshark.com/))**

SUPERSCIENCE mirrors Gymshark's proven high-converting e-commerce design architecture, tailored for an **oversized minimalist streetwear and lifestyle apparel brand** (Heavyweight Boxy T-Shirts, Heavyweight French Terry Shorts, and Minimalist Twill Caps).

### Core Quality Principles (Impeccable Design Standard):
- **Clean Canvas**: Crisp white background (`#FFFFFF`) with deep black typography and stark borders for maximum product pop and legible readability.
- **Gymshark Signature Product Card UX**:
  - Vertical 4:5 portrait ratio for natural studio and editorial photography.
  - Circular color swatch indicators below image.
  - **Slide-up Quick-Size Drawer (`S | M | L | XL`)** on hover for instant 1-click add to bag.
  - Minimalist uppercase badges (`NEW`, `OVERSIZED FIT`, `400 GSM`).
- **Gymshark Slide-Over Bag**:
  - Dynamic **Free Shipping Milestone Progress Bar** (e.g. *"You are $25 away from Free Worldwide Express Shipping"*).
  - Quantity steppers, size modifiers, and 1-click in-cart cross-sell recommendations.
- **Flawless Mobile & Desktop Responsive Grids**:
  - Built with **Bootstrap 5**: 4 columns on desktop (`col-lg-3`), 3 on tablet (`col-md-4`), and Gymshark's clean 2-column layout on mobile (`col-6`).

---

## 2. Colors & Contrast
- **Background**: Pure White `#FFFFFF` with `#F8F8F9` elevated sections.
- **Text**: Primary Black `#000000`, Secondary `#666666`, Spec Gray `#999999`.
- **Dividers & Borders**: Hairline `#E5E5E7` (1px solid).
- **Accents**: High-contrast black `#000000` buttons with inverted white `#FFFFFF` text.

---

## 3. Typography
- **Brandmark**: Bold slanted uppercase **SUPERSCIENCE** identity.
- **Headings**: Clean, high-impact uppercase sans-serif (*Inter* / *Grotesk*, 700/800 weight).
- **Specs & Microcopy**: Monospace (*JetBrains Mono*) for fabric GSM (`380 GSM`), prices, and live timers.

---

## 4. Components & Layout Breakdown

### A. Announcement Ticker
- Height: 36px, solid black background (`#000000`), white uppercase text: `FREE WORLDWIDE EXPRESS SHIPPING ON ORDERS OVER $150`.

### B. Header Navigation (Bootstrap `.navbar`)
- Sticky top with white background and hairline bottom border.
- Left: Slanted **SUPERSCIENCE** brandmark.
- Center: `SHOP ALL`, `OVERSIZED TEES`, `HOODIES`, `SWEATPANTS`, `WORKOUT PROGRAMS`, `ABOUT`.
- Right: Search bar modal trigger, wishlist heart counter, and slide bag drawer trigger with live badge.

### C. Hero Section
- Edge-to-edge lifestyle editorial banner featuring a model in a washed-black oversized boxy tee and relaxed pants.
- Bold uppercase headline: `DROP 01 // OVERSIZED ESSENTIALS`.
- Subtitle: `Heavyweight cotton, architectural drop-shoulder cut, engineered for daily street wear`.
- Dual action buttons: Solid black `[SHOP TEES]` and outline `[SHOP HOODIES]`.

### D. Category Spotlight Cards
- 3-column responsive grid:
  1. *HEAVYWEIGHT BOXY TEES*
  2. *OVERSIZED HOODIES*
  3. *RELAXED SWEATPANTS*
- 4:5 portrait ratio with dark bottom gradient and bold white title overlay.

### E. Science-Based Workout Programs Showcase (Featured on Home Page)
Directly integrated on the Home Page between Category Spotlights and the Product Grid:
- **Section Header**: `SCIENCE-BASED TRAINING PROTOCOLS`
- **Subhead**: `Evidence-based hypertrophy and biomechanical strength systems engineered for peak physical output`.
- **Responsive 4-Column / Carousel Cards**:
  1. **4-Day Upper / Lower Hypertrophy**: 2x/week frequency, 12-16 sets/week, 1-3 RIR target, lengthened partials.
  2. **6-Day Push / Pull / Legs Volume Matrix**: High-frequency hypertrophy split for maximal motor unit recruitment.
  3. **5-Day Powerbuilding (SBD + Hypertrophy)**: Heavy compound strength (Squat, Bench, Deadlift) + hypertrophy accessory clusters.
  4. **3-Day Full Body Efficiency System**: Antagonistic superset design for time-crunched lifters.
- **Card Interactive Trigger**: `[VIEW PROTOCOL & EXERCISES]` button opening the full workout routine modal with day-by-day exercise table, set/rep/RIR prescriptions, and recommended apparel cross-sell.

### F. Product Catalog Grid
- Responsive Bootstrap grid: `col-6 col-md-4 col-lg-3`.
- Product cards with Gymshark hover-up quick-size bar (`S | M | L | XL`), color swatches, GSM weight badges, and price.

### G. Slide-Over Bag Drawer (Bootstrap `offcanvas-end`)
- Animated free shipping progress meter.
- Line items with quantity adjustment (`- 1 +`).
- "Complete The Look" cross-sell slider.
- Sticky checkout button.
  - High-impact gym editorial photo of lifter in oversized tee/hoodie.
  - Program Title (e.g. `01. HYPERTROPHY VOLUME PROTOCOL`).
  - Frequency & Duration badge: `4 DAYS / WEEK` • `65 MIN`.
  - Science Prescriptions: `12–16 SETS / MUSCLE / WEEK` • `1–3 RIR TARGET` • `LENGTHENED PARTIAL EMPHASIS`.
  - Exercise Preview: `Barbell RDL, Incline DB Press, Hack Squat, Chest-Supported Row`.
  - Action Button: Solid black `[VIEW PROTOCOL & EXERCISES]`.
- **Interactive Workout Modal (Bootstrap `modal-xl`)**:
  - Day-by-day tabbed breakdown (Day 1: Upper A, Day 2: Lower A, Day 3: Rest, Day 4: Upper B, Day 5: Lower B).
  - Exercise table: Movement name, primary target muscle, prescribed sets, target rep range, RIR (Reps in Reserve), rest timer.
  - Biomechanical coaching cues (e.g. *"Incline DB Press: 30° bench incline, active 3s eccentric stretch at bottom for clavicular fiber stimulus"*).
  - "Download PDF Routine" button & "Shop Recommended Training Apparel" link.
