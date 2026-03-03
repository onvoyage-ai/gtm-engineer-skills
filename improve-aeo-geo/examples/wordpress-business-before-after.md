# Example: WordPress Business Site — Before & After

A small business WordPress site scoring **31/100 (F)** improved to **82/100 (B+)**.

## Before: What was wrong

```
Score: 31/100 (F)
Foundational: 3/16 checks passing
Intelligence: 1.8/5 average

Failing checks:
- AI bots blocked (security plugin blocked all bots by default)
- nosnippet meta tag on all pages (added by theme)
- No JSON-LD
- No llms.txt
- No RSS feed discovery link
- No canonical URLs
- Homepage had 80 words total
- Product pages had no meta descriptions
- Images had no alt text
- No heading hierarchy (H1 used for styling, H4 for content)
```

## Key Changes

### 1. Unblocked AI bots
- Removed Wordfence rule blocking GPTBot, ClaudeBot, etc.
- Removed `nosnippet` from theme's `header.php`

### 2. Added JSON-LD via functions.php
- Organization schema on all pages
- Product schema on product pages
- Article schema on blog posts

### 3. Content depth
- Expanded homepage from 80 words to 650 words
- Added "What we do", "Who we serve", FAQ section
- Each product page expanded with: description, use cases, specifications, FAQ

### 4. Heading hierarchy fix
- Changed H1 from logo to page title
- Restructured content: H1 (page title) → H2 (sections) → H3 (details)

### 5. Meta & technical
- Added Yoast SEO, configured meta descriptions for all pages
- Added canonical URLs via Yoast
- Created `llms.txt` in web root
- Added RSS discovery link to `header.php`

### 6. GEO content improvements
- Added customer testimonials with names and companies (quotations)
- Added performance statistics: "Serving 500+ clients since 2018"
- Added FAQ sections to 4 key pages with FAQPage schema

## After

```
Score: 82/100 (B+)
Foundational: 14/16 checks passing
Intelligence: 3.6/5 average
```
