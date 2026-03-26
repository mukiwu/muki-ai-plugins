# muki-ai-plugins

[繁體中文版](README.zh-TW.md)

A collection of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugins for disciplined development workflows and visual quality assurance.

## Plugins

| Plugin | Description |
|--------|-------------|
| [shipshape-skills](plugins/shipshape-skills/) | Disciplined development workflow — TDD, planning, code review, UIUX review |
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | Visual regression testing — compare Figma designs against live web pages |

## Install

```bash
# Add the marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# Install individual plugins
/plugin install shipshape-skills
/plugin install figma-visual-reviewer
```

You can install one or both plugins. They work independently but integrate seamlessly — shipshape's `/feature` workflow automatically uses figma-visual-reviewer for Stage 6 (UIUX Review) when it's installed and a Figma design is available.

## Plugin Overview

### shipshape-skills

Full development lifecycle plugin with TDD enforcement, planning agents, code review, and UIUX review.

- `/init` — Interactive project setup
- `/feature` — 10-stage development workflow (brainstorming → code review)
- `/tdd` — Test-Driven Development
- `/plan` — Implementation planning
- `/build-fix` — Build error diagnosis
- `/e2e` — Playwright E2E tests

[Read more →](plugins/shipshape-skills/README.md)

### figma-visual-reviewer

Pixel-level visual comparison between Figma designs and live web implementations.

- `/review` — Interactive visual review
- Figma API export → Playwright screenshot → pixel diff → AI judgment
- Generates HTML diff reports with side-by-side comparison
- Supports RWD multi-viewport checks

[Read more →](plugins/figma-visual-reviewer/README.md)

## How They Work Together

When both plugins are installed, shipshape's `/feature` workflow (Stage 6: UIUX Review) automatically selects the best available review mode:

| Priority | Mode | Condition | Review Method |
|----------|------|-----------|---------------|
| 1 | Figma Diff | figma-visual-reviewer installed + Figma design available | Pixel-level diff + AI vision |
| 2 | Visual Review | claude-in-chrome available | AI 5-dimension visual review |
| 3 | Skip | Neither available | Notifies user, proceeds to next stage |

## License

MIT
