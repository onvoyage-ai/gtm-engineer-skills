# Write SEO Blog Article

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill for writing product-led SEO blog articles that rank in search engines and convert readers. Follows a structured research-then-write methodology — no fabricated stats, no skipped research.

---

## Install

```bash
claude skill add --from https://github.com/onvoyage-ai/gtm-engineer-skills/write-seo-blog
```

Or manually copy `skill.md` into your project's `.claude/skills/` directory.

## Usage

Once installed, invoke the skill in Claude Code:

```
/write-seo-blog
```

Or reference it in conversation:

> "Use the SEO blog skill to write an article about [topic]"
> "Plan 5 blog articles for my product"
> "Write a blog post targeting the keyword [keyword]"

---

## Two Modes

### Planning Mode
Tell the skill about your product and it will:
1. Research keyword opportunities
2. Review your website for product context and voice
3. Propose 3-5 article topics with keyword, angle, and rationale

### Writing Mode
Give the skill a confirmed topic and keyword and it will:
1. Complete pre-writing research (product context, stats, sources)
2. Write a full article using the 8-part framework
3. Include all on-page SEO elements
4. Verify against the quality checklist before delivery

---

## The 8-Part Article Framework

| Part | Purpose | Target Length |
|---|---|---|
| 1. Introduction | Hook, present solution, establish relevance | 150-200 words |
| 2. Quick Answer | Featured snippet optimization — definition under 45 words | ~45 words |
| 3. The Problem | Quantified pain points with cited statistics | 200-300 words |
| 4. The Solution | Comparison table, capabilities, outcome-framed benefits | 300-400 words |
| 5. How It Works | Numbered steps with concrete example | 300-400 words |
| 6. Use Cases | 3+ scenarios with named roles and specific outcomes | 300-400 words |
| 7. FAQ | "People Also Ask" targeting with FAQPage schema | 200-300 words |
| 8. Conclusion | Transformation summary + single clear CTA | 100-150 words |

**Total**: 1,500–2,000 words minimum. 2,500+ for competitive keywords.

---

## SEO Standards Applied

### On-Page
- Title: 50-60 characters, primary keyword present
- Meta description: 150-160 characters, benefit-led
- Keyword in H1, first 100 words, 2-3 H2s
- 3+ internal links with descriptive anchor text
- FAQPage JSON-LD schema on every article

### E-E-A-T Signals
- **Experience**: Real-world scenarios, specific contexts
- **Expertise**: Industry terminology, trade-off acknowledgment
- **Authoritativeness**: Named sources inline, linked to primary research
- **Trustworthiness**: Every stat cited, no hype language, limitations acknowledged

### Quality Gates
- Minimum 5-8 authoritative external citations
- Zero unverified statistics
- Comparison table in every article
- Visual element (table, bullets, blockquote) every ~200 words
- Max 2-3 sentence paragraphs

---

## Pre-Writing Research Protocol

The skill completes three research steps before writing:

1. **Reference Review** — Loads product docs, landing pages, or directories you provide
2. **Image Research** — Finds 2 verified landscape images (or uses yours)
3. **Content Research** — Gathers current statistics from authoritative sources via web search

Research is non-negotiable. The skill will not write without completing it.

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on improving the framework, adding example articles, or suggesting new SEO patterns.

## License

MIT — see [LICENSE](../LICENSE).
