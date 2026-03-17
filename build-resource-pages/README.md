# Build Resource Pages

Takes existing content (markdown files from the writing skills) and builds production-ready resource center pages on the client's website — using their existing tech stack and design system.

## Install

Add to your Claude Code project settings:

```json
{
  "skills": ["./write-resource-content/skill.md"]
}
```

## What It Does

- Discovers the client's frontend stack, design system, and content loading patterns
- Builds resource center hub, section listing pages, and individual article pages
- Implements content loading from markdown files with frontmatter
- Creates cross-linking: related content, breadcrumbs, internal navigation
- Matches the site's existing design — dark theme, light theme, whatever it uses

## Usage

```
/write-resource-content
```

Requires content files in `workspace/[brand]/content/resources/` (produced by `write-seo-geo-content` or `write-resource-content`).

Works with any frontend framework: Next.js, Astro, Nuxt, SvelteKit, Remix, etc.
