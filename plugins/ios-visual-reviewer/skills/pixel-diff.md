---
name: pixel-diff
description: Pixel-level image comparison between two screenshots. Generates a visual diff overlay highlighting differences. Shared with figma-visual-reviewer plugin.
---

# Pixel Diff

兩張截圖的像素級比對，產出差異視覺化圖。

## 使用時機

- 比對 Figma 設計稿與 iOS 截圖
- 檢測 UI 變更造成的視覺 regression
- 不同 iOS 版本間的 UI 變化追蹤

## 前置條件

- 安裝 `Pillow` 和 `numpy`：`pip install Pillow numpy`
- 區域偵測另需 `scipy`：`pip install scipy`

## 使用方式

```bash
python scripts/pixel-diff.py <image_a> <image_b> --output diff.png [--threshold 5] [--highlight-color red]
```

## iOS 特有注意事項

- Status bar 區域（時間、電池）建議裁切後再比對，避免動態內容干擾
- 使用 `--crop-status-bar` 參數可自動裁切 iOS status bar
- Dark Mode / Light Mode 截圖要與對應的 Figma 設計稿比對
- 字型渲染差異在 threshold 10 以下通常會被過濾
