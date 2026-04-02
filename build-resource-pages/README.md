# Build Resource Pages

Takes existing content (markdown files from the writing skills) and builds **production-final** resource center pages on the client's website — using their existing tech stack and design system. Output ships directly to production. No review pass needed.

## Install

Clone the repo, then symlink or copy `build-resource-pages/` into either `~/.codex/skills/` or `~/.claude/skills/`. See the root [README](../README.md) for installation examples.

## What It Does

- Discovers the client's frontend stack, design system, and content loading patterns
- Builds resource center hub, section listing pages, and individual article pages
- Implements content loading from markdown files with frontmatter
- Renders all content elements to production standard: tables, FAQs, blockquotes, code blocks, direct answer blocks
- Generates complete page metadata: `<title>`, `<meta description>`, Open Graph tags, canonical URLs, structured data (JSON-LD)
- Creates cross-linking: related content, breadcrumbs, internal navigation
- Matches the site's existing design — every page looks like it was built by the same team

## Output Quality

Pages are **production-final**:
- Typography optimized for readability (font size, line height, line length)
- Data tables styled for scanning (alternating rows, proper padding, mobile scroll)
- FAQ sections clearly formatted with visual Q&A separation
- Structured data (JSON-LD) validated and injected correctly
- Full `<head>` metadata on every page
- Static generation for performance
- Accessible: heading hierarchy, color contrast, focus states

## Usage

```
/build-resource-pages
```

Requires content files in `workspace/[brand]/content/resources/` (produced by the content writing skills).

Works with any frontend framework: Next.js, Astro, Nuxt, SvelteKit, Remix, etc.
