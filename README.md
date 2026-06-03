# muki-ai-plugins

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace for visual quality assurance.

## Plugins

| Plugin | Description |
|--------|-------------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | Visual regression testing — compare Figma designs against live web pages |

## Install

```bash
# Add the marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# Install the plugin
/plugin install figma-visual-reviewer
```

## Plugin Overview

### figma-visual-reviewer

Pixel-level visual comparison between Figma designs and live web implementations.

- `/review` — Interactive visual review
- Figma API export → Playwright screenshot → pixel diff → AI judgment
- Generates HTML diff reports with side-by-side comparison
- Supports RWD multi-viewport checks

[Read more →](plugins/figma-visual-reviewer/README.md)

## License

MIT
