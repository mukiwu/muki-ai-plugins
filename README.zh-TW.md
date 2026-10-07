# muki-ai-plugins

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin marketplace — 視覺回歸測試、測試體檢、專案知識記錄、AI session 回顧，與 Jev 網頁搜尋。

## Plugins

| Plugin | 說明 |
|--------|------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | 視覺回歸測試 — 比對 Figma 設計稿與實際網頁 |
| [review-tests](plugins/review-tests/) | 測試體檢 — 找出測試盲點，產出 self-contained 的 HTML 報告 |
| [lore](plugins/lore/) | 專案 lore — 建立、查閱、記錄、守門、維護、體檢程式碼講不出來的隱性知識，並對齊團隊的通用語言 |
| [session-review](plugins/session-review/) | AI session 回顧：把專案裡所有 Claude Code 與 Codex 對話整理成互動報告，看你怎麼跟 AI 協作、哪些流程值得做成 skill |
| [jev-search](https://github.com/mukiwu/jev-search-mcp) | Jev 網頁搜尋：內建 WebSearch 改由 Jev 回答並排序，Jev 答不出來自動退回內建 |
| [hyday-pet](plugins/hyday-pet/) | 電子雞：在提示框上方養一隻寵物，Claude 做什麼工作決定牠變成什麼物種，報錯會生病，還有小遊戲和商店 |
| [world-news](plugins/world-news/) | 新聞大事：在背景讀 Google 新聞台灣版裡你選的分類，把最新的標題釘在提示框下方 |

## 安裝

```bash
# 加入 marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# 安裝個別 plugin
/plugin install figma-visual-reviewer
/plugin install review-tests
/plugin install lore
/plugin install session-review
/plugin install jev-search
/plugin install hyday-pet
/plugin install world-news
```

### Codex、Cursor、Gemini CLI 等其他工具

```bash
npx skills add mukiwu/muki-ai-plugins
```

安裝時會讓你選要裝哪些 skill、裝到哪些工具，以及只給目前專案用還是所有專案都能用。在 Codex 裡叫用 skill 要打 `$名稱`（例如 `$session-review`），不是 `/名稱`

這個方式只會裝 skill 資料夾，lore 開新對話時的提醒、commit 前的檢查這類 plugin 附帶功能不會一起裝，所以 Claude Code 使用者建議還是用 `/plugin install`；jev-search 放在獨立的 repo，不在這份清單裡；hyday-pet 和 world-news 是 Claude Code 的 mod，沒有 skill 可以裝

## Plugin 總覽

### figma-visual-reviewer

像素級視覺比對，比較 Figma 設計稿與實際網頁的差異。

- `/review` — 互動式視覺審查
- Figma API 導出 → Playwright 截圖 → 像素 diff → AI 判斷
- 產出 HTML 差異報告（三欄並排比對）
- 支援 RWD 多尺寸檢查

[詳細說明 →](plugins/figma-visual-reviewer/README.zh-TW.md)

### review-tests

讀一份既有測試、找出盲點，產出一份 self-contained 的 HTML 報告——全程唯讀，不碰你的程式碼。

- 檢查斷言有效性、行為盲點、Mock 健康度、測試結構
- 每條 finding 都 backlink 到被測 source 的關鍵幾行
- 報告是單檔、CSS／JS 全 inline，輸出到 `.review-tests/`
- 只診斷，補測試交給 TDD

[詳細說明 →](plugins/review-tests/README.zh-TW.md)

### lore

建立、查閱、記錄、守門、維護、體檢專案的 lore，並對齊團隊的通用語言——那些程式碼自己藏著、卻講不出來的隱性知識。

- `lore-init`／`lore-consult`／`lore-capture`／`lore-guard`／`lore-check`／`lore-maintain`／`lore-ul` — 七個 skill 涵蓋完整生命週期
- 把業務規則、踩坑、API map、通用語言詞彙表，以及決定背後的「為什麼」記在 `docs/lore/`
- 規劃或修 bug 前先查，動手過程中學到什麼就記下來，commit 前用 diff 對照已記錄的 lore 守門
- 標記優先於刪除——以前對、現在過期的知識，那個教訓還留著

[詳細說明 →](plugins/lore/README.zh-TW.md)

### session-review

把一個或多個專案裡所有的 AI 對話（Claude Code 與 Codex）翻過一遍，整理成一份可互動的 HTML 報告

- `/session-review [路徑 ...]`，沒寫路徑就用目前專案，寫多個會合併成一份
- skill 排行分成你自己打的和 AI 自己叫的，工作流程畫成圖，開發與除錯時的溝通方式都附原話
- 找出一直重複的流程，建議做成客製 skill，附 SKILL.md 草稿與 user 或 project scope 的判斷
- 列出裝了但這段期間沒用過、對話也沒提過相關需求的 skill，附上移除指令
- 排除 SDK 自動執行的對話、去掉回溯造成的重複訊息，沒裝 `diagram-design` 時改用內建畫圖規則

[詳細說明 →](plugins/session-review/README.zh-TW.md)

### jev-search

把 Claude Code 內建的 WebSearch 交給 [Jev Search](https://github.com/superagents-lab/jev-search) 回答：Jev 讀懂一句話的請求，自己挑來源和時間範圍，每筆結果都打相關度分數排序。Jev 答不出來時，內建搜尋照常執行。程式碼放在獨立 repo，因為它同時是 npm 套件

- 用 function hook 攔 `WebSearch`，你和模型的搜尋方式都不用改
- 附 `jev_search` MCP 工具，要硬鎖 `sources` 或 `window` 時用，另有一個 skill 教模型何時該用
- 也能脫離 Claude Code 當 MCP server 或 CLI 用，`npx jev-search-mcp`
- Function hooks 是 early access 功能，settings 的 `env` 要設 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`

[詳細說明 →](https://github.com/mukiwu/jev-search-mcp)

### hyday-pet

在 Claude Code 的提示框上方養一隻電子雞，牠吃的是你跟 Claude 一起做的工作

- Claude 每用一次工具、每做完一輪對話，牠就長經驗，從蛋孵化到成熟期
- 平常最常改檔案、跑指令還是查資料，決定牠長成鼴鼠、水獺、貓頭鷹或奇美拉，成熟期再分化一次
- 工具報錯會長病菌，讓測試變綠牠就康復
- 側邊欄有會動的 ASCII 寵物、猜拳和猜數字、用金幣買高級食物和顏色樣式的商店，以及細節頁
- Function hooks 是 early access 功能，settings 的 `env` 要設 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`

[詳細說明 →](plugins/hyday-pet/README.zh-TW.md)

### world-news

把台灣的新聞大事釘在 Claude Code 的提示框下方

- 每次送出訊息時看冷卻時間到了沒，預設 30 分鐘，到了就在背景讀 Google 新聞台灣版裡你選的分類
- 八個版面加七個國際地區，例如 `/world-news 14ace`
- 只算一天內、沒看過的新聞，照 Google 的排序
- 不會塞進給模型的 prompt，不吃 token 也不影響快取
- Function hooks 是 early access 功能，settings 的 `env` 要設 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`

[詳細說明 →](plugins/world-news/README.zh-TW.md)

## 授權

MIT
