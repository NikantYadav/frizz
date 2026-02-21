# Frizz Marketplace - Design System

## Brand Identity

### Brand Name
**Frizz** - Where work meets trust

### Brand Essence
Frizz embodies the intersection of human collaboration and technological reliability. The design language balances warmth with precision, creating an environment where professionals feel empowered, not overwhelmed.

### Design Principles
- **Clarity over cleverness** - Every element serves a purpose
- **Confidence through simplicity** - Reduce cognitive load
- **Human-first Web3** - Technology that feels approachable
- **Intentional motion** - Animation that guides, not distracts

---

## Color System

### Primary Palette
```css
/* Indigo - Primary Brand */
--indigo-50:  #eef2ff
--indigo-100: #e0e7ff
--indigo-200: #c7d2fe
--indigo-300: #a5b4fc
--indigo-400: #818cf8
--indigo-500: #6366f1  /* Primary */
--indigo-600: #4f46e5  /* Primary Dark */
--indigo-700: #4338ca
--indigo-800: #3730a3
--indigo-900: #312e81

/* Emerald - Success & Trust */
--emerald-50:  #ecfdf5
--emerald-100: #d1fae5
--emerald-400: #34d399
--emerald-500: #10b981  /* Success */
--emerald-600: #059669
--emerald-700: #047857
```

### Accent Colors
```css
/* Amber - Attention & Energy */
--amber-50:  #fffbeb
--amber-100: #fef3c7
--amber-400: #fbbf24
--amber-500: #f59e0b  /* Warning */
--amber-600: #d97706

/* Rose - Critical & Error */
--rose-50:  #fff1f2
--rose-100: #ffe4e6
--rose-400: #fb7185
--rose-500: #f43f5e  /* Error */
--rose-600: #e11d48

/* Sky - Information */
--sky-50:  #f0f9ff
--sky-100: #e0f2fe
--sky-400: #38bdf8
--sky-500: #0ea5e9  /* Info */
--sky-600: #0284c7
```

### Neutral Palette
```css
/* Light Mode - Warm neutrals for approachability */
--slate-50:  #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-300: #cbd5e1
--slate-400: #94a3b8
--slate-500: #64748b
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a

/* Dark Mode - Deep, rich backgrounds */
--zinc-50:  #fafafa
--zinc-800: #27272a
--zinc-900: #18181b
--zinc-950: #09090b  /* Primary dark bg */
```

---

## Typography

### Font System
```css
/* Display - For headlines with impact */
--font-display: 'Cal Sans', 'Inter', system-ui, sans-serif;

/* Sans - Primary interface font */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Mono - Technical elements */
--font-mono: 'Berkeley Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale (Fluid Typography)
```css
/* Scales responsively between mobile and desktop */
--text-xs:   clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem)    /* 12-13px */
--text-sm:   clamp(0.875rem, 0.85rem + 0.2vw, 0.95rem) /* 14-15px */
--text-base: clamp(1rem, 0.95rem + 0.3vw, 1.125rem)    /* 16-18px */
--text-lg:   clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem) /* 18-20px */
--text-xl:   clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)   /* 20-24px */
--text-2xl:  clamp(1.5rem, 1.3rem + 1vw, 2rem)         /* 24-32px */
--text-3xl:  clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)   /* 30-40px */
--text-4xl:  clamp(2.25rem, 1.75rem + 2vw, 3rem)       /* 36-48px */
--text-5xl:  clamp(3rem, 2rem + 3vw, 4rem)             /* 48-64px */
```



### Font Weights & Leading
```css
/* Weights */
--font-regular:   400
--font-medium:    500
--font-semibold:  600
--font-bold:      700

/* Line Heights - Optimized for readability */
--leading-tight:   1.2   /* Headlines */
--leading-snug:    1.4   /* Subheadings */
--leading-normal:  1.6   /* Body text */
--leading-relaxed: 1.75  /* Long-form content */
```

---

## Spatial System

### Spacing Scale (8px base)
```css
--space-0:  0
--space-1:  0.25rem  /* 4px */
--space-2:  0.5rem   /* 8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.5rem   /* 24px */
--space-6:  2rem     /* 32px */
--space-8:  3rem     /* 48px */
--space-10: 4rem     /* 64px */
--space-12: 6rem     /* 96px */
--space-16: 8rem     /* 128px */
```

### Border Radius (Softer, more organic)
```css
--radius-sm:   0.25rem   /* 4px */
--radius-md:   0.5rem    /* 8px */
--radius-lg:   0.75rem   /* 12px */
--radius-xl:   1rem      /* 16px */
--radius-2xl:  1.25rem   /* 20px */
--radius-3xl:  1.75rem   /* 28px */
--radius-full: 9999px
```

---

## Elevation & Depth

### Shadow System (Layered, realistic)
```css
/* Light Mode - Soft, natural shadows */
--shadow-xs:  0 1px 2px 0 rgb(0 0 0 / 0.04)
--shadow-sm:  0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)
--shadow-md:  0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)
--shadow-lg:  0 12px 24px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.04)
--shadow-xl:  0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(0 0 0 / 0.04)

/* Dark Mode - Subtle, elevated */
--shadow-dark-sm:  0 2px 8px 0 rgb(0 0 0 / 0.4)
--shadow-dark-md:  0 4px 16px 0 rgb(0 0 0 / 0.5)
--shadow-dark-lg:  0 12px 32px 0 rgb(0 0 0 / 0.6)

/* Colored shadows for emphasis */
--shadow-indigo: 0 8px 24px -4px rgb(99 102 241 / 0.2)
--shadow-emerald: 0 8px 24px -4px rgb(16 185 129 / 0.2)
```

---

## Component Library

### Buttons

#### Primary Action
```tsx
className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
```

#### Secondary Action
```tsx
className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors duration-150"
```

#### Hero CTA (Landing pages)
```tsx
className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-indigo hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
```

#### Ghost Button
```tsx
className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150"
```

### Cards

#### Base Card
```tsx
className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors duration-200"
```

#### Elevated Card (Interactive)
```tsx
className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-zinc-800 p-6 transition-all duration-200 cursor-pointer"
```

#### Feature Highlight Card
```tsx
className="relative bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 overflow-hidden"
```

#### Accent Card
```tsx
className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6"
```

### Form Elements

#### Text Input
```tsx
className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150"
```

#### Search Input
```tsx
className="w-full pl-11 pr-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150"
```

### Badges & Pills

#### Status - Active
```tsx
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
```

#### Status - Pending
```tsx
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
```

#### Status - Completed
```tsx
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50"
```

#### Category Tag
```tsx
className="px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
```

### Navigation

#### Navbar
```tsx
className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-50"
```

#### Tab - Active
```tsx
className="relative px-4 py-2 font-medium text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 dark:after:bg-indigo-400"
```

#### Tab - Inactive
```tsx
className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-150"
```

---

## Motion & Animation

### Timing Functions
```css
/* Natural, physics-based easing */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1)
--ease-in:      cubic-bezier(0.4, 0, 1, 1)
--ease-out:     cubic-bezier(0, 0, 0.2, 1)
--ease-bounce:  cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Transition Durations
```css
--duration-fast:   150ms  /* Micro-interactions */
--duration-base:   200ms  /* Standard transitions */
--duration-slow:   300ms  /* Complex animations */
```

### Interactive States
```tsx
/* Subtle lift on hover */
hover:-translate-y-0.5 hover:shadow-md transition-all duration-200

/* Gentle scale */
hover:scale-[1.02] transition-transform duration-200

/* Smooth color shift */
transition-colors duration-150

/* Combined effect for CTAs */
hover:-translate-y-1 hover:shadow-lg transition-all duration-200
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
sm:  640px   /* Small devices */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

### Usage Pattern
```tsx
/* Mobile: full width, Tablet: 2 columns, Desktop: 4 columns */
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
```

---

## 🌓 Dark Mode Strategy

### Implementation
- Use Tailwind's `dark:` variant
- System preference detection
- Manual toggle option
- Persist user preference in localStorage

### Color Contrast
- Ensure WCAG AA compliance (4.5:1 for normal text)
- Test all color combinations in both modes
- Use semantic color names

---

## Visual Effects

### Gradient Treatments
```tsx
/* Subtle background gradient */
bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950

/* Accent gradient (buttons, CTAs) */
bg-gradient-to-r from-indigo-600 to-indigo-500

/* Text gradient (headlines) */
text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white

/* Mesh gradient (hero backgrounds) */
bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950
```

### Backdrop Effects
```tsx
/* Glassmorphism */
className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50"

/* Frosted overlay */
className="bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm"
```

---

## Text Hierarchy

### Display Text
```tsx
/* Hero Headline */
className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight"

/* Section Headline */
className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"

/* Card Headline */
className="text-xl font-semibold text-slate-900 dark:text-white"
```

### Body Copy
```tsx
/* Primary - Optimized for reading */
className="text-base text-slate-700 dark:text-slate-300 leading-relaxed"

/* Secondary - Supporting text */
className="text-sm text-slate-600 dark:text-slate-400 leading-normal"

/* Caption - Metadata */
className="text-xs text-slate-500 dark:text-slate-500 leading-snug"
```

### Interactive Text
```tsx
/* Link - Subtle underline on hover */
className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium underline-offset-2 hover:underline transition-colors duration-150"

/* Wallet Address */
className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded"

/* Numeric Value */
className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums"
```

---

## Layout System

### Container Widths
```tsx
/* Standard content */
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

/* Narrow content (reading) */
className="max-w-3xl mx-auto px-4"

/* Wide content (dashboards) */
className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
```

### Section Rhythm
```tsx
/* Standard section */
className="py-16 md:py-24"

/* Compact section */
className="py-12 md:py-16"

/* Hero section */
className="py-20 md:py-32"
```

### Grid Systems
```tsx
/* Responsive 2-column */
className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"

/* Feature grid (3-col) */
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"

/* Card grid (4-col) */
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
```

---

## Web3 Components

### Wallet Address
```tsx
<span className="inline-flex items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
  {address.slice(0, 6)}...{address.slice(-4)}
</span>
```

### Transaction States
```tsx
/* Pending */
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
  <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Confirming</span>
</div>

/* Success */
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Confirmed</span>
</div>
```

### Currency Display
```tsx
<div className="inline-flex items-center gap-1.5">
  <span className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{amount}</span>
  <span className="text-base font-medium text-slate-600 dark:text-slate-400">USDC</span>
</div>
```

---

## Iconography

### Icon System
- **Library**: Lucide React (consistent, modern)
- **Sizes**: 16px (sm), 20px (base), 24px (lg), 32px (xl)
- **Style**: Stroke-based, 2px weight
- **Color**: Inherit or semantic

### Icon Patterns
```tsx
/* Icon with label */
<div className="flex items-center gap-2">
  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
  <span className="text-sm font-medium">Secure</span>
</div>

/* Icon button */
<button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150">
  <Settings className="w-5 h-5" />
</button>

/* Feature icon (larger, colored background) */
<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50">
  <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
</div>
```

---

## Design Principles in Practice

### Clarity
- One primary action per screen
- Clear visual hierarchy (size, weight, color)
- Generous whitespace for breathing room
- Consistent patterns reduce learning curve

### Confidence
- Immediate feedback for all interactions
- Clear error messages with solutions
- Progress indicators for async operations
- Undo/cancel options where appropriate

### Accessibility
- WCAG AA minimum (4.5:1 contrast)
- 44x44px minimum touch targets
- Keyboard navigation throughout
- Screen reader tested
- Reduced motion support

### Performance
- Perceived performance through optimistic UI
- Skeleton screens over spinners
- Lazy load images and heavy components
- CSS transitions (GPU accelerated)
- Minimal layout shift

---

## Implementation Notes

### Dark Mode Strategy
- System preference detection on first visit
- Manual toggle persisted to localStorage
- All colors tested in both modes
- Avoid pure black (#000) - use zinc-950
- Reduce contrast slightly in dark mode for comfort

### Responsive Approach
- Mobile-first development
- Touch-friendly targets (min 44px)
- Readable line lengths (60-75 characters)
- Fluid typography with clamp()
- Test on real devices, not just browser resize

### Web3 UX Considerations
- Wallet state always visible
- Transaction costs shown upfront
- Network switching handled gracefully
- Error messages in plain language
- Confirmation dialogs for irreversible actions

---

**Version:** 2.0.0  
**Last Updated:** February 2026  
**Design Lead:** Human-Centered Web3 Team
