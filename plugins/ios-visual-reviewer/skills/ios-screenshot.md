---
name: ios-screenshot
description: Capture screenshots from iOS Simulator or connected real devices via xcrun. Handles device listing, booted simulator detection, and scale factor normalization.
---

# iOS Screenshot

從 iOS Simulator 或連接的真機擷取截圖。

## 使用時機

- 需要取得 iOS app 的畫面截圖進行比對
- 開發中想快速截取 Simulator 畫面

## 前置條件

- macOS 環境
- 已安裝 Xcode 和 Command Line Tools
- Simulator 已啟動，或真機已透過 USB 連接

## 常用指令

### 列出可用裝置

```bash
xcrun simctl list devices booted
```

### 截取已啟動的 Simulator

```bash
xcrun simctl io booted screenshot --type png screenshot.png
```

### 截取指定裝置

```bash
# 先列出所有裝置找到 UDID
xcrun simctl list devices available

# 用 UDID 截圖
xcrun simctl io <DEVICE_UDID> screenshot --type png screenshot.png
```

### 真機截圖（需安裝 libimobiledevice）

```bash
# 安裝
brew install libimobiledevice

# 截圖
idevicescreenshot screenshot.png
```

## Scale Factor 對照表

| 裝置 | 邏輯解析度 | 實際像素 | Scale |
|------|-----------|---------|-------|
| iPhone SE (3rd) | 375x667 | 750x1334 | @2x |
| iPhone 14 | 390x844 | 1170x2532 | @3x |
| iPhone 14 Pro | 393x852 | 1179x2556 | @3x |
| iPhone 14 Pro Max | 430x932 | 1290x2796 | @3x |
| iPhone 15 | 393x852 | 1179x2556 | @3x |
| iPhone 15 Pro | 393x852 | 1179x2556 | @3x |
| iPhone 15 Pro Max | 430x932 | 1290x2796 | @3x |
| iPhone 16 | 393x852 | 1179x2556 | @3x |
| iPhone 16 Pro | 402x874 | 1206x2622 | @3x |
| iPhone 16 Pro Max | 440x956 | 1320x2868 | @3x |
| iPad (10th) | 820x1180 | 1640x2360 | @2x |
| iPad Air (M2) | 820x1180 | 1640x2360 | @2x |
| iPad Pro 11" | 834x1194 | 1668x2388 | @2x |
| iPad Pro 13" | 1024x1366 | 2048x2732 | @2x |

## 注意事項

- Simulator 截圖的解析度會依裝置型號不同而異
- 截圖包含 status bar（電池、時間等），比對時可選擇裁切
- Figma 設計稿通常是 @1x 邏輯解析度，比對前需要 scale 對齊
- 真機截圖和 Simulator 截圖的色彩可能略有差異（True Tone、Night Shift）
