---
name: feature-stage-6-uiux-review
description: Stage 6 of feature workflow — UIUX review with two modes. Mode A uses figma-visual-reviewer for pixel-level Figma comparison. Mode B uses uiux-reviewer for AI visual inspection via claude-in-chrome. Automatically selects best available mode.
---

# 階段 6：UIUX 審查（涉及畫面變更時）

> 跳過條件：功能不涉及 UI 變更（純邏輯、API 串接、資料處理等）

本階段有兩種審查模式，依可用工具自動選擇。

## 模式判斷（強制）

按以下優先順序檢查，使用第一個可用的模式：

| 優先順序 | 模式 | 條件 | 審查方式 |
|---------|------|------|---------|
| 1 | **Figma 比對模式** | `figma-visual-reviewer` plugin 已安裝 + 有 Figma 設計稿 | 像素級比對 + AI 視覺判斷 |
| 2 | **視覺審查模式** | `claude-in-chrome` MCP 可用 | AI 五維度視覺審查 |
| 3 | **跳過** | 以上都不可用 | 告知使用者原因，直接進入下一階段 |

## 模式 A：Figma 比對（figma-visual-reviewer）

當 `figma-visual-reviewer` plugin 已安裝，且對話 context 中有 Figma URL 或使用者提供設計稿截圖時：

1. 使用 Agent tool 派遣 `visual-reviewer` subagent（`subagent_type: "figma-visual-reviewer:visual-reviewer"`），傳入 Figma URL 和目標網頁 URL
2. subagent 會自動：導出 Figma 設計稿 → Playwright 截網頁 → 像素 diff → AI 判斷差異類型
3. 產出差異報告（含 diff 視覺化圖 + HTML 報告）

判定標準：
- **PASS**：差異 < 5%，無 Bug 類型差異
- **WARNING**：差異 5-15%，或有 LOW/MEDIUM Bug → 進入修正循環
- **BLOCK**：差異 > 15%，或有 HIGH/CRITICAL Bug → 必須修正

## 模式 B：視覺審查（uiux-reviewer）

當沒有 Figma 設計稿，但 `claude-in-chrome` 可用時：

1. 使用 Agent tool 派遣 **uiux-reviewer** subagent（`subagent_type: "shipshape-skills:uiux-reviewer"`），傳入目標 URL 和功能規格
2. subagent 用 claude-in-chrome 實際開瀏覽器查看頁面
3. 進行五維度審查（視覺層級、文字與可讀性、版面配置、操作直覺、規格符合度）

## 迭代修正循環（兩種模式共用）

審查結果出來後，進入修正循環：

1. **審查** — 產出審查報告（diff 報告或五維度報告）
2. **修正** — 根據報告中的 CRITICAL 和 HIGH 問題修改程式碼
3. **驗證** — 修改後再次執行審查確認問題已解決
4. **重複** — 若仍有 CRITICAL 或 HIGH 問題，回到步驟 2 繼續修正

循環結束條件（滿足任一即可）：
- 審查判定為 **PASS**（無 CRITICAL 或 HIGH 問題）
- 使用者明確表示**目前版本可以接受**

> 每輪修正後都要執行 `npx vitest run` 確認測試仍然通過，避免 UI 修正引入 regression。

完成後**暫停**，向使用者展示最終審查結果，確認後進入下一階段。
