執行 Figma vs iOS app 的視覺比對審查。

比對設計稿和 iOS Simulator（或真機）截圖的差異，產出像素級 diff 報告和 AI 視覺判斷。

使用方式：
- `/ios-visual-reviewer:review` — 互動式引導（會詢問裝置和 Figma 連結）
- `/ios-visual-reviewer:review <figma_url>` — 指定 Figma URL，自動截取目前 Simulator 畫面

請用 `ios-visual-reviewer` agent 執行完整的視覺審查流程。
