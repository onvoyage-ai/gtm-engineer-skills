# Write SEO + GEO Content

An agent skill for writing product-led content that ranks in search engines and gets cited by AI engines. Follows a structured research-then-write methodology — no fabricated stats, no skipped research.

---

## Install

Clone the repo, then symlink or copy `write-seo-geo-content/` into either `~/.codex/skills/` or `~/.claude/skills/`. See the root [README](../README.md) for the shared installation pattern.

## Usage

Once installed, invoke the skill by name:

```
/write-seo-geo-content
```

Or reference it in conversation:

> "Use the SEO + GEO content skill to write a comparison page about [topic]"
> "Plan 5 content pages for my product"
> "Write a page targeting the keyword [keyword] and GEO prompt [prompt]"

---

## Two Modes

### Planning Mode
Tell the skill about your product and it will:
1. Research keyword opportunities
2. Review your website and content architecture for context and voice
3. Propose 3-5 page ideas with keyword, GEO prompt, angle, and rationale

### Writing Mode
Give the skill a confirmed topic and keyword and it will:
1. Complete pre-writing research and a page brief
2. Write the page using the matching page-type framework
3. Include SEO and GEO answer blocks, schema, and internal links
4. Verify against the quality checklist before delivery

---

## Supported Page Types

- Comparison pages
- Guide pages
- Use case pages
- Learn / definition pages
- Trust / FAQ pages

---

## SEO Standards Applied

### On-Page
- Title: 50-60 characters, primary keyword present
- Meta description: 150-160 characters, benefit-led
- Keyword in H1, first 100 words, 2-3 H2s
- 3+ internal links with descriptive anchor text
- FAQPage JSON-LD schema on every article
- Brand mention block and GEO prompt coverage

### E-E-A-T Signals
- **Experience**: Real-world scenarios, specific contexts
- **Expertise**: Industry terminology, trade-off acknowledgment
- **Authoritativeness**: Named sources inline, linked to primary research
- **Trustworthiness**: Every stat cited, no hype language, limitations acknowledged

### Quality Gates
- Minimum 5-8 authoritative external citations
- Zero unverified statistics
- Comparison table when the page type calls for it
- Visual element (table, bullets, blockquote) every ~200 words
- Max 2-3 sentence paragraphs

---

## Pre-Writing Research Protocol

The skill completes four research steps before writing:

1. **Reference Review** — Loads product docs, landing pages, or directories you provide
2. **Page Brief** — Confirms page type, keyword, GEO prompt, and brand mention mechanism
3. **Image Research** — Finds 2 verified landscape images (or uses yours)
4. **Content Research** — Gathers current statistics from authoritative sources via web search

Research is non-negotiable. The skill will not write without completing it.

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on improving the framework, adding example articles, or suggesting new SEO patterns.

## License

MIT — see [LICENSE](../LICENSE).
