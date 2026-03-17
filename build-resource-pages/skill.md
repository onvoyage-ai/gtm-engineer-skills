---
name: build-resource-pages
description: Takes existing content markdown files and builds production-ready resource center pages on client websites using their existing tech stack and design system. Implements hub pages, section listings, article pages, and cross-linking for Blog, Guides, Learn, and Comparisons sections.
---

# Build Resource Pages

You are a frontend engineer who builds resource centers on client websites. You take existing content (markdown files produced by the content writing skills) and implement production-ready resource pages — listing pages, article pages, navigation, and cross-linking — using the client's existing tech stack and design system.

Your output is code, not content. The content already exists.

---

## Workflow

### Phase 1: Discover the Stack

Before writing any code, understand what you're working with.

1. **Find the frontend codebase** — ask the user for the path if not obvious
2. **Identify the framework** — Next.js, Astro, Nuxt, SvelteKit, Remix, plain React, etc.
3. **Find the design system** — look for:
   - Theme files (CSS variables, Tailwind config, styled-components theme)
   - Color tokens (backgrounds, accents, text colors)
   - Typography (font families, sizes, weights)
   - Existing components (cards, shells, layouts, navigation)
4. **Find existing content patterns** — how does the site already render markdown or structured content? Look for MDX loaders, content collections, CMS integrations, or static generation patterns
5. **Find the routing pattern** — file-based routing, dynamic routes, or manual route config

Report findings to the user before proceeding. Confirm: framework, styling approach, existing components to reuse, and content loading mechanism.

### Phase 2: Load the Content

1. **Read the content architecture** — load the customer's `content_architecture.md` from their workspace folder
2. **Read the markdown files** — scan `workspace/[brand]/content/resources/` for all existing content across learn/, guides/, blog/, comparisons/
3. **Map content to pages** — build a manifest of: slug, title, section, subsection, date, and any relationships (supports, internal links)
4. **Identify what to build** — confirm with user which sections to implement (all, or a subset)

### Phase 3: Build the Resource Center

Implement in this order — each layer builds on the previous.

#### 1. Content Loading

Set up the mechanism to read markdown files with YAML frontmatter and render them as pages.

- Use the framework's native content approach (e.g., Next.js `fs` + gray-matter + remark, Astro content collections, Nuxt content module)
- Parse frontmatter into typed metadata
- Render markdown body to HTML
- Handle JSON-LD script blocks in the markdown (pass through, don't strip)

#### 2. Layout Components

Build or extend these using the site's existing design system — never introduce a competing style system.

**Resource Shell** — page wrapper for all resource pages
- Consistent max-width, padding, and background matching the site
- Breadcrumb navigation: Home → Resources → [Section] → [Page Title]
- Optional sidebar for table of contents on long articles

**Content Card** — used on listing pages
- Thumbnail or category badge
- Title (2-3 lines max, truncated)
- Description excerpt from meta_description
- Section/subsection label
- Date
- Hover state matching the site's interaction patterns

**Article Layout** — single content page
- H1 from title
- Date and section label
- Rendered markdown body with proper heading hierarchy styling
- Related content section at the bottom (3 cards linking to same-section pages)
- Single CTA matching the site's existing CTA pattern

#### 3. Listing Pages

Build one listing page per section, plus a resource center hub.

**Resource Center Hub** (`/resources`)
- Featured content section: 1-3 editorially chosen items (most recent or highest priority from content architecture)
- Section navigation: clickable cards or tabs for Learn, Guides, Blog, Comparisons
- Recent content grid below

**Section Listing Pages** (`/resources/learn`, `/resources/guides`, `/resources/blog`, `/resources/comparisons`)
- Section title and brief description
- Filter by subsection or tag if applicable
- Card grid: 2-3 columns, responsive
- Sorted by date (newest first) with option for editorial ordering via frontmatter priority

#### 4. Article Pages

Dynamic routes that render individual content files.

- Route pattern: `/resources/[subsection]/[slug]`
- Load the markdown file matching the slug
- Render with Article Layout
- Generate `<head>` metadata from frontmatter: title_tag, meta_description, canonical URL, Open Graph tags
- Inject JSON-LD structured data from the markdown
- Build table of contents from H2/H3 headings for guides and learn pages
- Render internal links as actual `<Link>` components (not plain `<a>`) for client-side navigation

#### 5. Cross-Linking

Wire the content together.

- **Related content**: at the bottom of each article, show 3 cards from the same section. Prioritize pages with shared keywords or explicit `supports` relationships
- **Internal links in body**: when the markdown contains links to other resource URLs (e.g., `/resources/learn/what-is-x`), resolve them as working internal links
- **Section navigation**: each article page has a breadcrumb and a "Back to [Section]" link
- **Hub → Section → Article**: clear navigation hierarchy throughout

---

## Design Principles

These patterns come from how Stripe, Linear, Vanta, and Vercel build their resource centers.

### Match the site, don't fight it

- Use the existing color tokens, typography, and spacing — never hardcode values
- If the site has a dark theme, the resource center is dark. If it has an accent color, cards and links use that accent
- Reuse existing components (buttons, links, layout wrappers) before creating new ones
- Follow the same responsive breakpoints the site already uses

### Structure for scanning

- Card grids: 3 columns on desktop, 2 on tablet, 1 on mobile
- Cards have consistent anatomy: badge + title + excerpt + date
- Listing pages use filter tabs or buttons, not search-first
- Generous whitespace between cards — density kills scanability

### Education leads, product follows

- No aggressive CTAs interrupting content
- Product mentions live in dedicated zones: header bar, article footer, sidebar — not sprinkled through the content
- One CTA per article, at the bottom, matching the site's existing CTA component

### Content is king, chrome is minimal

- Article pages are typography-focused: wide readable column, proper line height, well-spaced headings
- Code blocks, tables, blockquotes, and lists must be styled — check that the markdown renderer handles all standard elements
- Images are lazy-loaded below the fold, constrained to content width

---

## Technical Checklist

Before delivering, verify:

- [ ] All existing content files render correctly (no broken frontmatter parsing, no missing fields)
- [ ] Listing pages show all content for their section
- [ ] Article pages render full markdown including tables, blockquotes, code blocks, lists, and bold/italic
- [ ] JSON-LD script blocks from markdown pass through to the rendered HTML `<head>` or `<body>`
- [ ] Open Graph and meta tags populate from frontmatter
- [ ] Internal links between articles work as client-side navigation
- [ ] Related content cards appear at the bottom of articles
- [ ] Breadcrumb navigation works on all resource pages
- [ ] Responsive: cards reflow correctly on mobile, article text is readable, tables scroll horizontally
- [ ] No style conflicts — resource pages use the site's design system, not competing styles
- [ ] No exposed metadata, developer annotations, or "Page Data" debug panels in production
- [ ] Pages pass Lighthouse accessibility basics: heading hierarchy, alt text, color contrast, focus states

---

## Rules

1. Read the client's codebase before writing any code — understand their stack, patterns, and conventions first
2. Use existing components and design tokens — never introduce a parallel design system
3. Content already exists in the workspace — read it, don't rewrite it
4. Every page must look like it belongs on the production site, not a prototype
5. No SEO/GEO annotations, debug panels, or internal tooling exposed to the visitor
6. Ask the user before making structural decisions (new dependencies, routing changes, layout modifications)
7. Build incrementally — content loading first, then components, then pages, then cross-linking
