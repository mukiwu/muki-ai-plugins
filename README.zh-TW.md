# shipshape-skills

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的紀律化開發工作流 plugin。靈感來自 [obra/superpowers](https://github.com/obra/superpowers)。

## 安裝

```bash
/plugin marketplace add mukiwu/shipshape-skills
/plugin install shipshape-skills
```

## 包含什麼

### Skills

| Skill | 說明 |
|-------|------|
| `auto-improve-tests` | 迭代審查並優化單元測試，直到品質分數 >= 9.2 |
| `bug-learning` | 修完 bug 後，自動判斷根因是否需要沉澱到 cookbook、memory 或 workflow |
| `coding-standards` | TypeScript/JavaScript 程式碼標準與最佳實踐 |
| `e2e-testing` | Playwright E2E 測試模式 — POM、flaky test 處理、CI/CD、artifact 管理 |
| `react-patterns` | React Hooks、Custom Hooks、Zustand、效能優化、常見反模式 |
| `vue-patterns` | Vue 3 Composition API、Pinia、composables、效能優化、常見反模式 |

### Commands

| 指令 | 說明 |
|------|------|
| `/feature` | 完整開發流程：需求釐清 → 規劃 → TDD → 實作 → Code Review |
| `/tdd` | 測試驅動開發：先定義介面、先寫測試、再實作 |
| `/plan` | 產出實作計畫，含風險評估與步驟拆解 |
| `/build-fix` | 診斷並修復建置/型別錯誤 |
| `/e2e` | 產生並執行 Playwright E2E 測試 |

### Agents

| Agent | 說明 |
|-------|------|
| `code-reviewer` | 兩階段審查：先確認規格符合性，再看程式碼品質 |
| `tdd-guide` | TDD 教練，含理性化預防（反駁跳過測試的藉口） |
| `planner` | 功能規劃，將任務拆解為可獨立執行的原子步驟 |
| `build-error-resolver` | 建置與 TypeScript 型別錯誤修復 |
| `e2e-runner` | E2E 測試產生、執行與 flaky test 管理 |

## `/feature` 工作流

核心的開發流程遵循紀律化的循環：

```
階段 0：需求釐清（蘇格拉底式提問、YAGNI 原則）
階段 1：規劃（原子步驟、具體到檔案路徑與預期行為）
階段 2：UI/UX 設計（產出 3 個方案，可選）
階段 3：介面設計（TypeScript 型別、函式簽名）
階段 4：寫測試（TDD Red，含理性化預防）
階段 5：實作（TDD Green，驗證無 regression）
階段 5.5：重構（改善結構但不改變行為）
階段 6：優化測試（迭代至 >= 9.2 分）
階段 7：E2E 測試（Playwright，可選）
階段 8：Code Review（兩階段：規格符合性 → 程式碼品質）
```

每個階段完成後暫停等待使用者確認。規劃完成後會列出跳過建議，由使用者決定哪些階段要執行。

## 核心原則

借鏡 [obra/superpowers](https://github.com/obra/superpowers) 方法論：

- **沒有失敗的測試就不能寫 production code** — 先寫了 code 再補測試？刪掉重來。
- **完成前必須驗證** — 「應該可以」不是驗證。執行指令、讀完輸出、確認結果。
- **理性化預防** — TDD 階段列出常見的跳過測試藉口，並逐一反駁。
- **兩階段 Code Review** — 先確認方向對（規格符合性），再談品質。不要花時間打磨不該存在的 code。
- **Mock 三鐵律** — 不測 mock 行為、不在 production code 加 test-only method、mock 前先理解依賴。

## 客製化

shipshape-skills 提供通用的工作流。專案特定的需求這樣處理：

1. 安裝 shipshape-skills 作為基礎
2. 在專案的 `.claude/skills/` 目錄加入專案專屬的 skills（會覆寫 shipshape 的同名 skill）
3. 在 `CLAUDE.md` 定義專案規範 — agents 會自動參考

例如：專案用 Element Plus，就在專案的 `.claude/skills/element-plus/SKILL.md` 建立專屬指引。shipshape 的 `/feature` 指令會搭配專案的 skills 一起運作。

## 授權

MIT
