---
name: Nouveau Fintech
colors:
  surface: '#fbf9fb'
  surface-dim: '#dbd9db'
  surface-bright: '#fbf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f5'
  surface-container: '#efedef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#44474d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#515f78'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0d1c32'
  on-primary-container: '#76849f'
  inverse-primary: '#b9c7e4'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed01b'
  on-secondary-container: '#6f5900'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b1701'
  on-tertiary-container: '#9f7d5b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#ffe083'
  secondary-fixed-dim: '#eec200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#e7bf99'
  on-tertiary-fixed: '#2b1701'
  on-tertiary-fixed-variant: '#5d4124'
  background: '#fbf9fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  success-green: '#22c55e'
  danger-red: '#ef4444'
  surface-bg: '#f7f9fb'
  surface-card: '#ffffff'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  numeric-data:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 24px
  gutter-grid: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 48px
---

## Brand & Style

The design system embodies a **Modern Corporate** aesthetic with a "High-Contrast Premium" twist. It is tailored for a sophisticated fintech audience that values institutional security but expects the speed and vibrancy of contemporary digital products.

The visual narrative is built on the tension between the deep, stable foundation of the primary navy and the energetic, high-performance nature of the vibrant yellow. The style is clean and structured, utilizing heavy whitespace and precise geometry to convey a sense of absolute financial accuracy and elite service. 

Key emotional pillars:
- **Stability:** Grounded by deep navy tones.
- **Energy:** Accelerated by the sharp yellow accents.
- **Exclusivity:** Communicated through minimal, high-quality typography.
- **Clarity:** Reinforced by a rigid grid and logical information hierarchy.

## Colors

The color strategy uses high-contrast pairings to drive action and ensure readability.

- **Primary (Deep Navy):** The core brand color. Used for structural elements, headers, and the most critical text. It provides the "institutional" feel.
- **Secondary (Vibrant Yellow):** The catalyst color. Replaces all previous blue tones. Used for active states, primary call-to-actions, and interactive indicators. Because this is a bright color, it must be paired with the primary navy for text or icons to ensure WCAG AA compliance.
- **Neutral:** A range of cool grays derived from the primary navy's hue to maintain a cohesive palette.
- **Semantic Colors:** Success green and Danger red are used strictly for financial trends (credits/debits) and system alerts.

## Typography

This design system uses **Hanken Grotesk** for headlines to provide a sharp, contemporary fintech look, while **Inter** is used for body and data for its unrivaled legibility.

- **Financial Figures:** All currency and balance displays must use `numeric-data` with tabular figures enabled. This ensures that decimal points and digits align perfectly in vertical lists.
- **Hierarchy:** Use the uppercase `label-caps` for small meta-information or section titles above cards to create a distinct rhythmic break from body copy.
- **Adaptation:** Large displays scale down by approximately 15% on mobile devices to prevent excessive line wrapping while maintaining impact.

## Layout & Spacing

The system follows a **Fixed-Fluid Hybrid** model. The interface adheres to a strict 4px baseline grid.

- **Mobile:** Elements are fluid within a 24px safe-margin "container." This generous margin creates the premium, airy feel essential to the brand.
- **Desktop/Tablet:** Content is centered within a 12-column fixed grid (max-width 1200px) with 24px gutters.
- **Vertical Rhythm:** Major section blocks (e.g., separating the card carousel from the transaction list) should use `stack-lg` (32px). Smaller groupings like form labels and inputs should use `stack-sm` (8px).

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and highly diffused shadows. 

- **Level 0 (Base):** Page background uses a subtle off-white (`#f7f9fb`) to reduce eye strain and make level 1 elements pop.
- **Level 1 (Cards/Inputs):** Pure white surfaces (`#ffffff`) with a very soft "Ambient Shadow": `0px 4px 20px rgba(10, 25, 47, 0.05)`.
- **Level 2 (Modals):** High-depth shadows to suggest floating: `0px 12px 40px rgba(10, 25, 47, 0.12)`.
- **Active Interactions:** Buttons and cards do not use heavy shadows on hover; instead, they utilize a subtle scale-down (98%) and a color shift to the Secondary Yellow to signal "pressed" states.
- **Glassmorphism:** Navigation headers and bottom bars use a 20px backdrop blur with 80% opacity white to maintain spatial awareness of the content scroll.

## Shapes

The shape language is "Sophisticated Rounded," opting for geometry that feels modern but remains professional.

- **Account Dashboards:** Use `rounded-xl` for large balance cards to make them feel like "objects" in the UI.
- **Standard Buttons:** Set to `rounded-md` (12px) to maintain a crisp, functional edge.
- **Interactive Icons:** Small chips or status tags use "Pill" shapes for instant recognition as interactive/tappable metadata.
- **Avatars:** Strictly circular to contrast against the predominantly rectangular grid.

## Components

### Buttons
- **Primary:** Background in Deep Navy (#0A192F) with White text. 
- **Secondary/Action:** Background in Vibrant Yellow (#FACC15) with Deep Navy text. Use this for the most important action on a screen (e.g., "Send Money").
- **Ghost:** Transparent background with 1px Deep Navy border or text.

### Inputs & Forms
- **Default:** White background, 1px Gray-300 border.
- **Focused:** 2px Vibrant Yellow border. This high-contrast state is the primary indicator of user focus.
- **Error:** 1px Danger Red border with a small red helper text below.

### Cards
- **Account Cards:** Feature a deep navy background. The balance should be the most prominent element in white, with the "Add Funds" button in Vibrant Yellow for high visibility.
- **Transaction Items:** White background, thin separator line. The amount should be Navy for neutral, Green for positive, and Red for negative.

### Navigation
- **Active States:** The active icon and label must switch to Vibrant Yellow. Inactive states remain a medium-gray to ensure the active tab is unmistakable.
- **FAB (Floating Action Button):** Circular, Vibrant Yellow background with a Navy "+" icon.

### Progress & Data
- **Charts:** Line charts use the Vibrant Yellow for the data path, with a soft navy-to-transparent gradient fill. 
- **Chips/Badges:** Use a light tint of yellow with navy text for "Pending" or "New" status indicators.