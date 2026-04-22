---
description: Full development workflow for new features — 10 stages from brainstorming to code review. Use when the user wants to build a new feature, add functionality, or implement a user story. Each stage has its own detailed skill file.
---

# 新功能開發流程

依序執行以下階段。**每個階段的詳細說明在 `skills/feature-stages/` 目錄中，執行到該階段時讀取對應的檔案。**

## 強制：執行前列出所有階段

開始 /feature 時，**必須**先列出以下所有階段，讓使用者確認要執行哪些：

| 階段 | 名稱 | Skill / Agent | 可跳過 | 詳細說明 |
|------|------|---------------|--------|---------|
| 0 | 需求釐清 | — | ✅ 需求已明確 | `feature-stages/stage-0-brainstorm.md` |
| 1 | 規劃 | `planner` agent | ❌ | `feature-stages/stage-1-planning.md` |
| 2 | UI/UX 設計 | `frontend-design` skill | ✅ 不涉及 UI | `feature-stages/stage-2-uiux-design.md` |
| 3 | 介面設計 | `tdd-guide` agent | ✅ ≤ 2 檔案 | `feature-stages/stage-3-interface.md` |
| 4 | 寫測試 | `tdd-guide` agent | ✅ 純 UI | `feature-stages/stage-4-tests.md` |
| 5 | 實作 + 重構 | — | ❌ | `feature-stages/stage-5-implement.md` |
| 6 | UIUX 審查 | `visual-reviewer` / `uiux-reviewer` | ✅ 不涉及 UI | `feature-stages/stage-6-uiux-review.md` |
| 7 | 優化測試 | `auto-improve-tests` skill | ✅ 純 UI | `feature-stages/stage-7-improve-tests.md` |
| 8 | E2E 測試 | `e2e-runner` agent | ✅ 範圍小 | `feature-stages/stage-8-e2e.md` |
| 9 | Code Review | `code-reviewer` agent | ❌ | `feature-stages/stage-9-code-review.md` |

## 執行規則

1. **進入每個階段時，讀取對應的 stage 檔案**，按照裡面的指示執行
2. 每個階段完成後**暫停等待使用者確認**再進入下一階段
3. 階段 1 完成後提供**跳過建議**（詳見 stage-1-planning.md）
4. **不可建議跳過的階段**：階段 1（規劃）、階段 5（實作）、階段 9（Code Review）

## 回饋收斂（貫穿全流程）

**任何階段**中，當使用者糾正做法或提出回饋時，**必須**在修正後：

1. **判斷是否可泛化**：這個回饋只適用於當前情境，還是未來也會遇到？
2. **若可泛化**：立即寫入 memory（feedback 類型），包含規則、原因（Why）、適用時機（How to apply）
3. **若涉及業務邏輯或架構決策**：考慮是否需要更新 `docs/cookbook/`。判準見 CLAUDE.md「品質關卡 → Cookbook 同步」的三問規則
4. **回報使用者**：簡要說明已記錄的內容

> 不要等到流程結束才收斂。使用者提出回饋的當下就是最佳記錄時機。

## Cookbook 寫入時機（貫穿全流程）

開發新功能時，以下時機評估是否需要寫入 cookbook（判準見 CLAUDE.md「品質關卡 → Cookbook 同步」）：

- **使用者提供規格書時**：使用者上傳文件（PDF、圖片）或貼連結要求閱讀規格書時，除了分析規格內容，主動判斷哪些業務邏輯、計算規則、流程約束是程式碼看不出 why 的，摘錄到 cookbook
- **階段 0-1**：使用者口頭說明業務邏輯或規格時，如果這些規則**程式碼看不出 why**，記錄到 cookbook
- **階段 5**：實作過程中發現外部 library 的坑、隱性耦合、或非直覺的行為，記錄到 cookbook
- **階段 9**：Code review 發現架構決策需要留下 why，記錄到 cookbook
