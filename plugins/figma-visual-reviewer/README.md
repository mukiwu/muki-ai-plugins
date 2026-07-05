# figma-visual-reviewer

[繁體中文版](README.zh-TW.md)

Visual regression testing plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Compares Figma designs against live web implementations using pixel-level diff and AI vision.

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install figma-visual-reviewer
```

## Quick Start

```bash
/figma-visual-reviewer:review
```

The plugin will ask for:
1. **Target URL** — the web page to review (can be localhost)
2. **Figma link** — the design file URL (or a local screenshot)

Then it runs the full pipeline: export Figma → screenshot web page → pixel diff → AI judgment → report.

## How It Works

```
Figma Design ──→ Export PNG (via Figma API)
                                            ├──→ Pixel Diff ──→ AI Vision Judge ──→ Report
Web Page ──────→ Screenshot (via Playwright)
```

### Three Ways to Get the Design

| Method | When to use |
|--------|------------|
| **Figma API** | You have `FIGMA_ACCESS_TOKEN` set. Fully automated |
| **Manual screenshot** | No token. You provide a PNG of the design |
| **Playwright** | Open Figma in browser and screenshot (requires Figma login) |

### What the Pixel Diff Does

- Compares two images at the pixel level using numpy
- Highlights differences with colored overlay
- Detects contiguous diff regions using scipy
- Reports diff percentage and region coordinates

### What the AI Judges

Not all pixel differences are bugs. The AI categorizes each difference:

| Type | Meaning | Action |
|------|---------|--------|
| 🔴 Bug | Layout error, missing element, wrong color | Must fix |
| 🟡 Drift | Accumulated small deviations (spacing, font rendering) | Review |
| 🟢 Acceptable | Browser rendering differences, anti-aliasing, dynamic content | Ignore |

## Commands

| Command | Description |
|---------|-------------|
| `/review` | Interactive visual review — asks for URL and Figma link |

## Scripts

| Script | Description |
|--------|-------------|
| `figma-export.py` | Export Figma frames as PNG via REST API |
| `pixel-diff.py` | Pixel-level image comparison with region detection |
| `generate-report.py` | Generate HTML report with side-by-side comparison |

The scripts live inside the plugin directory, not your project — always call them through `${CLAUDE_PLUGIN_ROOT}` (a bare `scripts/...` path won't exist in your cwd).

### figma-export.py

```bash
python "${CLAUDE_PLUGIN_ROOT}/scripts/figma-export.py" "<figma_url>" --output design.png --scale 1
```

Requires `FIGMA_ACCESS_TOKEN` (environment variable, or a `.env` in your project root — the script reads both). Keep `--scale` equal to the screenshot's device pixel ratio, or the diff will drown in false positives.

### pixel-diff.py

```bash
python "${CLAUDE_PLUGIN_ROOT}/scripts/pixel-diff.py" design.png screenshot.png --output diff.png --threshold 10
```

Outputs JSON with diff statistics and a visual diff image. `--pass-below` / `--block-above` tune the verdict thresholds; `--ignore-region x,y,w,h` masks dynamic content (clocks, carousels).

### generate-report.py

```bash
python "${CLAUDE_PLUGIN_ROOT}/scripts/generate-report.py" \
  --design design.png \
  --screenshot screenshot.png \
  --diff diff.png \
  --stats stats.json \
  --findings findings.json \
  --output report.html
```

Generates a standalone HTML report with embedded images, including the AI Bug/Drift/Acceptable classification table when `--findings` is provided.

## Requirements

- Python 3.10+
- `Pillow`, `numpy` (required)
- `scipy` (optional, for region detection)
- Playwright MCP (for web page screenshots) — install with:

  ```bash
  claude mcp add playwright -- npx @playwright/mcp@latest
  ```

  Without it, the reviewer falls back to manual mode: you provide the web screenshot yourself.

## Setup

```bash
pip install Pillow numpy scipy
```

For Figma API access:
1. Go to [Figma](https://www.figma.com) → Settings → Personal access tokens
2. Generate a new token (name it something like `visual-reviewer`)
3. Set the token as an environment variable using one of these methods:

**Option A — Project `.env` file (recommended):**
```bash
# Add to your project's .env file
FIGMA_ACCESS_TOKEN=figd_your_token_here
```
Make sure `.env` is in your `.gitignore` — this token grants read access to your Figma files.

**Option B — Claude Code settings:**
```bash
# Run in Claude Code
/update-config
# Then add FIGMA_ACCESS_TOKEN to environment variables
```

**Option C — Shell export (temporary):**
```bash
export FIGMA_ACCESS_TOKEN=figd_your_token_here
```

The token is used by `figma-export.py` to call the [Figma REST API](https://www.figma.com/developers/api) and export design frames as PNG images. Without it, you can still use the plugin by manually providing design screenshots.

## License

MIT
