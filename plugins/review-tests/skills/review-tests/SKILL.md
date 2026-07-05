---
name: review-tests
description: 測試體檢診斷器（test review / audit existing tests / find test blind spots）——讀一份既有測試，找出盲點與建議，產出一份 self-contained HTML 報告（不修改任何 source／測試／設定）。報告每條 finding 帶嚴重度，可 toggle 展開被測 source 的關鍵幾行。只診斷不寫測試：要補測試或自動改善測試，請改走 tdd 或你的測試改善 skill。
---

# 測試體檢診斷器 (Review Tests)

## 定位

純診斷工具。讀一份既有測試，找出盲點、列出建議，**產出一份 HTML 報告**。

這個 skill 不寫測試、不改測試、不碰 source 與設定。它只負責「指出問題」並把結果呈現成報告，要不要補、怎麼補，由使用者決定。

## 三條硬規則（最優先）

1. **只診斷，不改既有檔案**：不修改任何 source、測試檔或設定檔。唯一允許的寫入是**產生一份新的 HTML 報告檔**到 `.review-tests/`。
2. **補測試走 `tdd`**：報告列出的缺漏，請使用者改用 `tdd` skill 一次一個 red-green 補上，不要在這裡批次補。
3. **只列行為層級盲點**：建議的測試一律用「應該驗證什麼行為」描述。嚴禁為了衝覆蓋率而建議貼著實作細節的測試——那種測試會在 refactor 時誤報，違反 tdd「測行為不測實作」的原則。

## 語言與輸出規範

- 報告內容使用繁體中文（台灣用語）。
- 技術術語保留英文，例如 Vitest、TypeScript、mock、coverage。
- 程式碼區塊、檔案名稱、identifier 嚴禁修改或翻譯。
- **用邏輯通順的中文表達，不要逐字英翻中**：保留 function 名、API 欄位、enum 值等專有名詞的英文原文，但句子要自然、讓使用者一看就懂，重點放在「為什麼是問題」，不要堆術語或生硬直譯。

## 輸入

- **無參數**：詢問使用者目標檔案路徑。
- **指定檔案**：`review-tests <path>`。可給測試檔，或給 source 檔由本工具找出對應的測試檔。

## 流程

1. **定位測試與 source**：讀取目標。若給的是 source 檔，找出對應測試檔；若給測試檔，找出它 import 的 source 檔。若找不到測試檔，回報「尚無測試」並建議改走 `tdd` 從頭建立，流程結束。
2. **檢查**：對照下方五類維度，逐項檢視測試內容，產出 findings，並為每條標嚴重度（`high`＝會產生假綠燈或掩蓋真 bug、`med`＝驗證力不足、`low`＝可讀性與慣例）。
3. **定位關鍵 source 片段**：為**每一條 finding** 找出被測的那個 source 函式（不是 spec 裡的 test，語言不限 TS），記下：函式名稱、source 檔路徑、以及**與這條 finding 真正相關的關鍵行範圍**（通常 3～8 行，不是整個 function——展整個 function 重點會被淹沒、不好找）。
4. **產生 HTML 報告**：依下方規格寫出單檔 HTML 到 `.review-tests/`，自動開啟。
5. 結束。不補測試、不改任何既有檔案。

## 五類檢查維度

每一條發現都要標到**具體的測試檔行號或測試描述**，並對應到一個 source function。

### 1. 斷言有效性 (Assertion Validity)
- 無意義斷言，例如 `expect(true).toBe(true)`。
- 只為了增加覆蓋率而存在、沒有實質驗證的測試。
- 只用 `toBeDefined()` 帶過、沒有檢查具體內容的斷言。
- 註解已算出精確預期值、斷言卻只用 `toBeGreaterThan(0)` 這種偏弱斷言。
- error 斷言不夠力：`toThrow()` 沒驗錯誤型別或訊息，或 try/catch 把失敗吞掉。
- 巨大 snapshot（`toMatchSnapshot()`）沒人看得完＝實質上沒有斷言。

### 2. 行為盲點 (Behavior Gaps)
用「行為」角度列出缺漏，描述成「應該驗證 X 行為」，**不是**列覆蓋率數字：
- 缺少 happy path / edge case / 邊界條件。
- 缺少 error handling、異常路徑、null / undefined 處理。
- 重要的邏輯分支（if/else、switch）沒有對應的行為驗證。
- 參數組合（如不同 enum 值、不同模式）覆蓋不全。

### 3. Mock 健康度 (Mock Health)
- 過度 mock，把該測的真實路徑都 mock 掉了。
- mock 資料不符合實際的 TypeScript interface 定義。
- 斷言貼著實作：驗 spy 被呼叫幾次、內部呼叫順序，而不是驗最終行為——這種測試 refactor 一動就誤報。

### 4. 測試結構 (Structure)
- 是否遵守 AAA（Arrange, Act, Assert）。
- 測試描述是否清楚表達預期行為。
- 是否正確清理測試副作用。
- 測試間隔離：module 層級的可變狀態有沒有在 `beforeEach` 重設，會不會因執行順序互相污染。

### 5. 非決定性與 async 正確性 (Determinism & Async)
這類問題會產生**假綠燈**——測試過了但什麼都沒驗到，價值最高、也最容易漏：
- 漏掉 `await` 的斷言：async 斷言沒等到就結束，永遠 pass。
- 沒 return / 沒 await 的 promise，rejection 被吞掉。
- fake timers 用完沒還原，污染後面的測試。
- 依賴 `Date.now()`、`Math.random()`、時區、執行順序等非決定性來源。
- 測試真的打網路或碰真實外部服務。

## HTML 報告規格

報告由 skill 目錄下的固定生成器 `render.cjs` 產出。agent **只負責產 findings 資料，不要手刻 HTML**——escape、語法高亮、排版、backlink toggle 全部由生成器內建，手刻容易在 source 片段的 `<` `>` `&` 上出錯。

### 執行步驟

1. 把分析結果寫成一份 findings JSON（schema 見下），存到暫存路徑，例如 `/tmp/<name>-findings.json`。
2. 在**專案根**執行：`node "<本 skill 目錄>/render.cjs" /tmp/<name>-findings.json`
   - cwd 必須是專案根，JSON 裡的 source／test 路徑以此為基準。
   - 生成器會印出產出的 HTML 絕對路徑。
3. 自動開啟：macOS `open <路徑>`、Linux `xdg-open <路徑>`、Windows `cmd /c start "" <路徑>`。
4. 終端只印一行：HTML 路徑 + 一句健康度摘要。完整內容都在 HTML，不要在終端重印整份報告。（`.review-tests/` 的 `.gitignore` 由生成器自動放好，報告不會被 commit，不用另外提醒。）

### findings JSON schema

```json
{
  "testFile":   "src/.../x.spec.ts",
  "sourceFile": "src/.../x.ts",
  "health":     { "level": "良好｜及格｜待補強", "summary": "一句話總評" },
  "sections":   [
    { "title": "斷言有效性", "findings": [
      { "desc": "通順中文，保留專有名詞",
        "loc": "spec 行 …",
        "level": "high｜med｜low（選填，預設 med）",
        "src": { "fn": "fnName", "file": "(選填，預設 sourceFile)", "from": 297, "to": 300, "lang": "(選填，預設依副檔名)" } } ] },
    { "title": "Mock 健康度", "clean": "無問題……" }
  ],
  "suggestions": [ "應該驗證 …" ]
}
```

- `level`：嚴重度。`high`＝假綠燈／掩蓋真 bug，`med`＝驗證力不足，`low`＝可讀性與慣例。生成器會依嚴重度排序並上色，讓使用者知道先修哪個。
- `src`：該 finding 的 backlink 定位。`fn` 是 function 名（toggle 標題用）；`from`–`to` 是要展開的**關鍵行範圍**。`file` 選填，跨檔時才填（例如 `.vue` 用到的 composable 在另一支 `.ts`）。`lang` 選填：預設依副檔名判斷，TS 家族（ts/tsx/js/jsx/vue）套語法高亮，其他語言純文字等寬顯示。
- **只放關鍵幾行，不要整個 function**：擷取真正跟這條 finding 有關的那段邏輯（通常 3～8 行）。展開一整個 function 會讓使用者還要在裡面找重點。展開的是**被測的業務程式**，不是 spec。
- **文字用通順中文，不要逐字直譯**：`desc`／`suggestion`／`summary` 要讀起來自然、講清楚「為什麼是問題」，保留專有名詞英文原文。只支援 `` `code` `` 與 `**bold**` 標記，不要寫原始 HTML（生成器會 escape）。
- `clean` 與 `findings` 二選一：某類無問題就給 `clean` 字串，不硬湊 findings。
- `suggestions` 沒東西就給空陣列，生成器會整張略過，不會掛一張空卡。

### 生成器內建（不需 agent 操心，對齊 html-effectiveness）

- 單檔 HTML、CSS／JS 全 inline、零外部依賴。
- 淺色中性精緻風、健康度 badge（良好綠／及格黃／待補強紅）。
- 每條 finding 的 backlink `<details>` toggle、輕量語法高亮（DOM 建構、不用 innerHTML）、source 片段自動 escape。

## 注意事項

1. **不改既有 code**：唯一寫入是新增 HTML 報告檔。任何 source／測試／設定都不動。
2. **不給數字分數**：只給定性的健康度標示。數字自評不可靠，不當門檻。
3. **測試框架**：主要針對 Vue 3 + TypeScript + Vitest；五類維度是框架無關的原則，Jest／Playwright／pytest 等一樣適用。source 片段只有 TS 家族會套語法高亮，其他語言純文字顯示。

---

## 執行

請提供目標檔案路徑，我將開始體檢、產生 HTML 報告並自動開啟。
