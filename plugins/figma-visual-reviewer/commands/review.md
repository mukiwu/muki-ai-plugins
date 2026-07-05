---
description: 執行 Figma vs 網頁的視覺比對審查，產出像素級 diff 報告和 AI 視覺判斷。
argument-hint: "[網頁 URL]（選填；也可加 Figma URL）"
---

執行 Figma vs 網頁的視覺比對審查。

比對設計稿和實際網頁的差異，產出像素級 diff 報告和 AI 視覺判斷。

使用者的參數：$ARGUMENTS

- 參數為空 — 互動式引導（詢問網頁 URL 和 Figma 連結）。
- 參數含 URL — 網頁 URL 直接使用；Figma 連結若也在參數或對話 context 裡就一併帶上。

請用 `visual-reviewer` agent 執行完整的視覺審查流程，並把上面取得的 URL／Figma 連結傳給它。
