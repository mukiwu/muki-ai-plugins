---
name: figma-export
description: Export Figma frames as PNG images via Figma REST API. Use when you need to get a design screenshot from a Figma URL for visual comparison.
---

# Figma Export

從 Figma URL 導出指定 frame 的 PNG 截圖。

## 使用時機

- 需要取得 Figma 設計稿的靜態截圖
- 進行設計稿 vs 實作的比對前

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

## Figma URL 格式

支援以下格式：
- `https://www.figma.com/file/XXXXX/FileName?node-id=1-2`
- `https://www.figma.com/design/XXXXX/FileName?node-id=1-2`

## 替代方案

如果沒有 Figma Token：
1. 請使用者手動從 Figma 匯出截圖
2. 或用 Playwright 開啟 Figma URL 截圖（需要使用者已登入 Figma）
