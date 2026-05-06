# ForgeTrack — Design System

**Purpose:** This document defines the visual language for ForgeTrack. Antigravity must apply these tokens and patterns consistently across every screen. No deviations unless explicitly requested.

**Reference aesthetic:** Dark, cosmic, data-dense fintech dashboard. Think "deep space meets terminal." Heavy contrast between oversized display typography and micro-labels. Glass-surface cards floating on a near-black canvas with a subtle radial glow. Minimal chrome. Status communicated through restrained color pills, not heavy fills.

---

## 1. Visual Direction

| Principle | Meaning |
|---|---|
| **Dark-first, always** | No light mode. Canvas is near-black. White-on-dark throughout. |
| **Oversized display, tiny labels** | Hero numbers and headings are huge (56–80px). Labels/captions are tiny (11–12px, often uppercase tracked). |
| **Glass surfaces, not solid cards** | Cards are subtly lighter than canvas with a thin 1px border at ~10% white opacity. Slight top-to-bottom gradient inside the card. |
| **Color is restraint, not decoration** | Green = positive/present. Red/pink = negative/absent. Everything else is grayscale. No gratuitous brand colors. |
| **One radial glow per page** | Top-center radial gradient (indigo/violet) above the main content sets the cosmic mood. Never repeat it. |
| **Borders are whispers** | Dividers and borders are 1px at 6–10% white opacity. No hard lines. |
| **Breathing room over density** | Generous padding inside cards (24–32px). Generous gaps between sections (32–48px). |

---

## 2. Color Tokens

Use these as CSS custom properties. No hardcoded hex values in components.

```css
:root {
  /* Canvas & Surfaces */
  --bg-void:            #07070B;   /* Outermost page background */
  --bg-canvas:          #0B0B11;   /* Main app background */
  --bg-surface:         #111118;   /* Default card background */
  --bg-surface-raised:  #16161F;   /* Hover state, active nav item, modals */
  --bg-surface-inset:   #0E0E14;   /* Input fields, inset wells */

  /* Borders */
  --border-subtle:      rgba(255, 255, 255, 0.06);   /* Default card borders */
  --border-default:     rgba(255, 255, 255, 0.10);   /* Stronger dividers */
  --border-strong:      rgba(255, 255, 255, 0.16);   /* Focus rings, active states */

  /* Text */
  --text-primary:       #F5F5F7;   /* Headings, main content */
  --text-secondary:     #8A8A94;   /* Labels, secondary info */
  --text-tertiary:      #52525B;   /* Placeholder, disabled, captions */
  --text-inverse:       #0B0B11;   /* For buttons on light bg (rare) */

  /* Accent — the cosmic glow */
  --accent-glow:        #6366F1;   /* Indigo — used for top radial gradient and focus */
  --accent-glow-soft:   rgba(99, 102, 241, 0.15);

  /* Semantic — Present / Success */
  --success-fg:         #10B981;
  --success-bg:         rgba(16, 185, 129, 0.12);
  --success-border:     rgba(16, 185, 129, 0.25);

  /* Semantic — Absent / Danger */
  --danger-fg:          #F43F5E;
  --danger-bg:          rgba(244, 63, 94, 0.12);
  --danger-border:      rgba(244, 63, 94, 0.25);

  /* Semantic — Warning */
  --warning-fg:         #F59E0B;
  --warning-bg:         rgba(245, 158, 11, 0.12);
  --warning-border:     rgba(245, 158, 11, 0.25);

  /* Semantic — Info / Neutral highlight */
  --info-fg:            #3B82F6;
  --info-bg:            rgba(59, 130, 246, 0.12);
  --info-border:        rgba(59, 130, 246, 0.25);
}
```

**Usage rules:**
- Page `<body>` → `--bg-void`
- Main app shell → `--bg-canvas`
- Cards → `--bg-surface` with 1px `--border-subtle`
- Card on hover or active state → `--bg-surface-raised`
- Inputs/textareas → `--bg-surface-inset` with `--border-default`
- Never layer more than 3 shades of dark in one view.

---

## 3. Typography

**Font families:**
```css
--font-display: 'Satoshi', 'Inter', system-ui, sans-serif;   /* Headings, hero numbers */
--font-body:    'Inter', system-ui, sans-serif;              /* Everything else */
--font-mono:    'JetBrains Mono', 'SF Mono', monospace;      /* USNs, tabular numbers, code */
```

Load Satoshi from Fontshare (free): `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`

**Type scale:**

| Token | Size | Line Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| `text-display-hero` | 72px / 4.5rem | 1.0 | 700 | -0.03em | Page-level hero ("Welcome Back, Nischay") |
| `text-display-lg` | 56px / 3.5rem | 1.05 | 700 | -0.025em | Section heroes ("Live Crypto Updates" equivalent) |
| `text-display-md` | 40px / 2.5rem | 1.1 | 700 | -0.02em | Hero numbers (attendance %, counts) |
| `text-display-sm` | 32px / 2rem | 1.15 | 600 | -0.015em | Card main values |
| `text-h1` | 28px / 1.75rem | 1.2 | 600 | -0.01em | Page titles |
| `text-h2` | 22px / 1.375rem | 1.3 | 600 | -0.005em | Section titles |
| `text-h3` | 18px / 1.125rem | 1.4 | 600 | 0 | Card titles |
| `text-body-lg` | 16px / 1rem | 1.5 | 400 | 0 | Primary body copy |
| `text-body` | 14px / 0.875rem | 1.5 | 400 | 0 | Default body |
| `text-body-sm` | 13px / 0.8125rem | 1.45 | 400 | 0 | Secondary body |
| `text-caption` | 12px / 0.75rem | 1.4 | 500 | 0.01em | Captions, meta |
| `text-label` | 11px / 0.6875rem | 1.3 | 500 | 0.08em, UPPERCASE | Tiny section labels ("Overview", "Account") |
| `text-micro` | 10px / 0.625rem | 1.2 | 600 | 0.06em, UPPERCASE | Badges, ticker tags |

**Rules:**
- Hero numbers always use `font-display` with `tabular-nums` font-feature for clean digit alignment.
- USNs and date strings always use `font-mono`.
- Uppercase labels always get letter-spacing (tracking). Never uppercase body text.
- Never use font-weight 400 on `text-display-*` — it looks anemic on dark.

---

## 4. Spacing Scale

4px base. Use only these values. No custom spacing.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

**Common applications:**
- Card padding: `--space-6` (24px) on mobile, `--space-8` (32px) on desktop
- Gap between cards: `--space-6`
- Gap between page sections: `--space-12`
- Icon-to-label gap inside nav item: `--space-3`
- Button internal padding: `--space-3` vertical, `--space-5` horizontal

---

## 5. Border Radius

```
--radius-sm:    6px      /* Badges, small pills */
--radius-md:    10px     /* Buttons, inputs */
--radius-lg:    14px     /* Nav items, small cards */
--radius-xl:    18px     /* Default cards */
--radius-2xl:   24px     /* Hero cards */
--radius-full:  9999px   /* Status pills, avatars */
```

**Rules:**
- Default card = `--radius-xl` (18px)
- Buttons and inputs = `--radius-md` (10px)
- Status pills always fully rounded
- Never mix more than 2 radii in one component

---

## 6. Shadows, Glows & Effects

Shadows are subtle on dark UI. We primarily use **glows** (colored blur) and **inner highlights** instead of drop shadows.

```css
/* Card lift — barely perceptible */
--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-subtle);

/* Raised card (modals, active states) */
--shadow-raised: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-default);

/* Focus ring */
--shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.25);

/* The page-level cosmic glow (apply once, at top-center of main content) */
--glow-cosmic: radial-gradient(
  ellipse 600px 300px at 50% -100px,
  rgba(99, 102, 241, 0.18),
  rgba(99, 102, 241, 0) 70%
);

/* Card inner highlight — creates the glass look */
--card-gradient: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.02) 0%,
  rgba(255, 255, 255, 0) 50%
);
```

**Cards get three stacked layers:**
1. Base: `background: var(--bg-surface)`
2. Gradient overlay: `background-image: var(--card-gradient)`
3. Border: `box-shadow: var(--shadow-card)` (which includes the inset border)

**Background dot grid (subtle, optional, main canvas only):**
```css
background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
background-size: 24px 24px;
```

---

## 7. Layout System

**Breakpoints:**
- Mobile: 375px–767px
- Tablet: 768px–1023px
- Desktop: 1024px+

**Sidebar:**
- Width on desktop: 260px
- Collapses to icon-only (72px) on tablet
- Becomes a bottom nav or drawer on mobile

**Main content area:**
- Max width: 1440px, centered
- Horizontal padding: 24px (mobile), 32px (tablet), 48px (desktop)
- Top padding: 32px minimum to let the cosmic glow breathe

**Grid:**
- 12-column on desktop, 24px gutter
- Stat cards: typically 4-up on desktop, 2-up on tablet, 1-up on mobile
- Dashboard cards: 2-up hero + 4-up stats below

---

## 8. Component Specifications

### 8.1 Sidebar Navigation

**Structure:**
```
[Logo + App name]  [Collapse chevron]
─────────────────────────────────────
[Welcome block: "Welcome Back, {name}" + last login]
─────────────────────────────────────
LABEL: Overview
  ▸ Dashboard (active)
LABEL: Activity
  ▸ Mark Attendance
  ▸ Student History
  ▸ Materials
LABEL: Data
  ▸ Upload CSV
LABEL: Account
  ▸ Settings
  ▸ Logout
```

**Visual rules:**
- Background: `--bg-canvas` (same as main — no darker sidebar)
- Right edge: 1px `--border-subtle` divider
- Section labels: `text-label` style, `--text-tertiary` color, `--space-6` bottom margin
- Nav items: 44px height, `--space-4` horizontal padding, `--radius-lg`
- Icon size: 20px, stroke width 1.75px, color `--text-secondary`
- Label font: `text-body`, color `--text-secondary`
- **Active state:** background `--bg-surface-raised`, icon + label color `--text-primary`, 1px inset left border in `--accent-glow` (2px wide, full height of item)
- Hover state: background `--bg-surface` (no transform, no shadow)
- Badges next to nav items (e.g., "Beta", "2"): `text-micro`, `--radius-full`, bg `--bg-surface-raised`, text `--text-secondary`

### 8.2 Cards

**Default card:**
```css
.card {
  background: var(--bg-surface);
  background-image: var(--card-gradient);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: var(--space-8);
}
```

**Hero card (the big ones — today's session, hero metric):**
- `--radius-2xl` (24px)
- Padding: `--space-10` (40px)
- Often contains a sparkline/mini-chart at the bottom

**Card header pattern:**
```
[Small label: "LIVE UPDATES" or "TODAY'S SESSION"] [optional icon]
[Large title: "Market Overview" style]
```
- Label uses `text-label`, color `--text-tertiary`, margin-bottom `--space-2`
- Title uses `text-h2` or `text-display-sm` depending on card importance

**Card with metric:**
```
[Icon circle]  [Label "BTC/USDT"]          [⋮ menu]
               [Name  "Bitcoin"]

               [Tiny caption "Price"]
               [HUGE NUMBER "$109,687.6"]

               [Trend pill "+ 1.09%"]

               [Sparkline chart — full width, 60px tall]
```

### 8.3 Buttons

**Primary button:**
```css
.btn-primary {
  background: var(--text-primary);   /* white bg on dark */
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font: 500 14px var(--font-body);
  letter-spacing: -0.005em;
}
.btn-primary:hover { background: #E5E5E7; }
```

**Secondary button (ghost on dark):**
```css
.btn-secondary {
  background: var(--bg-surface-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 20px;
}
```

**Destructive button:** same shape as secondary but `color: var(--danger-fg)` and border `var(--danger-border)`.

**Icon button:** 40×40 square, `--radius-md`, background `--bg-surface-raised`, icon `--text-secondary`.

**Sizes:**
- Small: 32px height, 12px horizontal padding, 13px text
- Default: 40px height, 20px horizontal padding, 14px text
- Large: 48px height, 24px horizontal padding, 16px text

### 8.4 Inputs & Forms

```css
.input {
  background: var(--bg-surface-inset);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font: 400 14px var(--font-body);
  height: 44px;
}
.input:focus {
  border-color: var(--accent-glow);
  box-shadow: var(--shadow-focus);
  outline: none;
}
.input::placeholder { color: var(--text-tertiary); }
```

**Label above input:** `text-label`, color `--text-secondary`, margin-bottom `--space-2`.

**Helper text below:** `text-caption`, color `--text-tertiary`.

**Error state:** border `--danger-border`, helper text `--danger-fg`.

### 8.5 Badges & Status Pills

**Status pill (used for +/- percentages, attendance status):**
```html
<span class="pill pill-success">
  <Icon /> + 1.09%
</span>
```
```css
.pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font: 600 12px var(--font-body);
  font-variant-numeric: tabular-nums;
}
.pill-success {
  background: var(--success-bg);
  color: var(--success-fg);
  border: 1px solid var(--success-border);
}
.pill-danger {
  background: var(--danger-bg);
  color: var(--danger-fg);
  border: 1px solid var(--danger-border);
}
```

**Tag (metadata, "Beta", "Must Have"):** smaller, less saturated — `text-micro`, `--bg-surface-raised` bg, `--text-secondary` color.

### 8.6 Tables

Tables are **minimal borders, heavy whitespace**.

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.table thead th {
  text-align: left;
  padding: 16px 20px;
  font: 500 12px var(--font-body);
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}
.table tbody td {
  padding: 18px 20px;
  font: 400 14px var(--font-body);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}
.table tbody tr:hover { background: var(--bg-surface-raised); }
```

**Sortable column headers:** include a tiny chevron icon (⇅) `--text-tertiary`, 12px, after the label.

**First column (index or icon):** `--text-tertiary`, smaller font, reduced padding-right.

**Status column values:** always a status pill, never raw text.

### 8.7 Stat Strips (Ticker-Style)

The horizontal strip showing quick stats (reference: the "BTC/USDT 104,347.43 | SOL/USDT $176.34" strip).

**Structure:**
```
[Icon] [LABEL]   [BIG NUMBER]    |    [Icon] [LABEL] [BIG NUMBER]   |   ...
```
- Items separated by 1px vertical dividers (`--border-subtle`)
- Each item gap: `--space-3` between icon/label/number
- Label: `text-caption`, color `--text-tertiary`
- Number: `text-body-lg`, weight 600, color `--text-primary`, `tabular-nums`
- Horizontally scrollable on mobile (no wrap)

For ForgeTrack, use this for: total sessions | overall attendance % | active students | last session date.

### 8.8 Attendance Status Indicators

Beyond pills, status is often shown as a **colored dot**:
- Present: 8px circle, `--success-fg`, optional 16px glow halo
- Absent: 8px circle, `--danger-fg`
- No record: 8px circle, `--text-tertiary` at 40% opacity

**Calendar/grid view (attendance heatmap):**
- Each day = 32×32px rounded square (`--radius-md`)
- Present: `--success-bg` fill, `--success-border` border
- Absent: `--danger-bg` fill, `--danger-border` border
- No session: `--bg-surface-inset` fill, no border
- Today: additional 2px `--accent-glow` inset ring

### 8.9 Sparklines & Charts

- Line width: 1.5px
- Stroke color: `--text-primary` at 80% opacity, or `--success-fg`/`--danger-fg` for trending charts
- Area fill under line: linear gradient from stroke color at 20% opacity to transparent
- No axis labels, no gridlines on sparklines
- Data point markers: 3px circles, only on hover or at end point

For full charts (e.g., attendance over time): thin gridlines at `--border-subtle`, axis labels `text-caption` in `--text-tertiary`.

### 8.10 Modal / Dialog

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(7, 7, 11, 0.7);
  backdrop-filter: blur(8px);
}
.modal {
  background: var(--bg-surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-raised);
  padding: var(--space-10);
  max-width: 560px;
  width: calc(100% - 32px);
}
```

**Confirmation dialogs** (required for destructive actions per spec):
- Title: `text-h2`
- Body: `text-body-lg` in `--text-secondary`
- Actions: destructive button right-aligned, "Cancel" secondary button to its left, `--space-3` gap

### 8.11 Toast Notifications

Top-right corner, stacked vertically.
- Width: 360px, padding `--space-4` `--space-5`
- Background: `--bg-surface-raised`, border `--border-default`, `--radius-lg`
- Leading icon (20px): green check for success, red X for error
- Title: `text-body`, weight 600
- Body: `text-body-sm`, `--text-secondary`
- Auto-dismiss after 4s. Dismissable via X button (icon button style).

---

## 9. Iconography

- **Library:** Lucide React (already in spec tech stack)
- **Default size:** 20px (24px for section headers, 16px for inline with text)
- **Stroke width:** 1.75px uniformly
- **Color:** `--text-secondary` by default; `--text-primary` on active/hover; semantic colors for status
- Never use filled icons. Outlined only.

**Icon mapping for ForgeTrack nav:**
- Dashboard → `LayoutDashboard`
- Mark Attendance → `CheckSquare`
- Student History → `Users` or `History`
- Materials → `BookOpen`
- Upload CSV → `Upload`
- My Attendance (student) → `UserCheck`
- Upcoming → `Calendar`
- Settings → `Settings`
- Logout → `LogOut`

---

## 10. Tailwind Config Snippet

Antigravity should extend the default Tailwind theme with this config so the tokens are directly usable as utility classes.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        void: '#07070B',
        canvas: '#0B0B11',
        surface: {
          DEFAULT: '#111118',
          raised: '#16161F',
          inset: '#0E0E14',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        fg: {
          primary: '#F5F5F7',
          secondary: '#8A8A94',
          tertiary: '#52525B',
        },
        accent: {
          glow: '#6366F1',
        },
        success: { DEFAULT: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
        danger:  { DEFAULT: '#F43F5E', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['4.5rem', { lineHeight: '1.0',  letterSpacing: '-0.03em',  fontWeight: '700' }],
        'display-lg':   ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md':   ['2.5rem', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-sm':   ['2rem',   { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'label':        ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        'micro':        ['0.625rem',  { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        'xl':  '1.125rem',   // 18px
        '2xl': '1.5rem',     // 24px
      },
      backgroundImage: {
        'cosmic-glow': 'radial-gradient(ellipse 600px 300px at 50% -100px, rgba(99,102,241,0.18), rgba(99,102,241,0) 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 50%)',
        'dot-grid': 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
};
```

---

## 11. Screen-Specific Application

Apply the system to each screen as follows. Each description assumes the common layout: sidebar on left, main content area with cosmic glow at top-center.

### 11.1 Login Screen

- No sidebar. Full-screen centered form.
- Background: `bg-void` + cosmic glow
- Card: `bg-surface`, `rounded-2xl`, max-width 440px, padding 48px
- Logo at top (32px), app name below in `text-h2`
- Tab toggle: "Mentor Login" / "Student Login" — pill-style tabs, active tab has `bg-surface-raised` background
- Inputs as specified in 8.4
- "Sign In" primary button, full width
- Error message area above button, `text-caption` color `--danger-fg`

### 11.2 Dashboard (Mentor)

- **Hero row:** "Welcome Back, {mentor_name}" in `text-display-hero`, "Last login: {date}" below in `text-body-sm` `--text-secondary`
- **Stat strip (ticker-style):** Total Sessions | Overall Attendance % | Active Students | Last Session
- **Cards row 1 (2-up):**
  - Today's Session (hero card) — date + topic + type + duration, with a "Mark Attendance" primary button
  - Today's Attendance (hero card) — big present/total number, progress bar, list of absent students
- **Cards row 2 (2-up):**
  - Program Overview — total sessions, avg attendance, highest/lowest student
  - Recent Activity — last 5 actions list
- All cards use default card styling. Primary metrics use `text-display-md` with `tabular-nums`.

### 11.3 Mark Attendance Screen

- Page title: `text-h1` "Mark Attendance"
- Date picker at top (input style), session info card appears below when date is selected
- Student list: single card containing a scrollable list. Each row = 56px height, 1px `border-subtle` divider between rows
- Row: `[checkbox]` + `[name in text-body-lg]` + `[USN in text-caption mono color tertiary]` + `[branch pill on right]`
- "Select All Present" / "Select All Absent" → secondary buttons, top-right of the card
- Sticky action bar at bottom: "Mark 22 present, 3 absent" summary + "Save" primary button

### 11.4 Student History Screen

- Student selector (search-combobox style) at top, full width
- Once selected: 2-up layout
  - Left card: Student profile — name (text-display-sm), USN, branch, batch. Below: big attendance % (text-display-md), colored by threshold
  - Right card: Attendance heatmap grid (see 8.8)
- Below: full-width table of sessions attended/missed

### 11.5 CSV Upload Screen

- Step indicator at top: 4 numbered circles with connecting lines. Active step: `accent-glow` circle background + white number. Completed: `success-bg` circle + check icon. Pending: `bg-surface-raised` + tertiary number.
- **Step 1 (Upload):** Large drag-drop zone — 200px min height, dashed 1px `border-default`, `rounded-2xl`. Hover state: border `accent-glow`, bg `accent-glow-soft`. Icon + "Drop your CSV here or click to browse" + size/format hint below.
- **Step 2 (Map Columns):** 2-column layout. Left: source columns with sample data in a table. Right: dropdown per column with mapped target field. IGNORE option always present.
- **Step 3 (Validate):** Full table with color-coded rows. Green row = `success-bg` tinted left border (3px). Yellow = `warning-bg`. Red = `danger-bg`. Summary bar at top in a card: "X ready, Y warnings, Z errors" with colored numbers.
- **Step 4 (Import):** Progress bar (`accent-glow` fill on `bg-surface-inset` track), then success card with count summary.

### 11.6 Materials Library

- Filter bar: month dropdown + search input + "Add Material" primary button (mentor only), right-aligned
- Material cards in a 3-column grid (2-col tablet, 1-col mobile)
- Each card: date (text-caption tertiary), topic (text-h3), then a list of material links with type icons
- Links are inline icon-buttons that open in new tab

### 11.7 Student Portal — My Attendance

- Header: student name in `text-display-lg`, USN + branch + batch in `text-body-sm` tertiary below
- **Giant attendance % card** (full width hero): `text-display-hero`-sized percentage, color-coded. Below: "X of Y sessions attended" in `text-body-lg` secondary
- Heatmap calendar (as in 8.8), month-switchable
- Session table below with date, topic, status pill, duration

### 11.8 Student Portal — Upcoming

- "Next session" card (hero): date in big display, topic, type, time, any mentor notes
- Below: 2-up grid — "Upcoming" list (5 items) | "Past" list (3 items)
- Empty state: illustration + "No upcoming sessions scheduled yet" in text-body-lg secondary

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use `tabular-nums` on all numeric displays | Let numbers jitter by using proportional figures |
| Layer max 3 dark shades in one view | Create 5+ grays that look identical but aren't |
| Apply cosmic glow once at top of main content | Repeat the glow in multiple places on one screen |
| Use status pills for attendance/percentages | Use raw colored text for status |
| Keep borders at 6–16% white opacity | Use solid `#333` borders that read as lines |
| Pair huge display type with tiny labels | Use 20–28px everywhere — it reads as flat |
| Let cards breathe with 24–32px padding | Cram content edge-to-edge |
| Use Satoshi for display, Inter for body | Introduce a third font family |
| Keep icons outlined, 1.75px stroke | Mix outlined and filled icons |
| Use `accent-glow` only for focus rings, active states, and the page glow | Paint buttons or large areas indigo — it breaks the monochrome |

---

## 13. Implementation Checklist for Antigravity

Before shipping any screen, verify:

- [ ] Page background is `bg-void` or `bg-canvas`, not pure black
- [ ] Cosmic radial glow applied once at top-center of main content
- [ ] All cards use `bg-surface` + `card-gradient` overlay + `shadow-card`
- [ ] All numeric values use `font-variant-numeric: tabular-nums`
- [ ] USNs rendered in `font-mono`
- [ ] All status (attendance, percentages, upload row state) uses pills, not raw colored text
- [ ] Display-size hero numbers (`text-display-md` or larger) appear on every primary screen
- [ ] Sidebar active item has the 2px left accent-glow border
- [ ] Icons are Lucide, outlined, 20px, 1.75 stroke
- [ ] Every destructive action has a confirmation modal
- [ ] Mobile viewport (375px) renders without horizontal scroll
- [ ] Focus states use `accent-glow` 3px ring (keyboard accessibility)
- [ ] No `color: #fff`, no `background: #000` hardcoded — only tokens

---

**End of design system.** Reference this doc in every Antigravity prompt that builds or modifies UI for ForgeTrack.
