# shipshape-skills 自動行為規則

以下規則在安裝此 plugin 後自動生效，不需要使用者手動觸發。

## 功能開發

當使用者描述想要新增功能、加入新頁面、實作新需求時，主動建議執行 `/shipshape-skills:feature` 進入完整開發流程。如果任務明顯很小（改一行設定、換個字串），不需要建議。

## Bug 修復

當使用者描述程式行為與預期不符（不論用什麼措辭），修復完成後自動執行 `bug-learning` skill 的完整流程：分析根因、評估是否值得沉澱、**若判斷值得，必須實際用 Edit/Write 工具寫入 cookbook 或 memory 檔案**。「讀取 cookbook」或「承認應該寫」都不算完成——只有實際呼叫寫入工具才算。

## 框架 Patterns

修改 React 相關檔案（`.jsx`、`.tsx`）時，自動參考 `react-patterns` skill 的最佳實踐。
修改 Vue 相關檔案（`.vue`、Composition API）時，自動參考 `vue-patterns` skill 的最佳實踐。

## 測試

寫完單元測試後，主動詢問是否要執行 `auto-improve-tests` 優化測試品質。
功能開發完成後，主動詢問是否需要撰寫 E2E 測試。

## Code Review

完成程式碼修改後，主動使用 `code-reviewer` agent 進行審查。如果改動很小（< 5 行、純設定變更），可以跳過。
