"""
Generate Report — 產生視覺比對的 HTML 報告

用法:
  python scripts/generate-report.py --design design.png --screenshot screenshot.png --diff diff.png --stats stats.json --output report.html
"""

import argparse
import base64
import json
import os
import sys


def img_to_base64(path: str) -> str:
    """將圖片轉為 base64 data URI"""
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    ext = os.path.splitext(path)[1].lstrip('.')
    if ext == 'jpg':
        ext = 'jpeg'
    return f"data:image/{ext};base64,{data}"


def generate_html(design_path: str, screenshot_path: str, diff_path: str, stats: dict) -> str:
    """產生 HTML 報告"""
    design_b64 = img_to_base64(design_path)
    screenshot_b64 = img_to_base64(screenshot_path)
    diff_b64 = img_to_base64(diff_path)

    verdict = stats.get("verdict", "UNKNOWN")
    verdict_color = {"PASS": "#10b981", "WARNING": "#f59e0b", "BLOCK": "#ef4444"}.get(verdict, "#6b7280")
    diff_pct = stats.get("diff_percentage", 0)
    regions = stats.get("diff_regions", [])

    regions_html = ""
    for r in regions:
        regions_html += f"""
        <tr>
            <td>{r['label']}</td>
            <td>({r['x']}, {r['y']})</td>
            <td>{r['width']}x{r['height']}</td>
            <td>{r['pixel_count']} px</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Visual Review Report</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #e5e7eb; padding: 40px; }}
h1 {{ font-size: 28px; margin-bottom: 8px; }}
.subtitle {{ color: #9ca3af; margin-bottom: 32px; }}
.verdict {{ display: inline-block; padding: 6px 16px; border-radius: 8px; font-weight: 700; font-size: 18px; color: #fff; background: {verdict_color}; margin-bottom: 24px; }}
.stats {{ display: flex; gap: 24px; margin-bottom: 32px; }}
.stat {{ background: #1f2937; padding: 16px 24px; border-radius: 12px; }}
.stat-label {{ font-size: 13px; color: #9ca3af; }}
.stat-value {{ font-size: 24px; font-weight: 700; margin-top: 4px; }}
.images {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }}
.image-card {{ background: #1f2937; border-radius: 12px; overflow: hidden; }}
.image-card h3 {{ padding: 12px 16px; font-size: 14px; color: #9ca3af; border-bottom: 1px solid #374151; }}
.image-card img {{ width: 100%; display: block; }}
table {{ width: 100%; border-collapse: collapse; background: #1f2937; border-radius: 12px; overflow: hidden; }}
th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #374151; }}
th {{ background: #111827; font-size: 13px; color: #9ca3af; }}
</style>
</head>
<body>
<h1>Visual Review Report</h1>
<p class="subtitle">Figma vs Implementation Comparison</p>
<div class="verdict">{verdict}</div>

<div class="stats">
    <div class="stat">
        <div class="stat-label">Diff Percentage</div>
        <div class="stat-value">{diff_pct}%</div>
    </div>
    <div class="stat">
        <div class="stat-label">Diff Pixels</div>
        <div class="stat-value">{stats.get('diff_pixels', 0):,}</div>
    </div>
    <div class="stat">
        <div class="stat-label">Regions Found</div>
        <div class="stat-value">{len(regions)}</div>
    </div>
    <div class="stat">
        <div class="stat-label">Image Size</div>
        <div class="stat-value">{stats.get('image_size', {}).get('width', '?')}x{stats.get('image_size', {}).get('height', '?')}</div>
    </div>
</div>

<div class="images">
    <div class="image-card">
        <h3>Design (Figma)</h3>
        <img src="{design_b64}" alt="Design">
    </div>
    <div class="image-card">
        <h3>Implementation (Screenshot)</h3>
        <img src="{screenshot_b64}" alt="Screenshot">
    </div>
    <div class="image-card">
        <h3>Diff Overlay</h3>
        <img src="{diff_b64}" alt="Diff">
    </div>
</div>

{"<h2 style='margin-bottom:16px'>Diff Regions</h2><table><thead><tr><th>Region</th><th>Position</th><th>Size</th><th>Pixels</th></tr></thead><tbody>" + regions_html + "</tbody></table>" if regions else ""}

</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate visual review HTML report")
    parser.add_argument("--design", required=True, help="設計稿圖片路徑")
    parser.add_argument("--screenshot", required=True, help="網頁截圖路徑")
    parser.add_argument("--diff", required=True, help="差異圖路徑")
    parser.add_argument("--stats", required=True, help="pixel-diff 輸出的 JSON 檔案路徑")
    parser.add_argument("--output", default="visual-report.html", help="HTML 報告輸出路徑")
    args = parser.parse_args()

    with open(args.stats) as f:
        stats = json.load(f)

    html = generate_html(args.design, args.screenshot, args.diff, stats)

    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Report generated: {args.output}")


if __name__ == "__main__":
    main()
