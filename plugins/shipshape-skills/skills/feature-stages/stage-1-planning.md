---
name: feature-stage-1-planning
description: Stage 1 of feature workflow — Planning with planner agent. Produces implementation plan, file paths, expected behavior, and skip suggestions for all stages.
---

# 階段 1：規劃

## 前置知識檢查（強制）

探索程式碼之前，**必須**先查閱既有知識，避免重複踩坑或違反既有架構：

1. **Cookbook 對照（漸進式披露）**：讀 `docs/cookbook/README.md` → 找到相關模組資料夾 → 讀 `MOC.md` → 讀相關的 `business-rules.md`（業務邏輯）和 `pitfalls.md`（踩坑紀錄）。也檢查 `architecture/MOC.md` 是否有相關的架構決策。
2. **Memory 回饋**：讀取 memory 中的 feedback 記錄，確認是否有與本次開發相關的過往經驗。

將讀到的知識一併傳給 planner subagent，這樣規劃時就能考慮已知的業務規則、陷阱和架構約束。

## 執行規劃

使用 Agent tool 派遣 **planner** subagent（`subagent_type: "shipshape-skills:planner"`）進行功能規劃。在 prompt 中傳入：使用者的需求描述、相關檔案路徑、專案技術棧、**以及前置知識檢查讀到的 cookbook 和 memory 內容**。

planner subagent 負責：
- 釐清需求與邊界條件
- 識別需要修改/新增的檔案
- 評估風險與依賴
- 產出實作計畫，**每個步驟必須具體到檔案路徑、函式名稱、預期行為**（假設執行者對專案一無所知）
- **判斷此功能是否涉及 UI 變更**（若是，下一步進入階段 2；若否，跳過階段 2 直接進入階段 3）

## 跳過建議（強制）

產出實作計畫後，**必須**額外提供跳過建議：

1. 列出所有階段（0~9）
2. 針對每個階段標註 `建議執行` 或 `建議跳過`，並附上理由
3. 等使用者確認哪些階段要執行、哪些要跳過

判斷基準：

| 條件 | 可建議跳過的階段 |
|------|----------------|
| 不涉及 UI 變更 | 階段 2（UI/UX 設計）、階段 6（UIUX 審查） |
| 改動 ≤ 2 個檔案且邏輯明確 | 階段 3（介面設計） |
| 純 UI 調整（無業務邏輯） | 階段 4（單元測試）、階段 7（優化測試） |
| 改動範圍小、手動可驗證 | 階段 8（E2E 測試） |

**不可建議跳過的階段**：階段 1（規劃）、階段 5（實作）、階段 9（Code Review）。

## 計畫品質檢查（No Placeholders）

產出計畫後，自我檢查以下禁止 pattern。有任何一項就重寫該步驟：

**禁止出現的措辭**：
- 「TBD」「待定」「之後再決定」「待確認」
- 「加入適當的錯誤處理」「加入必要的驗證」
- 「依照需求調整」「視情況而定」「根據實際情況」
- 「參考既有模式實作」（沒說是哪個模式、哪個檔案）
- 「類似 XXX 的做法」（沒附具體程式碼路徑）

**每個步驟必須包含**：
- 具體的檔案路徑（不能只說「在 service 層」）
- 具體的函式名稱或元件名稱
- 預期的輸入/輸出或行為描述

產出實作計畫與跳過建議後**暫停**，等使用者確認計畫與要執行的階段。
