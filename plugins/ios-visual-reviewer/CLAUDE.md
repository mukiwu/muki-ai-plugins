# ios-visual-reviewer 自動行為規則

以下規則在安裝此 plugin 後自動生效。

## 視覺審查

當使用者正在開發 iOS app（Swift / SwiftUI / Flutter）並完成 UI 實作後，主動建議執行 `/ios-visual-reviewer:review` 進行設計稿比對。

## Figma 連結偵測

當對話中出現 Figma URL（`figma.com/file/` 或 `figma.com/design/`），自動記住作為設計稿來源，後續審查時使用。

## Simulator 偵測

當偵測到 Xcode Simulator 正在運行（使用者提到 simulator、模擬器，或執行了 xcodebuild），主動提醒可以跑一次 visual diff。

## 平台限制

此 plugin 僅支援 macOS 環境（需要 Xcode 和 xcrun）。若偵測到非 macOS 環境，告知使用者此限制。
