---
name: pixel-diff
description: Pixel-level image comparison between two screenshots. Generates a visual diff overlay highlighting differences. Use for comparing Figma designs against web implementations.
---

# Pixel Diff

兩張截圖的像素級比對，產出差異視覺化圖。

## 使用時機

- 比對 Figma 設計稿與網頁截圖
- 檢測 CSS 變更造成的視覺 regression
- 前後版本的 UI 變化追蹤

## 前置條件

- 安裝 `Pillow` 和 `numpy`：`pip install Pillow numpy`

## 使用方式

```bash
python scripts/pixel-diff.py <image_a> <image_b> --output diff.png [--threshold 5] [--highlight-color red]
```

## 參數

| 參數 | 必填 | 說明 |
|------|------|------|
| `image_a` | 是 | 參考圖（設計稿） |
| `image_b` | 是 | 比對圖（網頁截圖） |
| `--output` | 否 | 差異圖輸出路徑（預設 `diff.png`） |
| `--threshold` | 否 | 像素差異容許值 0-100（預設 10，值越低越嚴格） |
| `--highlight-color` | 否 | 差異標記顏色（預設 `red`） |

## 輸出

1. **diff.png** — 差異視覺化圖（差異區域用半透明紅色標記）
2. **stdout JSON** — 差異統計數據：
   ```json
   {
     "total_pixels": 2073600,
     "diff_pixels": 12450,
     "diff_percentage": 0.60,
     "diff_regions": [
       {"x": 100, "y": 200, "width": 300, "height": 50, "label": "region_1"}
     ]
   }
   ```

## 注意事項

- 兩張圖必須是相同解析度，如果不同會自動 resize 較大的那張
- threshold 10 適合一般比對，設為 5 可以抓更細微的差異
- 字型反鋸齒差異通常在 threshold 10 以下會被過濾
