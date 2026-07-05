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
python "${CLAUDE_PLUGIN_ROOT}/scripts/pixel-diff.py" <image_a> <image_b> --output diff.png \
  [--threshold 10] [--pass-below 5] [--block-above 15] [--ignore-region x,y,w,h]
```

腳本在 plugin 目錄裡，不在使用者專案裡——路徑一定要用 `${CLAUDE_PLUGIN_ROOT}`，寫相對路徑會找不到檔案。

## 參數

| 參數 | 必填 | 說明 |
|------|------|------|
| `image_a` | 是 | 參考圖（設計稿） |
| `image_b` | 是 | 比對圖（網頁截圖） |
| `--output` | 否 | 差異圖輸出路徑（預設 `diff.png`） |
| `--threshold` | 否 | 每像素色差敏感度 0-100（預設 10，值越低越嚴格）。這是「色差多大才算不同」，不是整體容許比例 |
| `--pass-below` | 否 | 整體差異低於此百分比判 PASS（預設 5） |
| `--block-above` | 否 | 整體差異高於此百分比判 BLOCK（預設 15），之間為 WARNING |
| `--ignore-region` | 否 | 忽略區域 `x,y,w,h`，可重複——遮掉時鐘、輪播等動態內容 |
| `--background` | 否 | 透明圖層合成的背景色（預設 `white`） |
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

- 尺寸不同時會**等比例**縮到共同寬度再 crop 高度（不會各軸獨立拉伸）；長寬比差太多會警告——那通常代表兩張圖根本不是同一個畫面範圍
- 最好從源頭對齊尺寸：Figma 導出的 `--scale` 跟網頁截圖的 device pixel ratio 要一致
- `--threshold` 是每像素色差的敏感度：預設 10 會濾掉字型反鋸齒、瀏覽器渲染那類細微色差；降到 5 會抓得更細，但假差異也會變多
- 透明背景的 Figma 導出會自動合成白底再比對（可用 `--background` 改）
