---
description: Initialize project for shipshape-skills — generate CLAUDE.md and project-specific skills structure through interactive questions.
---

# Init Command

為當前專案產生 `CLAUDE.md` 和建議的 skills 目錄結構，讓 shipshape-skills 的工作流能搭配專案的技術棧運作。

## 執行流程

### Step 1：檢查現有設定

先檢查專案現況：

- 讀取 `package.json`（如果存在）— 取得依賴清單
- 檢查 `CLAUDE.md` 是否已存在
- 檢查 `.claude/skills/` 是否已有自訂 skills

如果 `CLAUDE.md` 已存在，告知使用者並詢問要**覆寫**還是**合併補充**。

### Step 2：互動式提問

根據 Step 1 讀到的資訊，**跳過已能從 package.json 推斷的問題**，只問無法自動判斷的部分。

一次只問一個問題，等使用者回答後再問下一個。語氣輕鬆直接。

#### 問題清單（依序，可跳過已知的）

1. **框架** — 「專案用什麼前端框架？」（如果 package.json 已有 vue/react/angular 就跳過，直接確認）
2. **UI 元件庫** — 「有用 UI 元件庫嗎？（Element Plus、Vuetify、Ant Design、shadcn/ui⋯）」
3. **狀態管理** — 「狀態管理用什麼？（Pinia、Vuex、Zustand、Redux⋯）」
4. **CSS 方案** — 「CSS 怎麼處理？（Tailwind、SCSS、CSS Modules、styled-components⋯）」
5. **測試工具** — 「測試用什麼？（Vitest、Jest、Playwright⋯）」
6. **後端/API** — 「有後端嗎？用什麼？（Node.js、Express、Nuxt server、Next.js API routes⋯）」
7. **其他慣例** — 「有什麼專案特有的規範或慣例想讓 AI 知道的？（命名規則、目錄結構、程式碼風格⋯）可以跳過」

如果從 package.json 已經能推斷大部分答案，可以改為確認式提問：

> 我從 package.json 看到你用 Vue 3 + Element Plus + Pinia + Vitest，對嗎？有需要補充的嗎？

### Step 3：產生 CLAUDE.md

根據收集到的資訊，產生 `CLAUDE.md`，放在專案根目錄。

#### CLAUDE.md 結構

```markdown
# 專案名稱

## 技術棧

- 框架：Vue 3 (Composition API)
- UI 元件庫：Element Plus
- 狀態管理：Pinia
- CSS：SCSS + Tailwind
- 測試：Vitest + Playwright
- 建置工具：Vite

## 開發慣例

（根據使用者回答填入，沒有就不寫這段）
```

原則：
- **只寫無法從程式碼推斷的資訊** — 不要重複 `package.json` 已有的版本號
- **簡潔** — 每個項目一行，不需要解釋
- **不要編造** — 使用者沒提到的就不寫

### Step 4：建議 skills 目錄

根據技術棧，建議使用者可以建立的專案 skills：

```
.claude/skills/
├── element-plus/
│   └── SKILL.md       ← 元件用法、表單模式、主題客製
├── project-api/
│   └── SKILL.md       ← API 設計慣例、錯誤處理模式
```

**不要自動建立 skill 檔案**，只列出建議清單並解釋每個 skill 的用途。讓使用者決定要建哪些。

如果使用者同意，再幫忙建立 skill 檔案骨架（只放標題和基本結構，內容由使用者後續填寫或由 AI 在開發過程中逐步補充）。

### Step 5：總結

列出這次產生的檔案和建議：

- ✅ 已建立 `CLAUDE.md`
- 💡 建議的 skills（列出清單）
- 告知使用者可以在開發過程中隨時補充 `CLAUDE.md` 和 skills 的內容
