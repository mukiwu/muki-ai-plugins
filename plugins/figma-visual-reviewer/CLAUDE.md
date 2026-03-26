# figma-visual-reviewer 自動行為規則

以下規則在安裝此 plugin 後自動生效。

## 視覺審查

當使用者完成前端功能實作、準備 merge 或上線前，主動建議執行 `/figma-visual-reviewer:review` 進行視覺比對。

## Figma 連結偵測

當對話中出現 Figma URL（`figma.com/file/` 或 `figma.com/design/`），自動記住作為設計稿來源，後續審查時使用。

## 截圖比對

修改 CSS、排版、UI 元件相關檔案後，如果專案有設定 Figma 連結，建議跑一次 visual diff 確認沒有 regression。
