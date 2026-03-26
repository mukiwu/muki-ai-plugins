"""
Pixel Diff — 兩張截圖的像素級比對

用法:
  python scripts/pixel-diff.py <image_a> <image_b> --output diff.png [--threshold 10]

輸出:
  - diff.png: 差異視覺化圖
  - stdout: JSON 格式的差異統計
"""

import argparse
import json
import sys

import numpy as np
from PIL import Image, ImageDraw


def load_and_align(path_a: str, path_b: str) -> tuple:
    """載入兩張圖並對齊尺寸"""
    img_a = Image.open(path_a).convert('RGB')
    img_b = Image.open(path_b).convert('RGB')

    # If sizes differ, resize the larger one to match the smaller
    if img_a.size != img_b.size:
        target_w = min(img_a.width, img_b.width)
        target_h = min(img_a.height, img_b.height)
        img_a = img_a.resize((target_w, target_h), Image.LANCZOS)
        img_b = img_b.resize((target_w, target_h), Image.LANCZOS)
        print(f"Resized both images to {target_w}x{target_h}", file=sys.stderr)

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
    from scipy import ndimage

    # Label connected components
    labeled, num_features = ndimage.label(diff_mask)

    regions = []
    for i in range(1, num_features + 1):
        ys, xs = np.where(labeled == i)
        if len(ys) < min_region_size:
            continue

        x_min, x_max = int(xs.min()), int(xs.max())
        y_min, y_max = int(ys.min()), int(ys.max())

        regions.append({
            "x": x_min,
            "y": y_min,
            "width": x_max - x_min,
            "height": y_max - y_min,
            "pixel_count": len(ys),
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


def main():
    parser = argparse.ArgumentParser(description="Pixel Diff — 像素級圖片比對")
    parser.add_argument("image_a", help="參考圖（設計稿）")
    parser.add_argument("image_b", help="比對圖（網頁截圖）")
    parser.add_argument("--output", type=str, default="diff.png", help="差異圖輸出路徑")
    parser.add_argument("--threshold", type=int, default=10, help="差異容許值 0-100（預設 10）")
    parser.add_argument("--highlight-color", type=str, default="red", help="差異標記顏色")
    args = parser.parse_args()

    # Load images
    img_a, img_b = load_and_align(args.image_a, args.image_b)

    # Compute diff
    diff_mask, diff_raw, total_pixels, diff_pixels, diff_percentage = compute_diff(
        img_a, img_b, args.threshold
    )

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
        "image_size": {"width": img_a.width, "height": img_a.height},
        "diff_regions": regions,
        "diff_image": args.output,
        "verdict": "PASS" if diff_percentage < 5 else ("WARNING" if diff_percentage < 15 else "BLOCK")
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
