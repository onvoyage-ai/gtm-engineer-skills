# Example: Next.js Blog — Before & After

A typical Next.js blog scoring **42/100 (D)** improved to **87/100 (A-)** with these changes.

## Before: What was wrong

```
Score: 42/100 (D)
Foundational: 5/16 checks passing
Intelligence: 2.1/5 average

Failing checks:
- AI bots blocked (robots.txt had Disallow: / for GPTBot, ClaudeBot)
- No JSON-LD on any page
- No llms.txt
- No RSS feed
- No canonical URLs
- No OG tags
- Thin content on 60% of pages (<250 words)
- Multiple H1s on homepage (logo + hero title)
- No meta descriptions on blog posts
```

## Changes Made

### 1. robots.txt (Priority 1 — Blocker)

**File**: `public/robots.txt`

```diff
- User-agent: GPTBot
- Disallow: /
- User-agent: ClaudeBot
- Disallow: /
+ User-agent: *
+ Allow: /
+
+ User-agent: GPTBot
+ Allow: /
+
+ User-agent: ClaudeBot
+ Allow: /
+
+ Sitemap: https://myblog.com/sitemap.xml
```

### 2. JSON-LD structured data (Priority 2)

**File**: `app/layout.tsx` — Added Organization schema site-wide:

```tsx
// Added to RootLayout
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'My Blog',
      url: 'https://myblog.com',
      logo: 'https://myblog.com/logo.png',
    }),
  }}
/>
```

**File**: `app/blog/[slug]/page.tsx` — Added Article schema to each post:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { '@type': 'Person', name: post.author },
}
```

### 3. Metadata (Priority 2)

**File**: `app/blog/[slug]/page.tsx` — Added generateMetadata:

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  return {
    title: `${post.title} | My Blog`,
    description: post.excerpt, // 120-160 chars
    alternates: { canonical: `https://myblog.com/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
  }
}
```

### 4. llms.txt (Priority 2)

**File**: `public/.well-known/llms.txt` — Created:

```markdown
# My Blog

> A developer blog covering React, TypeScript, and AI engineering.

## Popular Posts
- [Building with Next.js App Router](https://myblog.com/blog/nextjs-app-router)
- [TypeScript Best Practices 2025](https://myblog.com/blog/typescript-2025)

## About
- [About the Author](https://myblog.com/about)
```

### 5. RSS Feed (Priority 3)

**File**: `app/feed.xml/route.ts` — Created RSS route handler generating valid XML feed.

**File**: `app/layout.tsx` — Added discovery link:
```tsx
<link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml" />
```

### 6. Content improvements (Priority 4)

Rewrote blog post intros from:
> "In this post, we'll explore the various ways you can..."

To:
> "[Topic] is [definition]. It solves [problem] by [mechanism]. Here's how to implement it in [framework]."

Added FAQ sections to 5 key posts with FAQPage schema.

## After

```
Score: 87/100 (A-)
Foundational: 15/16 checks passing (image alt at 75%, just below 80% threshold)
Intelligence: 4.0/5 average

Remaining fix: Add alt text to 12 images to hit 80% coverage.
```

## Time spent

~45 minutes with Claude Code using this skill.
