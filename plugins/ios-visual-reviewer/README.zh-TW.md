# ios-visual-reviewer

iOS app 視覺回歸測試 — 比對 Figma 設計稿與 iOS Simulator 或真機截圖，提供像素級差異分析和 AI 視覺判斷。

## 功能特色

- 一鍵從 iOS Simulator 擷取截圖
- 透過 Figma REST API 自動取得設計稿
- 像素級差異比對，可調整容許閾值
- AI 視覺判斷（Bug / 偏移 / 可接受）
- iOS 專屬檢查：Safe Area、Navigation Bar、Dark Mode、Auto Layout
- 自動對齊 scale factor（@1x Figma ↔ @2x/@3x 裝置）
- 裁切 status bar 避免誤判
- 產出 HTML 報告，三欄並排比對
- 支援多裝置批次比對

## 環境需求

- **macOS** 並安裝 Xcode
- **Python 3** 及 `Pillow`、`numpy`（選用：`scipy` 做區域偵測）
- **Figma Access Token**（選用 — 也可手動提供截圖）

## 快速開始

```bash
# 安裝 Python 依賴
pip3 install Pillow numpy scipy

# 設定 Figma token（選用）
export FIGMA_ACCESS_TOKEN="your-token-here"

# 執行視覺審查
/ios-visual-reviewer:review
```

## 指令

| 指令 | 說明 |
|------|------|
| `/ios-visual-reviewer:review` | 互動式視覺審查 — 截取 iOS 畫面並比對 Figma |
| `/ios-visual-reviewer:review <figma_url>` | 指定 Figma URL，自動截取目前 Simulator |

## 運作方式

1. **截圖** — 透過 `xcrun simctl` 從已啟動的 iOS Simulator 擷取畫面
2. **匯出** — 透過 Figma API 取得對應的設計稿
3. **對齊** — 自動處理解析度和 scale factor 差異
4. **比對** — 執行像素級差異比對
5. **判斷** — AI 分析差異並分類為 Bug / 偏移 / 可接受
6. **報告** — 產出 HTML 報告，包含三欄並排比對

## 與 figma-visual-reviewer 的關係

此 plugin 是 [figma-visual-reviewer](../figma-visual-reviewer/) 的 iOS 延伸版。共用像素比對引擎和 Figma 匯出工具，額外加入：

- iOS Simulator 截圖擷取（`xcrun simctl`）
- Scale factor 處理（@2x / @3x）
- Status bar 裁切
- iOS 專屬視覺檢查（Safe Area、系統 UI 元件）
- 裝置感知的解析度對齊
