# muki-ai-plugins

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace for quality assurance — visual regression testing and test review.

## Plugins

| Plugin | Description |
|--------|-------------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | Visual regression testing — compare Figma designs against live web pages |
| [review-tests](plugins/review-tests/) | Test review doctor — diagnose a test file for blind spots, output a self-contained HTML report |

## Install

```bash
# Add the marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# Install individual plugins
/plugin install figma-visual-reviewer
/plugin install review-tests
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

## License

MIT
