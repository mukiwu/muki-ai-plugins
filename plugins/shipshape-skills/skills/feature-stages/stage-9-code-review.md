---
name: feature-stage-9-code-review
description: Stage 9 of feature workflow — Two-stage code review (spec compliance then code quality) with iterative fix loop and mandatory cookbook check.
---

# 階段 9：Code Review（兩階段審查）

使用 Agent tool 派遣 **code-reviewer** subagent（`subagent_type: "shipshape-skills:code-reviewer"`）。在 prompt 中傳入：階段 1 的實作計畫、本次修改的 git diff、相關的 cookbook 內容。

code-reviewer subagent 進行**兩階段**審查：

## 第一階段：規格符合性

對照階段 1 的規劃，確認：
- 功能是否**完全符合需求**，不多不少
- 是否有遺漏的規劃項目
- 是否有超出規劃範圍的額外變更

**第一階段未通過就不進入第二階段**——先確認方向對，再談品質。

## 第二階段：程式碼品質

- 檢查程式碼品質、安全性、可維護性
- 標記 CRITICAL / HIGH / MEDIUM 問題
- 報告審查結果

## 迭代修正循環

審查結果出來後，若有 CRITICAL 或 HIGH 問題，進入修正循環：

1. **審查** — code-reviewer 產出審查報告
2. **修正** — 根據報告中的 CRITICAL 和 HIGH 問題修改程式碼
3. **驗證** — 執行 `npx vitest run` 確認測試通過，再次執行 code-reviewer 確認問題已解決
4. **重複** — 若仍有 CRITICAL 或 HIGH 問題，回到步驟 2 繼續修正

循環結束條件（滿足任一即可）：
- code-reviewer 判定為 **Approve**（無 CRITICAL 或 HIGH 問題）
- 使用者明確表示**目前版本可以接受**

## Cookbook 對照檢查（強制）

新增或修改的程式碼**必須**與 `docs/cookbook/` 對照：
- 讀取相關的 cookbook 文件（如開發首頁模組 → 讀 `module-development-guide.md`）
- 確認新程式碼遵循 cookbook 記載的模式與注意事項
- 若 cookbook 有記載「常見錯誤」或「重要注意事項」，逐條檢查是否違反
- 若發現 cookbook 描述與實際程式碼不一致，更新 cookbook
- **不要因為 review 完成就新增 cookbook 條目**。判準見 CLAUDE.md「品質關卡 → Cookbook 同步」的三問規則

完成後詢問使用者是否要 commit。
