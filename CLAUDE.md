# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Content Preferences

- **Tone:** clear, simple, business-friendly
- **Audience:** small business owners
- **Focus:** SEO, performance, conversion

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build locally
```

Requires Node.js >= 22.12.0.

## Architecture

**Astro 6 + Tailwind CSS 4** corporate website for Auror Ventures (software consulting company).

### Routing

File-based routing with full i18n duplication:
- `src/pages/en/` — English routes
- `src/pages/es/` — Spanish routes

Both directories mirror the same page structure. Each page imports components directly — there is no dynamic routing or CMS.

### Components

`src/components/` contains one `.astro` file per section/service. Pages are thin wrappers that compose these components. The single layout wrapper is `src/layouts/Layout.astro`.

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no `tailwind.config.*` file — config is inline in CSS)
- Global styles and design tokens live in `src/styles/global.css`
- CSS variables: `--color-primary: #10566f`, `--color-accent: #207E82`, `--container-width: 1100px`
- Custom fonts loaded locally from `public/fonts/`: **Uni Neue** (headings) and **Roboto** (body/UI)
- Shared utility classes: `.font-heading`, `.font-ui`, `.font-body`, `.btn-primary`, `.container-custom`, `.text-muted`

### Static Assets

All images and fonts are in `public/` and served as-is. No image optimization pipeline is configured.

## Active Development Areas (TODO.md)

**Phase 1 (in progress):**
- One-paragraph software services descriptions
- Image hover effects on service cards
- Projects section

**Phase 2 (planned):**
- favicon.svg
- Text/translation refinement
- Responsive styling improvements
- Cloudflare deployment
