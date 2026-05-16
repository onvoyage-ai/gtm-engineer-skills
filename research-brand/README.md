# Research Brand DNA

Generate a complete Brand DNA file from a URL. Crawls the website, searches the web, identifies competitors, and produces a structured `brand_dna.md` ready for content strategy, SEO, and GEO work.

## What It Does

Give it a URL → get a full brand intelligence file:
- What the product does (in plain language, not marketing fluff)
- Key features, pricing, target customer
- 3-5 competitors with overlap analysis
- Brand voice and positioning
- Content gaps and next-step recommendations

## Install

Clone the repo, then symlink the skill folder into your tool's skills directory:

**Claude Code:**
```bash
git clone https://github.com/onvoyage-ai/gtm-engineer-skills.git
mkdir -p ~/.claude/skills
ln -s "$PWD/gtm-engineer-skills/research-brand" ~/.claude/skills/research-brand
```

**Codex:**
```bash
git clone https://github.com/onvoyage-ai/gtm-engineer-skills.git
mkdir -p ~/.codex/skills
ln -s "$PWD/gtm-engineer-skills/research-brand" ~/.codex/skills/research-brand
```

See the root [README](../README.md) for the shared installation pattern.

## Usage

```
/research-brand https://www.example.com
```

## Output

A `brand_dna.md` file saved to your project directory. Feeds directly into:
- **research-keywords** — SEO keyword research
- **geo-content-research** — GEO prompt targets
- **improve-aeo-geo** — AEO/GEO website audit
