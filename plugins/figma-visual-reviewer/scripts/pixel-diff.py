"""
Pixel Diff — 兩張截圖的像素級比對

用法:
  python "${CLAUDE_PLUGIN_ROOT}/scripts/pixel-diff.py" <image_a> <image_b> --output diff.png \
      [--threshold 10] [--pass-below 5] [--block-above 15] [--ignore-region x,y,w,h ...]

輸出:
  - diff.png: 差異視覺化圖
  - stdout: JSON 格式的差異統計
"""

import argparse
import json
import sys

import numpy as np
from PIL import Image, ImageDraw

try:
    from scipy import ndimage
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def load_rgb(path: str, background: str = "white") -> Image.Image:
    """載入圖片並轉 RGB。RGBA 先合成到指定背景色——直接 convert('RGB') 會把
    透明區壓成黑底，Figma 導出常帶透明背景，對上白底網頁會整片假差異。"""
    img = Image.open(path)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA')
        bg = Image.new('RGBA', img.size, background)
        img = Image.alpha_composite(bg, img)
    return img.convert('RGB')


def load_and_align(path_a: str, path_b: str, background: str = "white") -> tuple:
    """載入兩張圖並對齊尺寸。

    等比例縮放到相同寬度，再把高度 crop 到共同範圍。絕不各軸獨立 resize——
    那會破壞長寬比，讓整張圖每個像素都對不上，diff 直接滿版紅。
    """
    img_a = load_rgb(path_a, background)
    img_b = load_rgb(path_b, background)

    if img_a.size == img_b.size:
        return img_a, img_b

    ratio_a = img_a.width / img_a.height
    ratio_b = img_b.width / img_b.height
    if abs(ratio_a - ratio_b) / max(ratio_a, ratio_b) > 0.02:
        print(
            f"Warning: 兩張圖長寬比不同（{img_a.width}x{img_a.height} vs "
            f"{img_b.width}x{img_b.height}），可能不是同一個畫面範圍（"
            f"如全頁截圖 vs 單一 frame），比對結果僅供參考",
            file=sys.stderr,
        )

    # 等比例縮到共同寬度（縮小較大的那張，避免放大失真）
    target_w = min(img_a.width, img_b.width)
    def scale_to_width(img: Image.Image) -> Image.Image:
        if img.width == target_w:
            return img
        new_h = round(img.height * target_w / img.width)
        return img.resize((target_w, new_h), Image.LANCZOS)

    img_a = scale_to_width(img_a)
    img_b = scale_to_width(img_b)

    # 高度 crop 到共同範圍（多出來的通常是頁尾之外的長度差）
    target_h = min(img_a.height, img_b.height)
    img_a = img_a.crop((0, 0, target_w, target_h))
    img_b = img_b.crop((0, 0, target_w, target_h))
    print(f"Aligned both images to {target_w}x{target_h}（等比例縮放＋crop）", file=sys.stderr)

    return img_a, img_b


def compute_diff(img_a: Image.Image, img_b: Image.Image, threshold: int = 10) -> tuple:
    """計算像素差異"""
    arr_a = np.array(img_a, dtype=np.int16)
    arr_b = np.array(img_b, dtype=np.int16)

    # Per-pixel difference (max across RGB channels)
    diff = np.abs(arr_a - arr_b).max(axis=2)

    # Apply threshold: pixels with diff > threshold are considered different
    # threshold is 0-100, map to 0-255
    threshold_val = int(threshold * 255 / 100)
    diff_mask = diff > threshold_val

    total_pixels = diff_mask.size
    diff_pixels = int(diff_mask.sum())
    diff_percentage = round(diff_pixels / total_pixels * 100, 2)

    return diff_mask, diff, total_pixels, diff_pixels, diff_percentage


def find_diff_regions(diff_mask: np.ndarray, min_region_size: int = 100) -> list:
    """找出差異區域的 bounding boxes"""
    if not HAS_SCIPY:
        raise ImportError("scipy is required for region detection")

    # Label connected components
    labeled, num_features = ndimage.label(diff_mask)
    if num_features == 0:
        return []

    # find_objects + sum：一次掃描拿到每個區塊的 bbox 與像素數。
    # 逐 label 跑 np.where 是 O(區塊數×H×W)，滿版噪點時上萬區塊會直接卡死。
    slices = ndimage.find_objects(labeled)
    counts = ndimage.sum(diff_mask, labeled, index=range(1, num_features + 1))

    regions = []
    for sl, count in zip(slices, counts):
        if sl is None or count < min_region_size:
            continue
        y_sl, x_sl = sl
        regions.append({
            "x": int(x_sl.start),
            "y": int(y_sl.start),
            "width": int(x_sl.stop - x_sl.start - 1),
            "height": int(y_sl.stop - y_sl.start - 1),
            "pixel_count": int(count),
            "label": f"region_{len(regions) + 1}"
        })

    # Sort by size descending
    regions.sort(key=lambda r: r["pixel_count"], reverse=True)
    return regions


def generate_diff_image(img_b: Image.Image, diff_mask: np.ndarray, regions: list, highlight_color: str = "red") -> Image.Image:
    """產生差異視覺化圖"""
    # Start with a copy of image B (the implementation)
    result = img_b.copy()

    # Create red overlay for diff pixels
    overlay = Image.new('RGBA', result.size, (0, 0, 0, 0))
    overlay_arr = np.array(overlay)

    # Color mapping
    colors = {
        "red": (255, 0, 0, 100),
        "blue": (0, 100, 255, 100),
        "green": (0, 255, 0, 100),
        "yellow": (255, 255, 0, 100),
    }
    color = colors.get(highlight_color, colors["red"])

    overlay_arr[diff_mask] = color

    overlay = Image.fromarray(overlay_arr, 'RGBA')
    result = Image.alpha_composite(result.convert('RGBA'), overlay)

    # Draw bounding boxes for regions
    draw = ImageDraw.Draw(result)
    for region in regions:
        x, y, w, h = region["x"], region["y"], region["width"], region["height"]
        # Red rectangle outline
        draw.rectangle([x - 2, y - 2, x + w + 2, y + h + 2], outline=(255, 0, 0, 255), width=2)
        # Label
        draw.text((x, y - 15), region["label"], fill=(255, 0, 0, 255))

    return result.convert('RGB')


def parse_region(spec: str) -> tuple:
    """解析 x,y,w,h 格式的區域參數"""
    try:
        x, y, w, h = (int(v) for v in spec.split(','))
        return x, y, w, h
    except ValueError:
        print(f"Error: --ignore-region 格式須為 x,y,w,h — 收到 {spec!r}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Pixel Diff — 像素級圖片比對")
    parser.add_argument("image_a", help="參考圖（設計稿）")
    parser.add_argument("image_b", help="比對圖（網頁截圖）")
    parser.add_argument("--output", type=str, default="diff.png", help="差異圖輸出路徑")
    parser.add_argument("--threshold", type=int, default=10,
                        help="每像素色差敏感度 0-100（預設 10）——色差要多大才算「不同」，不是整體差異的容許比例")
    parser.add_argument("--pass-below", type=float, default=5.0,
                        help="verdict：整體差異低於此百分比判 PASS（預設 5）")
    parser.add_argument("--block-above", type=float, default=15.0,
                        help="verdict：整體差異高於此百分比判 BLOCK，之間為 WARNING（預設 15）")
    parser.add_argument("--background", type=str, default="white",
                        help="透明圖層的合成背景色（預設 white，可給 #rrggbb）")
    parser.add_argument("--ignore-region", action="append", default=[], metavar="x,y,w,h",
                        help="忽略的區域（動態內容：時鐘、輪播、廣告），可重複指定")
    parser.add_argument("--highlight-color", type=str, default="red", help="差異標記顏色")
    args = parser.parse_args()

    # Load images
    img_a, img_b = load_and_align(args.image_a, args.image_b, args.background)

    # Compute diff
    diff_mask, diff_raw, total_pixels, diff_pixels, diff_percentage = compute_diff(
        img_a, img_b, args.threshold
    )

    # Mask out ignored regions（動態內容不該灌高差異率）
    ignored = [parse_region(s) for s in args.ignore_region]
    if ignored:
        for x, y, w, h in ignored:
            diff_mask[y:y + h, x:x + w] = False
        diff_pixels = int(diff_mask.sum())
        diff_percentage = round(diff_pixels / total_pixels * 100, 2)

    # Find regions
    try:
        regions = find_diff_regions(diff_mask)
    except ImportError:
        # scipy not installed, skip region detection
        regions = []
        print("Warning: scipy not installed, skipping region detection", file=sys.stderr)

    # Generate diff image
    diff_img = generate_diff_image(img_b, diff_mask, regions, args.highlight_color)
    diff_img.save(args.output)

    # Output JSON stats
    result = {
        "total_pixels": total_pixels,
        "diff_pixels": diff_pixels,
        "diff_percentage": diff_percentage,
        "threshold": args.threshold,
        "verdict_thresholds": {"pass_below": args.pass_below, "block_above": args.block_above},
        "ignored_regions": [list(r) for r in ignored],
        "image_size": {"width": img_a.width, "height": img_a.height},
        "diff_regions": regions,
        "diff_image": args.output,
        "verdict": "PASS" if diff_percentage < args.pass_below else (
            "WARNING" if diff_percentage < args.block_above else "BLOCK")
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
