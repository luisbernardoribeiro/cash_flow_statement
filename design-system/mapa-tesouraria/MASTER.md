# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** MAPA Tesouraria
**Generated:** 2026-05-08 20:35:50
**Category:** SaaS (General)

---

## Global Rules

### Color Palette

> **Brand override:** GI ADVISE — Contabilidade Consultoria. Indigo `#2E2C7E` + Gold `#C8A951` are the locked brand identity for MAPA Tesouraria. Do NOT substitute with the skill's default navy/blue.

| Role | Hex | CSS Variable | Tailwind |
|------|-----|--------------|----------|
| Primary | `#2E2C7E` | `--color-primary` | `primary-600` |
| Primary Dark | `#1F1D5C` | `--color-primary-dark` | `primary-700` |
| Primary Light | `#F4F3FB` | `--color-primary-light` | `primary-50` |
| On Primary | `#FFFFFF` | `--color-on-primary` | `white` |
| Accent/CTA | `#C8A951` | `--color-accent` | `gold-500` |
| Accent Dark | `#A88E3F` | `--color-accent-dark` | `gold-600` |
| Background | `#FFFFFF` | `--color-background` | `white` |
| Foreground (Ink) | `#1A1A2E` | `--color-foreground` | `ink` |
| Muted | `#F4F3FB` | `--color-muted` | `primary-50` |
| Muted Foreground | `#4A4A5C` | `--color-muted-fg` | — |
| Border | `#E0DEF0` | `--color-border` | `primary-100` |
| Destructive | `#DC2626` | `--color-destructive` | `danger` |
| Success | `#059669` | `--color-success` | `success` |
| Ring | `#2E2C7E` | `--color-ring` | `primary-600` |

**Color Notes:** Trust-indigo (`#2E2C7E`) for primary structure (sidebar, headings, links). Gold (`#C8A951`) is reserved for CC seal/credentials and the testimonial accent border — never on primary CTAs. CTAs use indigo. Gold is a *credential signal*, not a button color.

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** enterprise, saas, b2b, professional, indigo, modern, approachable, legible, ios dynamic type, android scaling
- **Google Fonts:** [Plus Jakarta Sans + Plus Jakarta Sans](https://fonts.google.com/share?selection.family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
```

### Brand & Identity Rules (MAPA-specific)

- **Logo mark:** `/brand/gi-mark.svg` (G letter only). On indigo backgrounds apply `filter: brightness(0) invert(1)` to render white.
- **Full logo:** `/brand/gi-logo.svg` (G + ADVISE). Use only in marketing footer, not in app chrome.
- **CC credential badge:** Always cite "CC nº 32897" + "Auditor Interno IPAI nº 3330". Render in a gold-tinted pill (`bg-gold-500/15 text-gold-600`).
- **Trust copy:** "Mais de 40 anos de carteira" (NEVER "20 anos"). Sponsor is **Alípio Monteiro CC** of **GI ADVISE — Contabilidade Consultoria**, Viseu.
- **Currency:** Always `€`, Portuguese formatting (`pt-PT`, `1 234,56 €`), with non-breaking space before symbol on display.
- **Tone:** Calm, didactic, second-person singular ("tu"). Never sales-y. Reassure: "Não precisas de pensar — basta registar."

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — indigo (matches Tailwind .btn-primary in globals.css) */
.btn-primary {
  background: #2E2C7E;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover { background: #1F1D5C; }
.btn-primary:focus-visible {
  outline: 2px solid #2E2C7E;
  outline-offset: 2px;
}

/* Ghost / Secondary */
.btn-ghost {
  background: transparent;
  color: #2E2C7E;
  border: 1px solid #E0DEF0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-ghost:hover { background: #F4F3FB; }
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #D5D8DC;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #2E2C7E;
  outline: none;
  box-shadow: 0 0 0 3px rgba(46, 44, 126, 0.15);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Enterprise SaaS (Mobile)

**Keywords:** enterprise, saas, b2b, professional, indigo, violet, gradient, polished, trustworthy, clean, approachable, spring, haptic

**Best For:** B2B backend management, productivity tools, government and finance mobile apps, SaaS companion apps, enterprise dashboards

**Key Effects:** Indigo→Violet gradient primary CTAs + active tab highlights, colored card shadows rgba(79,70,229,0.08), pill buttons or 12pt radius, full-width CTA at screen bottom, spring press scale 0.97, floating label inputs with animated focus border, skeletal loading pulses (Indigo/Slate tint), Bottom Sheets with drag dismiss, swipe-to-action list cards, scroll-linked title collapse

### Page Pattern

**Pattern Name:** Hero + Testimonials + CTA

- **Conversion Strategy:** Social proof before CTA. Use 3-5 testimonials. Include photo + name + role. CTA after social proof.
- **CTA Placement:** Hero (sticky) + Post-testimonials
- **Section Order:** 1. Hero, 2. Problem statement, 3. Solution overview, 4. Testimonials carousel, 5. CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive animation
- ❌ Dark mode by default

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
