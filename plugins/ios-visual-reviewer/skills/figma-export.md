---
name: figma-export
description: Export Figma frames as PNG images via Figma REST API. Shared with figma-visual-reviewer plugin. Use when you need to get a design screenshot from a Figma URL for visual comparison.
---

# Figma Export

從 Figma URL 導出指定 frame 的 PNG 截圖。

## 使用時機

- 需要取得 Figma 設計稿的靜態截圖
- 進行設計稿 vs iOS 實作的比對前

## 前置條件

- 環境變數 `FIGMA_ACCESS_TOKEN` 必須設定
- 安裝 `requests`：`pip install requests`

## 使用方式

```bash
python scripts/figma-export.py "<figma_url>" --output design.png [--scale 2] [--node-id <id>]
```

## 參數

| 參數 | 必填 | 說明 |
|------|------|------|
| `figma_url` | 是 | Figma 檔案或 frame 的 URL |
| `--output` | 否 | 輸出檔名（預設 `figma-export.png`） |
| `--scale` | 否 | 縮放倍數（預設 2，即 2x 解析度） |
| `--node-id` | 否 | 指定 node ID（從 URL 的 `node-id=` 參數取得） |

## iOS 比對注意事項

- Figma 設計稿通常以 @1x 邏輯解析度繪製
- iOS Simulator 截圖是 @2x 或 @3x 實際像素
- 導出時建議用 `--scale 3` 搭配 @3x 裝置，或 `--scale 2` 搭配 @2x 裝置
- 或者讓 `ios-screenshot-capture.py` 腳本自動處理 scale 對齊

## 替代方案

如果沒有 Figma Token：
1. 請使用者手動從 Figma 匯出截圖
2. 或用 Playwright 開啟 Figma URL 截圖（需要使用者已登入 Figma）
