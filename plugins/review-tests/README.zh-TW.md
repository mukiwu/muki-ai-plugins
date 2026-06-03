# review-tests

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的測試體檢 plugin。它讀一份既有測試、找出盲點，產出一份 self-contained 的 HTML 報告——全程不碰你的任何程式碼。

它是**診斷工具，不是修復工具**。它只負責指出缺口，要補什麼由你決定，補的時候走 TDD。

## 安裝

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install review-tests
```

## 快速開始

指定一份測試檔（或給 source 檔，它會自己找對應測試）：

```
review-tests src/utils/foo.spec.ts
```

也可以直接用白話講：「幫我體檢 foo 的測試」。它分析完測試後，會自動在瀏覽器打開 HTML 報告。

## 檢查什麼

| 維度 | 看的東西 |
|------|---------|
| **斷言有效性** | 無意義斷言、只為覆蓋率而存在的測試、只用 `toBeDefined()` 帶過、註解算出了精確值卻只斷言 `> 0` |
| **行為盲點** | 缺少 happy path／edge case／error handling／null 處理、沒測到的分支、覆蓋不全的參數組合 |
| **Mock 健康度** | 過度 mock 把真實路徑都遮掉、mock 資料不符 TypeScript interface |
| **測試結構** | AAA（Arrange-Act-Assert）、測試描述是否清楚、副作用是否清理 |

## 報告長怎樣

一份單檔、self-contained 的 HTML（CSS／JS 全 inline、零外部依賴），寫到 `.review-tests/` 並自動打開：

- 一個健康度 badge（良好／及格／待補強）加一句總評。
- findings 依四個維度分組，每條都標到測試的行號。
- **Backlink** — 每條 finding 都有一個 toggle，展開後是被測 source function 的**關鍵幾行**（不是整個 function），含語法高亮與 source 路徑、行號範圍。

記得把 `.review-tests/` 加進 `.gitignore`，報告才不會被 commit 進專案。

## 它遵守的三條規則

1. **只診斷**：不修改你的 source、測試或設定。唯一寫入的就是那份 HTML 報告。
2. **補測試走 TDD**：它找到的缺口，請一次一個 red-green 補上，不要批次生成。
3. **只到行為層級**：它建議的是「該驗證什麼行為」，不會給貼著實作細節、refactor 就壞掉的測試。

## 測試框架

主要針對 Vue 3 + TypeScript + Vitest，其他框架可比照相同原則。

## 系統需求

- Node.js（報告生成器 `render.cjs` 需要）

## 授權

MIT
