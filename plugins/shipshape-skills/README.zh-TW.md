# shipshape-skills

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的紀律化開發工作流 plugin。靈感來自 [obra/superpowers](https://github.com/obra/superpowers) 和 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)。

## 安裝

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install shipshape-skills
```

## 開始使用

安裝後建議先執行 `/init`，讓 shipshape 認識你的專案：

```bash
/shipshape-skills:init
```

它會讀取 `package.json` 推斷技術棧，問幾個問題，然後幫你產生 `CLAUDE.md` 和專案專屬的 skills。以下是一個實際案例：

### 範例：React + Ant Design 專案

**AI 自動偵測技術棧，只問它無法推斷的問題：**

```
⏺ 從 package.json 看到你用的是：
  - React 18 + React Router 6
  - Ant Design 5 + @ant-design/icons
  - Tailwind CSS + Emotion
  - ECharts 5、Axios、Vite、Day.js

  沒有看到測試框架的依賴。
  第一個問題：測試用什麼？（Vitest、Jest、Playwright⋯還是目前沒有測試？）

❯ 目前沒有寫測試

⏺ 有什麼專案特有的規範或慣例想讓 AI 知道的？（可以跳過）

❯ 目前沒有
```

**產生 `CLAUDE.md`（專案總覽）：**

```markdown
# my-project

## 技術棧

- 框架：React 18
- UI 元件庫：Ant Design 5
- CSS：Tailwind CSS + Emotion
- 圖表：ECharts 5
- HTTP：Axios
- 建置工具：Vite
...
```

**建議並建立專案 skills：**

```
.claude/skills/
├── antd-patterns/
│   └── SKILL.md       ← antd 5 元件用法、Table/Form 模式、樣式覆寫策略
├── project-api/
│   └── SKILL.md       ← Axios interceptor 慣例、token refresh、錯誤處理
```

初始化完成後，執行 `/feature` 開發新功能時就會自動參考這些專案知識。

## 客製化

shipshape-skills 的流程是通用的，不綁定特定框架。你可以透過專案的 `CLAUDE.md` 和額外的 skills 讓流程具備框架知識。

假設你的專案用 **Element Plus**：

```
你的專案/
├── .claude/
│   ├── CLAUDE.md          ← 寫「本專案使用 Element Plus + Vue 3」
│   └── skills/
│       └── element-plus/
│           └── SKILL.md   ← Element Plus 元件用法、命名慣例等
```

這樣執行 `/feature` 時，shipshape 會在通用流程中自動參考這些專案知識，產出的程式碼就會使用正確的框架元件。如果專案的 skill 和 shipshape 內建的同名，**專案版本優先**。

不知道 `CLAUDE.md` 怎麼寫？執行 `/init`，它會讀取 `package.json`、問幾個問題，自動幫你產生。

## `/feature` 工作流

核心的開發流程遵循紀律化的循環：

| 階段 | 說明 | 觸發的 Skill / Agent | 可跳過 |
|------|------|---------------------|--------|
| 0 | 需求釐清 — 蘇格拉底式提問、YAGNI 原則 | — | ✅ 需求已明確 |
| 1 | 規劃 — 原子步驟、具體到檔案路徑與預期行為 | `planner` agent | ❌ |
| 2 | UI/UX 設計 — 產出 3 個方案，迭代修正至確認 | `frontend-design` skill* | ✅ 不涉及 UI |
| 3 | 介面設計 — TypeScript 型別、函式簽名 | `tdd-guide` agent | ✅ ≤ 2 個檔案、邏輯明確 |
| 4 | 寫測試 — TDD Red，含理性化預防 | `tdd-guide` agent | ✅ 純 UI、無業務邏輯 |
| 5 | 實作 — TDD Green，驗證無 regression | — | ❌ |
| 5.5 | 重構 — 改善結構但不改變行為 | — | ✅ 無需重構 |
| 6 | UIUX 審查 — Figma 像素比對或 AI 視覺檢查 | `visual-reviewer` / `uiux-reviewer` agent** | ✅ 不涉及 UI |
| 7 | 優化測試 — 迭代至 >= 9.2 分 | `auto-improve-tests` skill | ✅ 純 UI、無業務邏輯 |
| 8 | E2E 測試 — Playwright | `e2e-runner` agent | ✅ 改動範圍小、手動可驗證 |
| 9 | Code Review — 規格符合性 → 程式碼品質，迭代修正 | `code-reviewer` agent | ❌ |

*`frontend-design` 是獨立的 plugin，不包含在 shipshape-skills 中。

**階段 6 支援兩種模式：(A) 當 [`figma-visual-reviewer`](../figma-visual-reviewer/) plugin 已安裝且有 Figma 設計稿時，使用像素級比對；(B) 當 `claude-in-chrome` 可用時，使用 AI 視覺審查。自動選擇最佳可用模式。

每個階段完成後暫停等待使用者確認。階段 1 完成後會列出跳過建議，由使用者決定哪些階段要執行。

## 包含什麼

### Skills

| Skill | 說明 |
|-------|------|
| `auto-improve-tests` | 迭代審查並優化單元測試，直到品質分數 >= 9.2 |
| `bug-learning` | 修完 bug 後，自動判斷根因是否需要沉澱到 cookbook、memory 或 workflow |
| `coding-standards` | 框架無關的程式碼標準（命名、型別、錯誤處理、API 設計）。框架相關的指引會導向 `react-patterns` 或 `vue-patterns` |
| `deps-check` | 編輯共用檔案前列出誰 import 我，避免「改 A 壞 B」回歸。目前僅支援 TypeScript / JavaScript |
| `e2e-testing` | Playwright E2E 測試模式 — POM、flaky test 處理、CI/CD、artifact 管理 |
| `react-patterns` | React Hooks、Custom Hooks、Zustand、效能優化、常見反模式 |
| `vue-patterns` | Vue 3 Composition API、Pinia、composables、效能優化、常見反模式 |

### Commands

| 指令 | 說明 |
|------|------|
| `/init` | 互動式專案設定 — 產生 `CLAUDE.md` 並建議專案專屬 skills |
| `/feature` | 完整開發流程：需求釐清 → 規劃 → TDD → 實作 → Code Review |
| `/tdd` | 測試驅動開發：先定義介面、先寫測試、再實作 |
| `/plan` | 產出實作計畫，含風險評估與步驟拆解 |
| `/build-fix` | 診斷並修復建置/型別錯誤 |
| `/e2e` | 產生並執行 Playwright E2E 測試 |

### Agents

| Agent | 說明 |
|-------|------|
| `code-reviewer` | 兩階段審查：先確認規格符合性，再看程式碼品質 |
| `uiux-reviewer` | 透過 claude-in-chrome 以真實使用者視角審查 Web 介面 — 評估版面配置、文字可讀性、視覺層級與規格符合度 |
| `tdd-guide` | TDD 教練，含理性化預防（反駁跳過測試的藉口） |
| `planner` | 功能規劃，將任務拆解為可獨立執行的原子步驟 |
| `build-error-resolver` | 建置與 TypeScript 型別錯誤修復 |
| `e2e-runner` | E2E 測試產生、執行與 flaky test 管理 |

### Hooks

| Hook 事件 | 階段 | 作用 |
|-----------|------|------|
| `PreToolUse` (Edit\|Write) | 寫程式碼之前 | 阻斷編輯，直到確認已閱讀 `docs/cookbook/` 和 memory feedback |
| `Stop` | Claude 完成回覆時 | 偵測是否有修 bug，提醒執行 bug-learning 流程沉澱到 cookbook/memory |
| `TaskCompleted` | 任務完成時 | 用 AI 判斷是否值得記錄到 cookbook 或 memory |
| `PreToolUse` (stage-5, once) | 實作階段第一次寫 code | Agent 驗證是否已閱讀 cookbook 和 memory |

## 怎麼使用

不需要記指令名稱，用自然語言描述你想做的事，shipshape 會自動啟動對應的流程。

### 開發新功能

| 你說的話 | 觸發什麼 |
|---------|---------|
| 「加一個深色模式切換」 | `/feature` — 完整流程，從需求釐清到 code review |
| 「我想做一個新的儀表板」 | `/feature` — 先用蘇格拉底式提問釐清需求 |
| 「加一個簡單的 util 函式」 | `/feature` — 建議跳過 UI/UX 和 E2E 階段 |

### 測試

| 你說的話 | 觸發什麼 |
|---------|---------|
| 「幫 UserService 寫測試」 | `/tdd` — 先定義介面、先寫測試、再實作 |
| 「改善這個檔案的測試品質」 | `auto-improve-tests` — 迭代優化至 >= 9.2 分 |
| 「測試登入流程的 E2E」 | `/e2e` — 產生 Playwright 測試，使用 POM 模式 |

### 規劃與審查

| 你說的話 | 觸發什麼 |
|---------|---------|
| 「規劃 auth 模組的重構」 | `/plan` — 原子步驟拆解，含風險評估 |
| 「幫我 review 改動」 | `code-reviewer` — 兩階段審查（規格符合性 → 程式碼品質） |
| 「build 壞了」 | `/build-fix` — 診斷並修復建置/型別錯誤 |

### 修 Bug

| 你說的話 | 觸發什麼 |
|---------|---------|
| 「這裡壞了」「發現 bug」「這個不對」 | `bug-learning` — 修復後自動判斷根因要沉澱到哪裡 |

### 小提示

- **描述越具體越好** — 「在 header 加一個按鈕」會觸發 `/feature` 並建議跳過較重的階段。
- **明確提到測試** — 「幫 X 寫測試」會直接觸發 `/tdd`，不走完整的 `/feature` 流程。
- **也可以直接用指令** — `/feature`、`/tdd`、`/plan`、`/e2e`、`/build-fix` 都能作為斜線指令使用。

## 核心原則

借鏡 [obra/superpowers](https://github.com/obra/superpowers) 方法論：

- **沒有失敗的測試就不能寫 production code** — 先寫了 code 再補測試？刪掉重來。
- **完成前必須驗證** — 「應該可以」不是驗證。執行指令、讀完輸出、確認結果。
- **理性化預防** — TDD 階段列出常見的跳過測試藉口，並逐一反駁。
- **兩階段 Code Review** — 先確認方向對（規格符合性），再談品質。不要花時間打磨不該存在的 code。
- **Mock 三鐵律** — 不測 mock 行為、不在 production code 加 test-only method、mock 前先理解依賴。

## 授權

MIT
