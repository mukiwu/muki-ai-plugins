---
name: feature-trigger
description: 當使用者想要新增功能、建立新頁面、實作新需求、加入新元件或模組時觸發。即使使用者只是簡單描述「我要加一個 X」「幫我做一個 Y」「新增 Z 功能」，只要涉及新功能開發就應該觸發。觸發後引導使用者進入 /feature 完整開發流程。
---

# Feature Trigger

當偵測到使用者想開發新功能時，執行以下判斷：

## 判斷流程

1. **評估任務規模**：
   - 改動 ≤ 3 行、純設定或字串替換 → 直接做，不需要走流程
   - 需要新增檔案、修改多個檔案、涉及業務邏輯 → 建議走 `/feature`

2. **建議走流程時**，告知使用者：
   - 「這個功能建議走 `/shipshape-skills:feature` 流程，會幫你規劃、寫測試、實作、code review。要開始嗎？」
   - 如果使用者同意，執行 `/shipshape-skills:feature` 的完整流程
   - 如果使用者拒絕，直接協助開發，但仍參考相關的 patterns skill

3. **使用者拒絕走流程時**，至少做到：
   - 參考對應的 framework patterns（react-patterns / vue-patterns）
   - 完成後主動詢問是否需要 code review
