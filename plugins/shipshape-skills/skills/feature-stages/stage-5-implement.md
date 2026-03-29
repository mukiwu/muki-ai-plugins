---
name: feature-stage-5-implement
description: Stage 5 of feature workflow — Implementation (TDD Green) with mandatory cookbook/memory pre-check, GREEN verification, and completion check. Includes Stage 5.5 Refactor.
hooks:
  PreToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: agent
          prompt: "即將進入實作階段寫程式碼。請確認本次對話中是否已經讀取了 docs/cookbook/ 相關文件和 memory 中的 feedback 記錄。用 Grep 搜尋 transcript 或直接檢查對話歷史。如果確認已讀取，允許繼續。如果沒有，拒絕並說明需要先讀取哪些文件。"
          timeout: 15
          once: true
---

# 階段 5：實作功能（TDD Green）

## 前置知識檢查（強制）

寫程式碼之前，**必須**先查閱以下資源，避免重複犯錯或違反既有模式：

1. **Cookbook 對照**：讀取 `docs/cookbook/README.md` 的快速導覽，找出與本次修改相關的文件並讀取。特別注意「常見錯誤」和「重要注意事項」段落。
2. **Memory 回饋**：讀取 memory 中的 feedback 記錄，確認是否有與本次開發相關的過往經驗。
3. **既有模式分析**：對於要修改的檔案，先理解它現有的設計模式（如方法命名規則、分支處理慣例、錯誤處理方式），新增的程式碼必須遵循同樣的模式。**優先擴展現有方法（加參數或分支）而非新建方法重寫邏輯。**

> 若前置檢查發現與規劃有衝突（如 cookbook 記載了不同的做法），**暫停**回報使用者，調整計畫後再實作。

## 實作規範

開發功能程式碼，讓所有測試通過：
- 遵循專案的程式碼風格與命名規範
- 最小實作，不過度設計——只寫讓測試通過的最少程式碼
- **套件版本注意**：使用第三方套件時，先確認專案安裝的版本（`package.json`），再查該版本的 API 文件。不同主版本可能有 breaking change，不要假設 API 用法與訓練資料一致。若有 Context7 MCP 可用，優先用它查詢對應版本的文件。

## Verify GREEN（強制）

執行 `npx vitest run` 並確認：
1. 新寫的測試全部 **PASS**
2. **所有既有測試仍然通過**（無 regression）
3. 測試輸出乾淨，無 warning 或 console error

若有既有測試因新程式碼而失敗，**先修復 regression 再繼續**。

## 完成度檢查（強制）

實作完成後，**必須**回頭對照階段 1 規劃的變更清單，逐項確認每個計畫項目都已完成：
- 列出規劃中的所有變更項目
- 標記每項的完成狀態（✅ / ❌）
- **若有未完成項目，繼續實作直到全部完成**，不可進入下一階段
- UI 變更（元件、樣式、i18n 翻譯）也算在內，不可只做邏輯層

依照專案的開發節奏規則決定確認粒度：
- utility 類可批次 3-5 個
- 業務邏輯寫完測試先暫停
- 有副作用的每個都確認

---

# 階段 5.5：重構（TDD Refactor）

測試全綠後，進行重構：
- 移除重複程式碼
- 改善命名與可讀性
- 提取共用 helper / utility
- **不新增功能，不改變行為**

重構後再次執行 `npx vitest run` 確認所有測試仍然通過。

此階段可與階段 5 合併報告，不需要額外暫停。
