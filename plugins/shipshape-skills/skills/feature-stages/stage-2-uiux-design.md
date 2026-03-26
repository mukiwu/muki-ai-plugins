---
name: feature-stage-2-uiux-design
description: Stage 2 of feature workflow — UI/UX design with 3 proposals and iterative refinement. Skippable when feature has no UI changes.
---

# 階段 2：UI/UX 設計（涉及畫面變更時）

> 跳過條件：功能不涉及 UI 變更（純邏輯、API 串接、資料處理等）

## 前置檢查

先確認使用者是否已安裝 `frontend-design` skill（檢查技能列表中是否存在）：
- **已安裝**：直接進入設計流程
- **未安裝**：詢問使用者是否要安裝（`/install frontend-design`），使用者同意則安裝後繼續，不同意則**跳過此階段**直接進入階段 3

## 設計流程

使用 `frontend-design` skill 產出 **3 個不同方案**的互動式 HTML mockup：
- 每個方案包含完整的 UI 佈局與互動流程
- 標註各方案的設計理念與取捨
- 使用專案現有的設計語言與 UI 元件庫
- 考慮不同螢幕尺寸的呈現

產出 3 個方案後**暫停**，等使用者選擇方案或提出修改意見。

## 迭代修正循環

使用者選定方案後，若提出修改意見，進入修正循環：

1. **展示** — 呈現當前設計方案
2. **收集回饋** — 使用者指出要調整的地方
3. **修正** — 根據回饋調整設計，產出新版 mockup
4. **重複** — 若使用者仍有修改意見，回到步驟 2

循環結束條件（滿足任一即可）：
- 使用者明確表示**設計方案確認，可以進入下一階段**
- 使用者表示**目前版本可以接受**

> 每輪修正只改使用者提出的部分，不要自行發散加入未被要求的變更。
