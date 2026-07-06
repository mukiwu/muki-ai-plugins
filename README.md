# muki-ai-plugins

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace — visual regression testing, test review, and project knowledge capture.

## Plugins

| Plugin | Description |
|--------|-------------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | Visual regression testing — compare Figma designs against live web pages |
| [review-tests](plugins/review-tests/) | Test review doctor — diagnose a test file for blind spots, output a self-contained HTML report |
| [lore](plugins/lore/) | Project lore — scaffold, consult, capture, guard, maintain, health-check, and language-align the implicit knowledge your codebase can't show |

## Install

```bash
# Add the marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# Install individual plugins
/plugin install figma-visual-reviewer
/plugin install review-tests
/plugin install lore
```

## Plugin Overview

### figma-visual-reviewer

Pixel-level visual comparison between Figma designs and live web implementations.

- `/review` — Interactive visual review
- Figma API export → Playwright screenshot → pixel diff → AI judgment
- Generates HTML diff reports with side-by-side comparison
- Supports RWD multi-viewport checks

[Read more →](plugins/figma-visual-reviewer/README.md)

### review-tests

Reads an existing test file, finds blind spots, and produces a self-contained HTML report — read-only, never touches your code.

- Checks assertion validity, behavior gaps, mock health, and test structure
- Backlinks every finding to the key lines of the source under test
- Outputs a single inline-everything HTML report to `.review-tests/`
- Diagnose only — fixes are left to TDD

[Read more →](plugins/review-tests/README.md)

### lore

Scaffold, consult, capture, guard, maintain, health-check, and language-align project lore — the implicit knowledge your codebase carries but can't show on its own.

- `lore-init` / `lore-consult` / `lore-capture` / `lore-guard` / `lore-check` / `lore-maintain` / `lore-ul` — seven skills covering the full lifecycle
- Stores business rules, pitfalls, API maps, a shared glossary, and the *why* behind decisions under `docs/lore/`
- Consult before planning or bug-fixing; capture what you learn as you go; guard your diff against recorded lore before commit
- Mark over delete — outdated-but-once-true knowledge keeps its lesson

[Read more →](plugins/lore/README.md)

## License

MIT
