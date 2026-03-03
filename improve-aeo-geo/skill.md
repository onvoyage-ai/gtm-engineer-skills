# Improve Website AEO/GEO Skill

You are an expert at AI Engine Optimization (AEO) and Generative Engine Optimization (GEO). When invoked, you analyze the user's website codebase and make concrete, actionable code changes so AI agents — ChatGPT, Claude, Perplexity, Google AI Overviews, and others — can better discover, parse, quote, and cite the site.

The web is shifting from human-first to AI-first discovery. AI agents don't browse like humans. They extract structured data, scan for direct answers, and decide in milliseconds whether content is worth citing. This skill makes websites visible to that new audience.

## Workflow

When invoked on a codebase, follow this exact sequence:

### Step 1: Baseline
- If the user has a live URL, recommend running it through [aeo-audit.sh](https://aeo-audit.sh) first to get a score.
- If no URL is available, proceed with a code-level audit.

### Step 2: Discover the stack
- Identify the framework (Next.js, Nuxt, Astro, SvelteKit, Remix, WordPress, Hugo, Jekyll, 11ty, plain HTML)
- Find where `<head>` is managed (layout files, document components, plugins, theme files)
- Find where content lives (pages, MDX/MD files, CMS templates, components, PHP templates)
- Check for existing SEO plugins/packages (next-seo, @astrojs/sitemap, Yoast, etc.)
- Check if the site uses SSR, SSG, or client-side rendering

### Step 3: Audit existing state
Run through all checks below. For each failing check, note the file(s) to modify and the specific fix.

### Step 4: Fix in priority order
Apply changes starting with Priority 1 (blockers), then work down. Make the smallest, most targeted changes needed.

### Step 5: Verify
- Recommend re-running the audit at [aeo-audit.sh](https://aeo-audit.sh)
- Target: 80+ overall score (B+ grade or higher)

---

## Scoring Model

The AEO audit score combines two halves:

- **Foundational Score (50%)** — 16 deterministic checks, pass/fail per page, aggregated site-wide (80%+ pages must pass)
- **Intelligence Score (50%)** — 6 LLM-evaluated content quality dimensions (0-5 scale)

**Final Score** = 50% Foundational + 50% Intelligence → letter grade (A+ = 95-100, A = 90-94, B+ = 80-84, ..., F = below 40).

---

## Priority 1: Blockers (fix these first)

### AI Bot Access (12 pts)

robots.txt must NOT block these 9 AI crawlers: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`, `anthropic-ai`, `ChatGPT-User`, `Bytespider`, `CCBot`.

**Fix**: Open `robots.txt` (project root, `public/robots.txt`, or framework equivalent). Remove any `Disallow` rules for these bots. If no robots.txt exists, create one:

```txt
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://YOURDOMAIN.com/sitemap.xml
```

If AI bots are blocked, nothing else matters. This is the #1 prerequisite.

### AI-Accessible Meta Tags (6 pts)

Pages must NOT have `nosnippet`, `noai`, or `noimageai` in robots meta tags or `X-Robots-Tag` headers. Search for these and remove from public content pages.

### Indexability (10 pts)

Pages must NOT have `<meta name="robots" content="noindex">` on public-facing pages. Search codebase for `noindex` and remove where inappropriate.

---

## Priority 2: High-Impact Structure

### Structured Data / JSON-LD (8 pts)

Every page needs at least 1 `<script type="application/ld+json">` block. Recognized `@type` values (8 additional pts): `Organization`, `WebSite`, `WebPage`, `Article`, `Product`, `FAQPage`, `BreadcrumbList`, `LocalBusiness`, `Person`, `Event`, `HowTo`, `Recipe`, `VideoObject`, `SoftwareApplication`.

Minimum setup:
- **Site-wide**: Organization schema in the root layout
- **Homepage**: WebSite schema with SearchAction
- **Blog posts**: Article schema with author, datePublished, dateModified
- **Product pages**: Product schema
- **FAQ sections**: FAQPage schema

### Page Titles (10 pts)

Every `<title>` must be 10+ characters. Each page needs a unique, descriptive title. Format: `[Page Topic] | [Brand]`. Aim for 50-60 characters.

### Meta Descriptions (10 pts)

Every page needs `<meta name="description">` with 50+ characters. Write unique descriptions (120-160 chars ideal). Lead with the answer/value, not filler.

### Text Depth (12 pts)

Each page needs 250+ words of readable body text (excluding nav, footer, boilerplate). Aim for 500-2000 words on key pages. Articles over 2,900 words average 5.1 AI citations vs. 3.2 for under 800 words (SE Ranking, 2025 — 2.3M pages analyzed).

For SPA/component sites: ensure content is server-rendered or statically generated.

### llms.txt (10 pts)

Create `/.well-known/llms.txt` with a heading, links, and 100+ characters:

```markdown
# [Your Site Name]

> Brief description of what your site/product does.

## Documentation
- [Getting Started](https://yourdomain.com/docs/getting-started)
- [API Reference](https://yourdomain.com/docs/api)

## Key Pages
- [About](https://yourdomain.com/about)
- [Pricing](https://yourdomain.com/pricing)
- [Blog](https://yourdomain.com/blog)

## Policies
- [Terms of Service](https://yourdomain.com/terms)
- [Privacy Policy](https://yourdomain.com/privacy)
```

Also consider creating `llms-full.txt` with the complete content of key pages inlined for direct LLM consumption.

---

## Priority 3: Content Quality

### Heading Hierarchy (6 pts)

Proper H1 → H2 → H3 nesting. Exactly 1 `<h1>` per page (8 pts). 2+ heading levels. No skips (H1 → H3 without H2 is wrong). Use 120-180 words between headings — this range gets 70% more ChatGPT citations than shorter sections (SE Ranking, 2025).

### Internal Linking (10 pts)

5+ internal links per page. Use descriptive anchor text. Add: breadcrumbs, related posts, "see also" sections, contextual inline links.

### Canonical URL (8 pts)

Every page needs `<link rel="canonical" href="...">` with an absolute URL. Handle trailing slashes consistently.

### Open Graph (8 pts)

Every page needs `og:title` and `og:description`. Also add `og:image`, `og:url`, `og:type`.

### Image Alt Coverage (8 pts)

80%+ of `<img>` tags must have `alt` attributes. Use descriptive text. Decorative images: `alt=""`.

### RSS/Atom Feed (8 pts)

Publish a feed and add the discovery link:
```html
<link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml" />
```

### Sitemap with lastmod

Not scored directly but critical for freshness signals. Generate `sitemap.xml` with `<lastmod>` dates. Reference it from robots.txt.

---

## Priority 4: GEO Content Optimization

These strategies are backed by peer-reviewed research from the GEO paper (Aggarwal et al., KDD 2024 — Princeton, Georgia Tech, IIT Delhi, Allen AI) and large-scale industry studies.

### Add Quotations from Authoritative Sources (+41% visibility)

The single most effective GEO strategy. Include direct quotes from experts, studies, or official sources. This is the #1 optimization per the GEO paper.

```
WEAK: "Experts say this approach works well."
STRONG: "As Dr. Jane Smith, Harvard's head of AI research, noted: 'This approach reduces error rates by 40% in production systems.'"
```

### Add Statistics and Data Points (+33% visibility)

The #2 GEO strategy. Include specific numbers, percentages, dates, and measurements. Every 150-200 words should contain at least one data point.

```
WEAK: "Our platform is significantly faster."
STRONG: "Our platform processes 10,000 requests per second with a median latency of 12ms, based on benchmarks run in January 2025."
```

### Cite Sources with In-Text References (+28% visibility)

The #3 GEO strategy. Name sources inline. Link to studies, reports, and official documentation.

```
WEAK: "Studies show this is effective."
STRONG: "According to a 2024 McKinsey report, companies adopting this approach saw 35% higher revenue growth."
```

**Key finding**: Lower-ranked sites benefit the most — sites originally ranked 4th-5th saw up to +115% visibility improvement from citing sources (GEO paper, KDD 2024).

### Answer-First Content Structure

44.2% of ChatGPT citations come from the first 30% of page content (Kevin Indig, Growth Memo, 2026 — 1.2M AI answers analyzed). Lead every section with the direct answer:

```
[H2: Question-format heading]
[1-2 sentence direct answer]
[Supporting detail with evidence]
[Statistic or source citation]
[Internal link to related content]
```

**Before**: "Our company was founded in 2015 with a vision to transform..."
**After**: "[Product] is a [category] tool that [primary function]. It helps [audience] achieve [specific outcome], reducing [metric] by [X]%."

### FAQ Sections

Pages with FAQ sections average 4.9 AI citations vs. 4.4 without (SE Ranking, 2025 — 2.3M pages). The FAQ *content* matters more than FAQ schema markup. Add both:

```html
<section>
  <h2>Frequently Asked Questions</h2>
  <h3>What is [topic]?</h3>
  <p>[Direct answer]. [Supporting detail with evidence].</p>
  <h3>How does [topic] work?</h3>
  <p>[Step-by-step explanation].</p>
</section>
```

Plus FAQPage JSON-LD schema for the section.

### Quotable Blocks

Write self-contained paragraphs that make sense when extracted in isolation:
- 40-60 words per block
- No pronouns referring to prior context ("it", "this")
- Name the subject explicitly
- End with a concrete fact or number
- Use comparison tables, numbered lists, and definition blocks

### Freshness Signals

AI agents cite fresher content. Content updated within 3 months averages 6 citations vs. 3.9 for 2+ year old content (SE Ranking, 2025). AI assistants cite content 25.7% fresher than traditional organic search results (Ahrefs, 2025 — 17M citations analyzed).

Add to every content page:
```html
<meta property="article:published_time" content="2025-01-15T00:00:00Z" />
<meta property="article:modified_time" content="2025-06-01T00:00:00Z" />
```

Show "Last updated: [date]" visibly on the page. Maintain a blog or changelog with regular updates.

### Structural Clarity

Use semantic HTML: `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`. Content with clear H2/H3 hierarchy is 2.8x more likely to earn citations (AirOps, 2025). Ensure critical content is in the HTML (SSR/SSG), not loaded via client-side JS.

---

## Framework-Specific Patterns

### Next.js (App Router)

**Metadata** (`app/page.tsx` or `app/layout.tsx`):
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | Brand',
  description: 'Descriptive meta description of 120-160 characters.',
  alternates: { canonical: 'https://yourdomain.com/page' },
  openGraph: {
    title: 'Page Title',
    description: 'Social sharing description.',
    url: 'https://yourdomain.com/page',
    images: [{ url: 'https://yourdomain.com/og-image.jpg' }],
  },
  robots: { index: true, follow: true },
}
```

**JSON-LD**:
```tsx
export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Article Title',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    author: { '@type': 'Person', name: 'Author Name' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article><h1>Article Title</h1>{/* Content */}</article>
    </>
  )
}
```

**robots.txt** (`app/robots.ts`):
```typescript
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

**Sitemap** (`app/sitemap.ts`):
```typescript
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://yourdomain.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yourdomain.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
```

### Nuxt 3

**Metadata** (in `app.vue` or page components):
```vue
<script setup>
useSeoMeta({
  title: 'Page Title | Brand',
  description: 'Descriptive meta description.',
  ogTitle: 'Page Title',
  ogDescription: 'Social sharing description.',
  ogImage: 'https://yourdomain.com/og-image.jpg',
})
useHead({
  link: [{ rel: 'canonical', href: 'https://yourdomain.com/page' }],
})
</script>
```

**JSON-LD** (using `useSchemaOrg` from `nuxt-schema-org`):
```vue
<script setup>
useSchemaOrg([
  defineArticle({
    headline: 'Article Title',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    author: { name: 'Author Name' },
  }),
])
</script>
```

### SvelteKit

**Metadata** (in `+page.svelte` or `+layout.svelte`):
```svelte
<svelte:head>
  <title>Page Title | Brand</title>
  <meta name="description" content="Descriptive meta description." />
  <link rel="canonical" href="https://yourdomain.com/page" />
  <meta property="og:title" content="Page Title" />
  <meta property="og:description" content="Social sharing description." />
</svelte:head>
```

**JSON-LD**:
```svelte
<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Article Title",
    "datePublished": "2025-01-15"
  })}</script>`}
</svelte:head>
```

### Astro

**Layout** (`src/layouts/Base.astro`):
```astro
---
const { title, description, canonical, publishedDate } = Astro.props
---
<head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {publishedDate && <meta property="article:published_time" content={publishedDate} />}
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml" />
</head>
```

Use `@astrojs/sitemap` for automatic sitemap generation with lastmod.

### WordPress

**functions.php** — Add JSON-LD:
```php
function add_json_ld_schema() {
  if (is_singular('post')) {
    $schema = [
      '@context' => 'https://schema.org',
      '@type' => 'Article',
      'headline' => get_the_title(),
      'datePublished' => get_the_date('c'),
      'dateModified' => get_the_modified_date('c'),
      'author' => ['@type' => 'Person', 'name' => get_the_author()],
    ];
    echo '<script type="application/ld+json">' . json_encode($schema) . '</script>';
  }
}
add_action('wp_head', 'add_json_ld_schema');
```

**robots.txt** — WordPress manages via Settings > Reading. Add AI bot rules via a plugin (Yoast, Rank Math) or a custom `robots.txt` in the web root.

**llms.txt** — Create `.well-known/llms.txt` in the WordPress root directory, or use a plugin/rewrite rule.

### Hugo

**Metadata** (in `layouts/partials/head.html`):
```html
<title>{{ .Title }} | {{ .Site.Title }}</title>
<meta name="description" content="{{ .Description }}" />
<link rel="canonical" href="{{ .Permalink }}" />
<meta property="og:title" content="{{ .Title }}" />
<meta property="og:description" content="{{ .Description }}" />
{{ if .Date }}<meta property="article:published_time" content="{{ .Date.Format "2006-01-02T15:04:05Z07:00" }}" />{{ end }}
{{ if .Lastmod }}<meta property="article:modified_time" content="{{ .Lastmod.Format "2006-01-02T15:04:05Z07:00" }}" />{{ end }}
```

**JSON-LD** (in `layouts/partials/schema.html`):
```html
{{ if .IsPage }}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ .Title }}",
  "datePublished": "{{ .Date.Format "2006-01-02" }}",
  "dateModified": "{{ .Lastmod.Format "2006-01-02" }}",
  "author": { "@type": "Person", "name": "{{ .Params.author | default .Site.Params.author }}" }
}
</script>
{{ end }}
```

Hugo generates RSS at `/index.xml` by default. Use `hugo --minify` for clean HTML output.

### Jekyll / 11ty

**Jekyll** — Use `jekyll-seo-tag` and `jekyll-sitemap` gems. Add JSON-LD in `_includes/head.html`. RSS via `jekyll-feed` gem.

**11ty** — Use `@11ty/eleventy-plugin-rss` for feeds. Add metadata via Nunjucks/Liquid templates in `_includes/base.njk`. Generate sitemap with a custom template or `eleventy-plugin-sitemap`.

### Remix

**Metadata** (in route `meta` function):
```typescript
export const meta: MetaFunction = () => [
  { title: 'Page Title | Brand' },
  { name: 'description', content: 'Descriptive meta description.' },
  { property: 'og:title', content: 'Page Title' },
  { property: 'og:description', content: 'Social sharing description.' },
  { tagName: 'link', rel: 'canonical', href: 'https://yourdomain.com/page' },
]
```

---

## Verification Checklist

After making changes, confirm:

- [ ] robots.txt allows all 9 AI bots
- [ ] No noindex, nosnippet, noai on public pages
- [ ] Every page has: title (10+ chars), meta description (50+ chars), canonical URL
- [ ] Every page has: exactly 1 H1, proper heading hierarchy (H1 → H2 → H3)
- [ ] Every page has: JSON-LD with recognized @type
- [ ] Every page has: og:title + og:description
- [ ] Every page has: 250+ words of body content
- [ ] Every page has: 5+ internal links
- [ ] 80%+ images have alt text
- [ ] `/.well-known/llms.txt` exists and is valid
- [ ] RSS/Atom feed exists and is discoverable via `<link>` tag
- [ ] Sitemap.xml exists with `<lastmod>` dates
- [ ] Publication/modification dates on content pages (meta + visible)
- [ ] Content leads with direct answers, not preamble
- [ ] FAQ sections on key pages with FAQPage schema
- [ ] Statistics and named sources cited inline
- [ ] Authoritative quotations included where relevant

**Target**: 80+ AEO score (B+ grade or higher). Validate at [aeo-audit.sh](https://aeo-audit.sh).

---

## Research References

All statistics in this skill are from verifiable, peer-reviewed or large-scale primary research:

| Claim | Source |
|---|---|
| Quotations = +41% visibility; Statistics = +33%; Cite Sources = +28% | Aggarwal et al., "GEO: Generative Engine Optimization," KDD 2024 ([arXiv](https://arxiv.org/abs/2311.09735)) |
| Lower-ranked sites gain up to +115% from GEO optimization | Same GEO paper — sites ranked 4th-5th saw largest gains |
| 44.2% of ChatGPT citations from first 30% of content | Kevin Indig, Growth Memo, Feb 2026 — 1.2M AI answers, 18K citations |
| Articles 2,900+ words = 5.1 citations vs. 3.2 for <800 words | SE Ranking, Nov 2025 — 2.3M pages, 295K domains |
| 120-180 words per section = 70% more ChatGPT citations | Same SE Ranking study |
| FAQ sections = 4.9 citations vs. 4.4 without | Same SE Ranking study |
| Content updated within 3 months = 6 citations vs. 3.9 for 2+ year old | Same SE Ranking study |
| AI cites content 25.7% fresher than organic search | Ahrefs, 2025 — 17M citations across 7 AI platforms |
| H2/H3 hierarchy = 2.8x more likely to earn citations | AirOps, 2025 |
| 85% of AI Overview citations from last 2 years | Seer Interactive, 2025 |
| ChatGPT drives 87.4% of AI referral traffic | Conductor, Nov 2025 — 13.7K domains, 3.3B sessions |
