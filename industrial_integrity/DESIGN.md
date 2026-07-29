---
name: Industrial Integrity
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#45464e'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4e5e84'
  primary: '#041638'
  on-primary: '#ffffff'
  primary-container: '#1b2b4e'
  on-primary-container: '#8393bc'
  inverse-primary: '#b6c6f1'
  secondary: '#0041c9'
  on-secondary: '#ffffff'
  secondary-container: '#0356ff'
  on-secondary-container: '#e4e7ff'
  tertiary: '#271300'
  on-tertiary: '#ffffff'
  tertiary-container: '#432500'
  on-tertiary-container: '#d57f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b6c6f1'
  on-primary-fixed: '#081a3d'
  on-primary-fixed-variant: '#37466b'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b3'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86f'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-3: 12px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  unit-16: 64px
  touch-target: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for the high-stakes environment of industrial safety and enterprise resource management. The aesthetic is grounded in **Corporate Modernism** with a heavy emphasis on **Functional Utility**. It prioritizes immediate cognitive processing and reliability over decorative trends.

The personality is "The Reliable Foreman": authoritative, precise, and calm under pressure. The interface utilizes a structured layout and high-contrast color signals to ensure field workers and desk-bound safety officers can identify risks and status updates at a glance. The emotional response should be one of confidence and systemic control.

## Colors

The color palette is derived from standard industrial safety signaling. 

- **Primary Navy (#1B2B4E):** Used for structural elements, sidebars, and primary navigation to establish a foundation of stability.
- **Safety Blue (#0055FF):** Reserved for primary actions, links, and active states. It provides a modern, digital-first contrast to the darker navy.
- **Warning Orange (#FF9900):** Used exclusively for non-critical alerts, pending approvals, or items requiring attention.
- **Danger Red (#D32F2F):** Used for critical errors, safety violations, and stop actions.
- **Success Green (#2E7D32):** Used for completed inspections, safe statuses, and "Go" signals.
- **Background (#F8F9FA):** A slightly cooled neutral that reduces eye strain in varied lighting conditions.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy environments and technical clarity. 

- **Weight Usage:** Use Bold (700) for high-level headers to create a strong visual anchor. Medium (500) and Semi-Bold (600) are reserved for interactive elements and data labels.
- **Case:** Use Uppercase for `label-md` to differentiate metadata from body content.
- **Field Use:** For mobile views used by field workers, prioritize `body-lg` for all input-related text to ensure readability in sunlight or low-light conditions.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. The sidebar remains fixed (280px), while the content area uses a 12-column fluid grid.

- **Rhythm:** A 4px baseline grid ensures tight vertical rhythm. 
- **Touch Considerations:** For field-specific views, all interactive targets (buttons, list items) must adhere to a minimum height of `touch-target` (48px) to accommodate gloved hands or rapid movement.
- **Information Density:** Use `unit-4` (16px) for standard gutters, but allow `unit-2` (8px) for internal data-table spacing to maintain high visibility of dense technical specs.

## Elevation & Depth

This design system avoids excessive shadows to maintain a "flat" professional look, using **Tonal Layers** and **Low-Contrast Outlines** instead.

- **Level 0 (Background):** #F8F9FA.
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border of #E9ECEF. No shadow.
- **Level 2 (Popovers/Modals):** Pure White (#FFFFFF) with a soft, 12px blur ambient shadow (Opacity: 8%, Color: #1B2B4E) to suggest floating above the workspace.
- **Depth via Border:** Active states for inputs and cards use a 2px `secondary_color` border instead of a shadow to indicate focus.

## Shapes

The shape language is **Soft-Industrial**. 

- **Standard Radius:** 4px (`roundedness: 1`). This provides a subtle modern feel without sacrificing the serious, "constructed" nature of industrial software.
- **Large Components:** Cards and main containers use 8px (`rounded-lg`) to create a clear container hierarchy.
- **Progress Bars:** Should remain sharp (0px - 2px) to communicate precision and mathematical accuracy.

## Components

### Buttons
- **Primary:** Solid #0055FF with white text. Height: 48px for field use.
- **Secondary:** Transparent with a 1px #1B2B4E border.
- **Destructive:** Solid #D32F2F. Used for "Confirm Delete" or "Emergency Stop."

### Status Badges
- Small, rounded containers with a background opacity of 15% of the status color and 100% opacity for the text color. (e.g., Warning Badge: #FF9900 at 15% BG, #B26B00 Text).

### Input Fields
- Heavy focus on the "Active" state. When a user taps a field, the border weight increases to 2px using Safety Blue. Labels always stay visible (never use disappearing placeholders for critical data entry).

### Timeline & Progress
- **Timeline:** A vertical 2px solid line in #E9ECEF with 12px circular nodes. Completed nodes are Success Green; current nodes are Safety Blue with a pulsing ring.
- **Progress Bars:** Linear, 8px height. Background is #E9ECEF. The fill color changes based on the safety threshold (Green > 90%, Orange 70-89%, Red < 70%).

### Cards
- White background, 1px border (#E9ECEF). Header area of the card should have a subtle 4px left-accent border in the color corresponding to the item's status.