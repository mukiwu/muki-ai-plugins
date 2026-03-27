# ios-visual-reviewer

Visual regression testing for iOS apps — compare Figma designs against iOS Simulator or real device screenshots with pixel-level diff and AI vision.

## Features

- Capture screenshots from iOS Simulator with one command
- Compare against Figma designs via Figma REST API
- Pixel-level diff with configurable threshold
- AI-powered visual judgment (Bug / Drift / Acceptable)
- iOS-specific checks: Safe Area, Navigation Bar, Dark Mode, Auto Layout
- Automatic scale factor alignment (@1x Figma ↔ @2x/@3x device)
- Status bar cropping to avoid false positives
- HTML report generation with side-by-side comparison
- Multi-device batch comparison

## Requirements

- **macOS** with Xcode installed
- **Python 3** with `Pillow`, `numpy` (optional: `scipy` for region detection)
- **Figma Access Token** (optional — can use manual screenshots instead)

## Quick Start

```bash
# Install Python dependencies
pip3 install Pillow numpy scipy

# Set Figma token (optional)
export FIGMA_ACCESS_TOKEN="your-token-here"

# Run visual review
/ios-visual-reviewer:review
```

## Commands

| Command | Description |
|---------|-------------|
| `/ios-visual-reviewer:review` | Interactive visual review — captures iOS screenshot and compares with Figma |
| `/ios-visual-reviewer:review <figma_url>` | Specify Figma URL, auto-capture current Simulator |

## How It Works

1. **Capture** — Takes a screenshot from the booted iOS Simulator via `xcrun simctl`
2. **Export** — Fetches the corresponding Figma design frame via API
3. **Align** — Matches resolution and scale factor between the two images
4. **Diff** — Runs pixel-level comparison with configurable threshold
5. **Judge** — AI analyzes differences and classifies as Bug / Drift / Acceptable
6. **Report** — Generates an HTML report with side-by-side comparison

## Relationship with figma-visual-reviewer

This plugin extends the [figma-visual-reviewer](../figma-visual-reviewer/) plugin for iOS native app development. They share the same pixel-diff engine and Figma export tools, but this plugin adds:

- iOS Simulator screenshot capture (`xcrun simctl`)
- Scale factor handling (@2x / @3x)
- Status bar cropping
- iOS-specific visual checks (Safe Area, system UI elements)
- Device-aware resolution alignment
