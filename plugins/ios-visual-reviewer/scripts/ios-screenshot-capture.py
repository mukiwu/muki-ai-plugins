"""
iOS Screenshot Capture — 從 iOS Simulator 或真機擷取截圖

用法:
  python3 scripts/ios-screenshot-capture.py --output screenshot.png [--device <UDID>] [--crop-status-bar]
  python3 scripts/ios-screenshot-capture.py --list-devices
  python3 scripts/ios-screenshot-capture.py --align design.png screenshot.png --output-design d.png --output-screenshot s.png

環境:
  僅支援 macOS（需要 Xcode 和 xcrun）
"""

import argparse
import json
import re
import subprocess
import sys

from PIL import Image


# iOS status bar heights (in pixels, at native resolution)
STATUS_BAR_HEIGHTS = {
    # Devices with Dynamic Island
    "iPhone 16 Pro Max": 162,
    "iPhone 16 Pro": 162,
    "iPhone 16": 141,
    "iPhone 16 Plus": 141,
    "iPhone 15 Pro Max": 162,
    "iPhone 15 Pro": 162,
    "iPhone 15": 141,
    "iPhone 15 Plus": 141,
    "iPhone 14 Pro Max": 162,
    "iPhone 14 Pro": 162,
    # Devices with notch
    "iPhone 14": 141,
    "iPhone 14 Plus": 141,
    "iPhone 13": 141,
    "iPhone 13 Pro": 141,
    "iPhone 13 Pro Max": 141,
    "iPhone 13 mini": 132,
    "iPhone 12": 141,
    "iPhone 12 Pro": 141,
    "iPhone 12 Pro Max": 141,
    "iPhone 12 mini": 132,
    # Devices with traditional status bar
    "iPhone SE": 60,
    "iPad": 60,
}

# Device scale factors
DEVICE_SCALES = {
    "iPhone SE": 2,
    "iPhone 8": 2,
    "iPad": 2,
    "iPad Air": 2,
    "iPad Pro": 2,
    "default_iphone": 3,
    "default_ipad": 2,
}


def get_booted_devices() -> list:
    """取得所有已啟動的 Simulator 裝置"""
    result = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "booted", "--json"],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"Error: xcrun simctl failed — {result.stderr}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)
    devices = []

    for runtime, device_list in data.get("devices", {}).items():
        for device in device_list:
            if device.get("state") == "Booted":
                # Extract iOS version from runtime string
                ios_ver = re.search(r'iOS[- ](\d+[.-]\d+)', runtime)
                devices.append({
                    "udid": device["udid"],
                    "name": device["name"],
                    "state": device["state"],
                    "runtime": runtime,
                    "ios_version": ios_ver.group(1).replace('-', '.') if ios_ver else "unknown",
                })

    return devices


def get_all_available_devices() -> list:
    """取得所有可用的 Simulator 裝置"""
    result = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "available", "--json"],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"Error: xcrun simctl failed — {result.stderr}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)
    devices = []

    for runtime, device_list in data.get("devices", {}).items():
        ios_ver = re.search(r'iOS[- ](\d+[.-]\d+)', runtime)
        for device in device_list:
            devices.append({
                "udid": device["udid"],
                "name": device["name"],
                "state": device["state"],
                "runtime": runtime,
                "ios_version": ios_ver.group(1).replace('-', '.') if ios_ver else "unknown",
            })

    return devices


def get_device_scale(device_name: str) -> int:
    """根據裝置名稱推測 scale factor"""
    for key, scale in DEVICE_SCALES.items():
        if key in device_name:
            return scale

    if "iPad" in device_name:
        return DEVICE_SCALES["default_ipad"]
    return DEVICE_SCALES["default_iphone"]


def get_status_bar_height(device_name: str) -> int:
    """根據裝置名稱取得 status bar 高度（native pixels）"""
    for key, height in STATUS_BAR_HEIGHTS.items():
        if key in device_name:
            return height

    if "iPad" in device_name:
        return 60
    return 141  # Default for modern iPhones with notch


def capture_screenshot(device_udid: str, output_path: str) -> bool:
    """從 Simulator 截圖"""
    result = subprocess.run(
        ["xcrun", "simctl", "io", device_udid, "screenshot", "--type=png", output_path],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"Error: Screenshot failed — {result.stderr}", file=sys.stderr)
        return False

    return True


def crop_status_bar(image_path: str, device_name: str, output_path: str):
    """裁切 status bar 區域"""
    img = Image.open(image_path)
    height = get_status_bar_height(device_name)

    # Crop from below status bar to bottom
    cropped = img.crop((0, height, img.width, img.height))
    cropped.save(output_path)

    print(f"Cropped status bar ({height}px) from {device_name}", file=sys.stderr)


def align_images(design_path: str, screenshot_path: str, output_design: str, output_screenshot: str):
    """對齊設計稿和截圖的解析度"""
    design = Image.open(design_path)
    screenshot = Image.open(screenshot_path)

    if design.size == screenshot.size:
        # Already aligned
        design.save(output_design)
        screenshot.save(output_screenshot)
        print(json.dumps({
            "aligned": True,
            "method": "none",
            "size": {"width": design.width, "height": design.height}
        }))
        return

    # Resize to match the smaller dimension proportionally
    # Usually: design is smaller (@1x or @2x), screenshot is larger (@2x or @3x)
    if design.width < screenshot.width:
        # Scale design up to match screenshot
        ratio = screenshot.width / design.width
        new_h = int(design.height * ratio)
        design = design.resize((screenshot.width, new_h), Image.LANCZOS)
    else:
        # Scale screenshot up to match design
        ratio = design.width / screenshot.width
        new_h = int(screenshot.height * ratio)
        screenshot = screenshot.resize((design.width, new_h), Image.LANCZOS)

    # Crop to same height (use the smaller height)
    target_h = min(design.height, screenshot.height)
    design = design.crop((0, 0, design.width, target_h))
    screenshot = screenshot.crop((0, 0, screenshot.width, target_h))

    design.save(output_design)
    screenshot.save(output_screenshot)

    print(json.dumps({
        "aligned": True,
        "method": "resize_and_crop",
        "size": {"width": design.width, "height": target_h},
        "scale_ratio": round(ratio, 2)
    }))


def main():
    parser = argparse.ArgumentParser(description="iOS Screenshot Capture")
    parser.add_argument("--output", type=str, default="screenshot.png", help="截圖輸出路徑")
    parser.add_argument("--device", type=str, default=None, help="指定裝置 UDID（預設使用 booted）")
    parser.add_argument("--crop-status-bar", action="store_true", help="裁切 status bar")
    parser.add_argument("--list-devices", action="store_true", help="列出可用裝置")
    parser.add_argument("--align", nargs=2, metavar=("DESIGN", "SCREENSHOT"), help="對齊兩張圖的解析度")
    parser.add_argument("--output-design", type=str, default="design-aligned.png")
    parser.add_argument("--output-screenshot", type=str, default="screenshot-aligned.png")
    args = parser.parse_args()

    # List devices mode
    if args.list_devices:
        booted = get_booted_devices()
        available = get_all_available_devices()

        result = {
            "booted": booted,
            "booted_count": len(booted),
            "available_count": len(available),
        }

        if booted:
            for d in booted:
                d["scale_factor"] = get_device_scale(d["name"])
                d["status_bar_height"] = get_status_bar_height(d["name"])

        print(json.dumps(result, indent=2))
        return

    # Align mode
    if args.align:
        align_images(args.align[0], args.align[1], args.output_design, args.output_screenshot)
        return

    # Screenshot mode
    booted = get_booted_devices()

    if args.device:
        target_udid = args.device
        target_name = "Unknown"
        for d in booted:
            if d["udid"] == args.device:
                target_name = d["name"]
                break
    elif booted:
        target_udid = booted[0]["udid"]
        target_name = booted[0]["name"]
    else:
        print("Error: 沒有已啟動的 Simulator。請先啟動一個 Simulator。", file=sys.stderr)
        print("提示：xcrun simctl boot 'iPhone 15 Pro'", file=sys.stderr)
        sys.exit(1)

    scale = get_device_scale(target_name)
    print(f"Device: {target_name}", file=sys.stderr)
    print(f"UDID: {target_udid}", file=sys.stderr)
    print(f"Scale: @{scale}x", file=sys.stderr)

    # Capture
    if not capture_screenshot(target_udid, args.output):
        sys.exit(1)

    # Crop status bar if requested
    if args.crop_status_bar:
        crop_status_bar(args.output, target_name, args.output)

    # Output device info as JSON
    img = Image.open(args.output)
    result = {
        "device": target_name,
        "udid": target_udid,
        "scale_factor": scale,
        "screenshot": args.output,
        "size": {"width": img.width, "height": img.height},
        "status_bar_cropped": args.crop_status_bar,
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
