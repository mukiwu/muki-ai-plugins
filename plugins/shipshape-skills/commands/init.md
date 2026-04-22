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

### Step 4：建立 Cookbook 目錄

Cookbook（`docs/cookbook/`）用來記錄程式碼看不出來的隱性知識。詢問使用者專案的主要模組或領域，然後建立對應的目錄結構。

#### 提問

> 這個專案有哪些主要模組或功能領域？例如：使用者管理、報表、儀表板、感測器資料⋯⋯
> 我會根據這些幫你建立 cookbook 的目錄結構。

#### 建立結構

根據使用者的回答，建立 `docs/cookbook/` 目錄。用資料夾分層，避免單一檔案過大：

```
docs/cookbook/
├── README.md                    ← 根索引：列出所有模組資料夾
├── architecture/                ← 架構決策
│   ├── MOC.md                   ← 該資料夾的內容索引
│   └── tech-choices.md          ← 技術選型理由（為什麼用 A 不用 B）
├── <module-a>/                  ← 模組 A
│   ├── MOC.md                   ← 該資料夾的內容索引
│   ├── business-rules.md        ← 該模組的業務邏輯、計算規則、流程約束
│   └── pitfalls.md              ← 該模組的踩坑紀錄、注意事項
├── <module-b>/                  ← 模組 B
│   ├── MOC.md
│   ├── business-rules.md
│   └── pitfalls.md
└── ...
```

**分層原則**：
- `architecture/` 固定建立，放跨模組的架構決策
- 每個模組一個資料夾，內部依內容類型拆檔案
- 每個資料夾都有 `MOC.md`（Map of Content），列出該資料夾所有檔案及一句話摘要
- 模組內檔案太大時可以再拆（例如 `dashboard/charts.md`、`dashboard/filters.md`）
- 跨模組的業務邏輯放在最相關的模組資料夾，或建立 `shared/` 資料夾

**漸進式披露**：AI 查找 cookbook 時按三層逐步深入，不一次讀全部：
1. **README.md** → 找到相關模組資料夾
2. **`<module>/MOC.md`** → 找到該模組的相關檔案
3. **具體檔案** → 只讀需要的內容

**README.md 格式**：

```markdown
# Cookbook

本目錄記錄程式碼、型別、測試、import 關係看不出來的隱性知識。

## 模組索引

| 資料夾 | 說明 |
|--------|------|
| `architecture/` | 技術選型理由、架構決策的 why |
| `<module-a>/` | ○○模組的業務邏輯與踩坑紀錄 |
| `<module-b>/` | △△模組的業務邏輯與踩坑紀錄 |

查找方式：先讀此檔 → 進入相關模組資料夾 → 讀 MOC.md → 讀需要的檔案。
```

**MOC.md 格式**：

```markdown
# <模組名稱> — Map of Content

| 檔案 | 內容摘要 |
|------|---------|
| `business-rules.md` | ○○的計算規則、狀態轉換條件 |
| `pitfalls.md` | △△ API 的參數陷阱、□□元件的 race condition |
```

每個模組檔案建立時只放基本骨架：

```markdown
# <模組名稱> — 業務邏輯

（開發過程中逐步補充）
```

```markdown
# <模組名稱> — 踩坑紀錄

（開發過程中逐步補充）
```

`architecture/` 固定建立，模組資料夾根據使用者回答建立。

### Step 5：建議 skills 目錄

**先判斷 cookbook 還是 skill**：大部分專案知識應該放 cookbook，不是 skill。分界線：

| 放 Cookbook | 放 Skill |
|------------|----------|
| 「這東西怎麼運作、為什麼這樣做、有什麼坑」 | 「AI 遇到某種任務時要怎麼執行」 |
| 知識、規則、陷阱、慣例 | 操作流程、步驟指引 |
| 例：WebSocket 重連策略、ECharts 封裝慣例、認證流程、API 設計慣例 | 例：Element Plus 元件寫法指引（因為每次寫元件都要遵循的操作流程） |

**判斷原則**：如果這份內容是「讀一次就知道了，之後靠記憶」→ cookbook。如果是「每次執行某類任務都要按步驟走」→ skill。模糊時優先放 cookbook，因為 cookbook 已經有自動讀取機制（stage-5 前置檢查會讀）。

根據技術棧，建議使用者可以建立的專案 skills（**只建議真正需要操作流程的**）：

```
.claude/skills/
├── element-plus/
│   └── SKILL.md       ← 元件用法、表單模式、主題客製（每次寫元件都要遵循）
```

**不要自動建立 skill 檔案**，只列出建議清單並解釋每個 skill 的用途。讓使用者決定要建哪些。

如果使用者同意，再幫忙建立 skill 檔案骨架（只放標題和基本結構，內容由使用者後續填寫或由 AI 在開發過程中逐步補充）。

**常見誤判**：以下這些通常應該放 cookbook 而非 skill：
- 第三方 library 的封裝慣例（ECharts、Univer.js 等）→ `docs/cookbook/<module>/` 或 `docs/cookbook/architecture/`
- API 設計慣例、Axios 攔截器模式 → `docs/cookbook/architecture/api-patterns.md`
- 認證流程、token 管理 → `docs/cookbook/architecture/auth.md`
- WebSocket 連線管理 → `docs/cookbook/architecture/websocket.md`

### Step 6：總結

列出這次產生的檔案和建議：

- ✅ 已建立 `CLAUDE.md`
- ✅ 已建立 `docs/cookbook/` 目錄結構
- 💡 建議的 skills（列出清單）
- 告知使用者 cookbook 會在開發過程中自動補充（bug 修復、feature 開發時都會觸發寫入評估）
