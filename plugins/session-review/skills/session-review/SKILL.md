---
name: session-review
description: 回顧一個或多個專案的所有 AI session（Claude Code 加 Codex），產出可互動的 HTML 報告，內容包含 skill 使用排行圖、收斂後的工作流程圖、使用者在功能開發與除錯時怎麼跟 AI 溝通、可做成客製 skill 的重複流程，以及每個建議該放 user 或 project scope，使用者說 /session-review、分析這個專案的 ai session、回顧我怎麼用 AI、找出可以做成 skill 的流程時使用
argument-hint: "[專案路徑 ...] [--since YYYY-MM-DD]"
---

# Session Review

把專案底下所有人親自參與的 AI 對話翻過一遍，整理成一份可互動的 HTML 報告，最後發布成 artifact，並在桌面留一份

## 參數

- 沒寫路徑：用當前 session 的專案，先跑 `git rev-parse --show-toplevel` 取專案根目錄，不是 git repo 就用目前工作目錄
- 寫一個路徑：只分析那個專案
- 寫多個路徑（空白分隔）：合併成同一份報告，每個 session、skill、原話都標上所屬專案，報告裡加專案篩選
- `--since YYYY-MM-DD`：只看這天之後還有活動的 session
- 路徑可以用 `~`，不存在的路徑要先告訴使用者，不要默默略過

## 流程

### 1. 蒐集資料

```bash
python3 <這個 skill 的目錄>/scripts/collect.py --out <scratchpad>/session-review [--since ...] <路徑 ...>
```

輸出三個檔：

- `summary.json`：各類數量、skill 排行（分成使用者打的 user 和 AI 自己叫的 model）、子代理、工具、每日訊息數、每個 session 的摘要
- `messages.txt`：依 session 分組的使用者訊息，超過 400 字會截斷，這是主要閱讀材料
- `messages.json`：完整訊息，需要引用長句原文時查這裡

腳本已處理好的事，不要重做：自動化 session（entrypoint 是 sdk 開頭，例如每次改動後跑的安全審查）只計數不分析，回溯或重送造成的重複訊息用 uuid 去重，內建指令（/clear、/model 等）不算 skill，worktree 底下的 session 會算進主專案

### 2. 讀完所有對話

- 把 `messages.txt` 從頭讀到尾，不要只抽樣
- 檔案超過約 250KB 時，依 session 分批派 Explore 子代理，每個回傳：這批 session 在做什麼、開發和除錯時的說話模式、逐字原話（附 session id）、重複出現的請求，主對話只收結論
- 需要時再用 Bash 做關鍵字計數，佐證某個模式出現幾次、在幾個 session

### 3. 分析內容

報告要回答這五件事，細節見 [references/report-spec.md](references/report-spec.md)

1. **Skill 使用排行**：依次數排序的長條圖，可切換全部、使用者手動、AI 自己叫，點長條看說明、session 數、所屬專案，並對照使用者 CLAUDE.md 裡宣稱的工作流程，列出實際有沒有在用
2. **收斂後的工作流程**：先載入 `/diagram-design`，沒裝就改照 [references/diagram-fallback.md](references/diagram-fallback.md)，至少畫兩張（功能開發的泳道圖、除錯流程圖），搭配文字卡片逐步說明，再加時間軸、每日訊息數等圖表，不要只用一種呈現方式
3. **從 0 到 1 開發怎麼溝通**：歸納 5 到 8 個模式，每個附 1 到 3 句原話
4. **除錯時怎麼溝通**：同上，另外整理讓使用者不耐煩的時刻，這些通常是 CLAUDE.md 該補的規則
5. **可做成客製 skill 的重複流程**：每個建議要有出現次數與 session 數當證據、它會做什麼、SKILL.md 草稿，以及建議放 user 還是 project scope 和理由

### 4. 判斷 user 或 project scope

每個 skill 建議都要標 scope，並寫出安裝路徑

| 判斷問題 | 是 | 否 |
|---|---|---|
| 內容寫到這個專案才有的東西嗎（API、元件、分支名、業務規則） | project | user |
| 接手的同事也該照這套做嗎 | project，進 git | user |
| 會碰到使用者私人的東西嗎（個人筆記、個人偏好） | 一定 user | |
| 多專案合併時，這個模式在兩個以上專案出現嗎 | user，專案差異交給各專案的 CLAUDE.md 或 lore | 看前三題 |

路徑寫法：

- user scope：`~/.claude/skills/<name>/SKILL.md`，如果使用者的 `~/.claude/skills` 是從 dotfiles repo 用 symlink 連過來的，就放進那個 repo 並提醒要 commit
- project scope：`<專案>/.claude/skills/<name>/SKILL.md`，進 git

### 5. 做成 HTML 並發布

- 有 Artifact 工具時先跑它的 quickstart（intent 用 other）取得頁面規範，圖用 `/diagram-design` 的色票與規則，沒裝就用 [references/diagram-fallback.md](references/diagram-fallback.md) 內建的同一套
- 版型與互動照 [references/report-spec.md](references/report-spec.md) 的頁面結構做，色票與字體沿用 diagram-design（或 fallback 裡的 token 表），整頁維持同一套 token
- 環境有 Artifact 工具就發布成 artifact，沒有就只產生本機檔並用瀏覽器打開；本機檔存到 `~/Desktop/<專案名>-ai-review.html`（多專案用 `multi-project-ai-review.html`），本機版要自己補上 doctype、head、body
- 發布前用 node 檢查一次內嵌 script 能不能解析

## 寫作規則

- 報告用使用者平常對話的語言寫，使用者的 CLAUDE.md 如果有檔案內文的格式規則（標點、用詞）就照著做，SKILL.md 草稿放在程式碼區塊內不受限
- 講白話，描述畫面與行為，不堆術語
- 原話逐字引用，用引用區塊呈現，不加引號，附 session id
- 關鍵字分類只是粗分，要在報告裡註明看比例就好
- SKILL.md 草稿裡的業務規則只能填對話中確認過的，其他留空並寫明待補，不要猜

## 最後回覆使用者

- 附上 artifact 連結（有的話）與本機檔案路徑
- 用幾行講四到五個重點發現
- 說明資料範圍：幾個 session 納入、幾個自動化 session 排除、是否含 Codex
