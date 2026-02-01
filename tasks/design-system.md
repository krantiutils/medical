# Swasthya Design System

> Bauhaus-inspired healthcare platform design system. **Form follows function** with geometric beauty.

---

## Philosophy

**NOT another generic Bootstrap/Tailwind UI.** This is **constructivist modernism**—every element is deliberately composed. The interface is a geometric composition, not just a layout.

### Core Principles

1. **Geometric Purity** - Circles, squares, triangles only
2. **Hard Shadows** - 4px/8px offset, never soft/blurred
3. **Color Blocking** - Entire sections use solid primaries
4. **Thick Borders** - 2px/4px black borders define elements
5. **Asymmetric Balance** - Grids intentionally broken
6. **Functional Honesty** - No gradients, no subtle effects

---

## Design Tokens

### Colors

```css
:root {
  /* Core */
  --background: #F0F0F0;      /* Off-white canvas */
  --foreground: #121212;       /* Stark black */

  /* Bauhaus Primaries */
  --primary-red: #D02020;
  --primary-blue: #1040C0;
  --primary-yellow: #F0C020;

  /* Neutral */
  --muted: #E0E0E0;
  --border: #121212;

  /* Semantic */
  --success: #2E7D32;
  --warning: #F0C020;
  --error: #D02020;
  --info: #1040C0;

  /* Healthcare Specific */
  --verified: #2E7D32;
  --doctor: #1040C0;
  --dentist: #D02020;
  --pharmacist: #F0C020;
}
```

### Typography

**Font**: `Outfit` (Google Fonts - geometric sans-serif)

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');

/* Scale */
--text-display: clamp(2.5rem, 8vw, 6rem);    /* Hero headlines */
--text-h1: clamp(2rem, 5vw, 4rem);           /* Section titles */
--text-h2: clamp(1.5rem, 3vw, 2.5rem);       /* Card titles */
--text-h3: clamp(1.25rem, 2vw, 1.75rem);     /* Subsections */
--text-body: clamp(1rem, 1.5vw, 1.125rem);   /* Body text */
--text-small: 0.875rem;                       /* Labels, meta */
--text-tiny: 0.75rem;                         /* Badges, tags */

/* Weights */
--font-black: 900;    /* Display headlines */
--font-bold: 700;     /* Headings, buttons */
--font-medium: 500;   /* Body text */
--font-regular: 400;  /* Secondary text */
```

**Typography Rules:**
| Element | Size | Weight | Transform | Tracking |
|---------|------|--------|-----------|----------|
| Display | text-6xl+ | 900 | uppercase | tighter |
| H1 | text-4xl | 700 | uppercase | tight |
| H2 | text-2xl | 700 | none | normal |
| H3 | text-xl | 700 | none | normal |
| Body | text-base | 500 | none | normal |
| Label | text-sm | 700 | uppercase | widest |
| Meta | text-sm | 400 | none | normal |

### Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### Border & Radius

```css
/* Radius - Binary only */
--radius-none: 0;
--radius-full: 9999px;

/* Border */
--border-thin: 2px;
--border-thick: 4px;
--border-color: #121212;
```

**Rule**: NO intermediate border-radius. Either `rounded-none` (squares) or `rounded-full` (circles/pills).

### Shadows

```css
/* Hard offset shadows - NEVER blurred */
--shadow-sm: 3px 3px 0 0 #121212;
--shadow-md: 4px 4px 0 0 #121212;
--shadow-lg: 6px 6px 0 0 #121212;
--shadow-xl: 8px 8px 0 0 #121212;

/* Colored shadows for accents */
--shadow-red: 4px 4px 0 0 #D02020;
--shadow-blue: 4px 4px 0 0 #1040C0;
--shadow-yellow: 4px 4px 0 0 #F0C020;
```

---

## Component Patterns

### Buttons

```tsx
// Primary (Red) - Main CTAs
<button className="
  bg-[#D02020] text-white
  border-2 border-black
  shadow-[4px_4px_0_0_black]
  px-6 py-3
  font-bold uppercase tracking-wider
  hover:bg-[#D02020]/90
  active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
  transition-all duration-200
">
  Book Appointment
</button>

// Secondary (Blue) - Secondary actions
<button className="
  bg-[#1040C0] text-white
  border-2 border-black
  shadow-[4px_4px_0_0_black]
  ...
">
  View Profile
</button>

// Outline - Tertiary actions
<button className="
  bg-white text-black
  border-2 border-black
  shadow-[4px_4px_0_0_black]
  hover:bg-gray-100
  ...
">
  Learn More
</button>

// Ghost - Minimal actions
<button className="
  bg-transparent text-black
  border-none
  hover:bg-gray-200
  px-4 py-2
  font-medium
">
  Cancel
</button>
```

**Button Hierarchy (Solving User's Concern):**
- **Primary (Red)**: Main action - "Book Now", "Submit", "Verify"
- **Secondary (Blue)**: Important but secondary - "View Profile", "Save"
- **Outline (White)**: Clearly clickable tertiary - "Learn More", "Share"
- **Ghost**: Minimal actions - "Cancel", "Skip"

### Cards

```tsx
// Doctor/Professional Card
<div className="
  bg-white
  border-4 border-black
  shadow-[8px_8px_0_0_black]
  hover:-translate-y-1
  transition-transform duration-200
  relative
  overflow-hidden
">
  {/* Geometric decorator - top right */}
  <div className="absolute top-0 right-0 w-4 h-4 bg-[#1040C0]" />

  {/* Image */}
  <div className="aspect-[4/3] bg-gray-200 border-b-4 border-black">
    <img className="grayscale hover:grayscale-0 transition-all" />
  </div>

  {/* Content with clear hierarchy */}
  <div className="p-6 space-y-4">
    {/* Category label */}
    <span className="
      text-xs font-bold uppercase tracking-widest
      text-[#1040C0]
    ">
      Cardiologist
    </span>

    {/* Name - most important */}
    <h3 className="text-2xl font-bold">Dr. Ram Sharma</h3>

    {/* Divider */}
    <div className="border-t-2 border-black/20" />

    {/* Meta info - less important */}
    <div className="space-y-2 text-sm text-gray-600">
      <p>NMC #12345</p>
      <p>MBBS, MD Cardiology</p>
    </div>

    {/* Verification badge */}
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
      <span className="text-sm font-medium text-[#2E7D32]">NMC Verified</span>
    </div>
  </div>
</div>
```

### Typography Hierarchy (Solving User's Concern)

```tsx
// Page Title
<h1 className="
  text-4xl md:text-6xl lg:text-8xl
  font-black uppercase tracking-tighter
  leading-[0.9]
">
  Find Your Doctor
</h1>

// Section Title
<h2 className="
  text-2xl md:text-4xl
  font-bold uppercase tracking-tight
">
  Top Cardiologists
</h2>

// Card Title - clearly different from body
<h3 className="
  text-xl md:text-2xl
  font-bold
  text-black
">
  Dr. Ram Sharma
</h3>

// Body Text
<p className="
  text-base
  font-medium
  text-gray-700
  leading-relaxed
">
  Experienced cardiologist with 15 years of practice...
</p>

// Meta/Label - visually distinct
<span className="
  text-xs
  font-bold
  uppercase
  tracking-widest
  text-[#1040C0]
">
  Specialist
</span>

// Secondary Info
<span className="
  text-sm
  font-regular
  text-gray-500
">
  NMC #12345
</span>
```

### Icons with Context (Solving Color Concern)

```tsx
// Icons should NOT be same color as text
// Use primary colors or contained in shapes

// Good - Icon in colored container
<div className="flex items-center gap-3">
  <div className="
    w-10 h-10
    bg-[#1040C0]
    rounded-full
    flex items-center justify-center
  ">
    <MapPin className="w-5 h-5 text-white" />
  </div>
  <span className="text-gray-700">Kathmandu, Nepal</span>
</div>

// Good - Icon with accent color
<div className="flex items-center gap-2">
  <Phone className="w-5 h-5 text-[#D02020]" />
  <span className="text-gray-700">+977 1234567890</span>
</div>

// Bad - Icon same color as text
<div className="flex items-center gap-2">
  <Phone className="w-5 h-5 text-gray-700" />  {/* DON'T */}
  <span className="text-gray-700">+977 1234567890</span>
</div>
```

### Dividers & White Space (Solving Cognitive Load)

```tsx
// Section divider
<div className="border-b-4 border-black my-12" />

// Content divider (lighter)
<div className="border-t-2 border-black/20 my-6" />

// Card content sections
<div className="divide-y-2 divide-black/10">
  <div className="py-4">Section 1</div>
  <div className="py-4">Section 2</div>
</div>

// Show More expander
<div className="relative">
  <p className={`
    ${expanded ? '' : 'line-clamp-3'}
    transition-all
  `}>
    Long description text...
  </p>
  {!expanded && (
    <button
      onClick={() => setExpanded(true)}
      className="
        text-[#1040C0] font-bold text-sm
        mt-2 hover:underline
      "
    >
      Show More ↓
    </button>
  )}
</div>
```

### Contrast & Accessibility

```tsx
// Price/Badge on image - use solid background
<div className="relative">
  <img src="..." className="w-full" />

  {/* Good - solid background with contrast */}
  <div className="
    absolute bottom-4 left-4
    bg-[#F0C020]
    border-2 border-black
    px-4 py-2
    font-bold text-black
  ">
    Rs. 500
  </div>

  {/* Bad - semi-transparent */}
  <div className="absolute bottom-4 left-4 bg-black/50 text-white">
    Rs. 500  {/* DON'T - contrast issues */}
  </div>
</div>

// Verification badge - high contrast
<div className="
  inline-flex items-center gap-2
  bg-[#2E7D32]
  text-white
  px-3 py-1
  text-sm font-bold
  border-2 border-black
">
  <Check className="w-4 h-4" />
  Verified
</div>
```

---

## Page Layouts

### Professional Profile Page

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (White, border-b-4)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┬───────────────────────────────────────┐  │
│  │              │                                        │  │
│  │    PHOTO     │   DR. RAM SHARMA                      │  │
│  │   (Square,   │   ─────────────────                   │  │
│  │   border-4)  │   Cardiologist • NMC #12345           │  │
│  │              │   [VERIFIED BADGE]                    │  │
│  │              │                                        │  │
│  │              │   [Book Appointment] [Save]           │  │
│  └──────────────┴───────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ TABS: Overview | Reviews | Clinics (border-b-4)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ABOUT (Card)                                        │   │
│  │ ───────────                                         │   │
│  │ Biography text with Show More...                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ QUALIFICATIONS (Card)                               │   │
│  │ ────────────────                                    │   │
│  │ • MBBS - TU, 2005                                   │   │
│  │ • MD Cardiology - BPKIHS, 2010                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CLINIC AFFILIATIONS (Card, Yellow accent)           │   │
│  │ ─────────────────────                               │   │
│  │ [Clinic Card] [Clinic Card]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FOOTER (Black bg)                                           │
└─────────────────────────────────────────────────────────────┘
```

### Search Results Page

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FIND YOUR DOCTOR (Display text)                           │
│  ════════════════                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Search Input ─────────────────────] [🔍 Search]    │   │
│  │                                                      │   │
│  │ Filters: [Specialty ▼] [Location ▼] [Verified ▼]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 1,234 doctors found                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Card 1  │  │ Card 2  │  │ Card 3  │  │ Card 4  │       │
│  │         │  │         │  │         │  │         │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Card 5  │  │ Card 6  │  │ Card 7  │  │ Card 8  │       │
│  │         │  │         │  │         │  │         │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│  [ ← Previous ]  1  2  3  ...  99  [ Next → ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Section Color Blocking

| Section | Background | Text | Accent |
|---------|------------|------|--------|
| Header/Nav | White | Black | - |
| Hero | Off-white + Blue panel | Black/White | Yellow |
| Stats | Yellow | Black | Black shapes |
| Features | Off-white | Black | Blue icons |
| Testimonials | White | Black | Red quotes |
| CTA Banner | Red | White | Yellow button |
| FAQ | Off-white | Black | Red open state |
| Footer | Black | White | Blue/Yellow links |

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Grid cols | 1 | 2 | 3-4 |
| Border width | 2px | 2px | 4px |
| Shadow offset | 3-4px | 4-6px | 6-8px |
| Section padding | py-12 px-4 | py-16 px-6 | py-24 px-8 |
| Display text | text-4xl | text-6xl | text-8xl |

---

## Animation

**Mechanical, snappy, geometric** - no soft organic movement.

```css
/* Base transition */
transition: all 0.2s ease-out;

/* Button press */
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* Card hover */
.card:hover {
  transform: translateY(-4px);
}

/* Accordion */
.accordion-icon {
  transition: transform 0.2s ease-out;
}
.accordion-open .accordion-icon {
  transform: rotate(180deg);
}
```

---

## Accessibility Checklist

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus states visible (2px offset ring)
- [ ] Touch targets ≥ 44px
- [ ] Alt text on all images
- [ ] ARIA labels on icons
- [ ] Keyboard navigable
- [ ] Reduced motion support
- [ ] Screen reader friendly

---

## Anti-Patterns (What NOT to Do)

❌ Soft shadows (`shadow-lg`, `shadow-xl` with blur)
❌ Rounded corners except `rounded-full`
❌ Gradients
❌ Same color for icons and text
❌ Generic gray backgrounds
❌ Thin 1px borders
❌ Generic sans-serif fonts
❌ Uniform text sizes (no hierarchy)
❌ Missing dividers between sections
❌ Low contrast badges on images
❌ Subtle hover effects
