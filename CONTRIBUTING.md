# Contributing

Thanks for helping improve the AEO/GEO skill. Here's how to contribute.

## Ways to Contribute

### Add a Framework Pattern
If your framework isn't covered in `SKILL.md` (e.g., Angular, Gatsby, Eleventy with a specific template engine), add a section under "Framework-Specific Patterns" with:
- Metadata setup (title, description, OG, canonical)
- JSON-LD injection pattern
- robots.txt setup
- Sitemap generation
- RSS feed setup

### Add or Update Research
All statistics must be from verifiable sources. When adding a claim:
1. Include the exact finding with numbers
2. Name the source (paper title, organization, author)
3. Include the year and methodology (sample size, etc.)
4. Add a link to the primary source
5. Add it to the Research References table at the bottom of `SKILL.md`

**Do not add unverifiable or secondary-source statistics.** If you can't link to the original study, don't include the number.

### Improve Check Coverage
If the [AEO Audit](https://aeo-audit.sh) adds new checks, update `SKILL.md` to include fix instructions for them.

### Add Examples
Add before/after examples to the `examples/` directory showing real improvements. Use the format in existing examples.

## Guidelines

- Keep `SKILL.md` focused as an agent prompt — it's what the skill runners read
- Keep the README as the human-facing documentation
- Be specific and actionable — "add X to file Y" not "consider improving Z"
- Test your framework patterns against the AEO audit to confirm they work
- Don't add speculative or untested advice

## Submitting

1. Fork the repo
2. Create a branch (`git checkout -b add-angular-patterns`)
3. Make your changes
4. Submit a PR with a clear description of what you added and why
