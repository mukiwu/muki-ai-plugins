# session-review

[English](README.md)

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin，把你在一個專案裡所有的 AI 對話（Claude Code 和 Codex）翻過一遍，整理成一份可互動的 HTML 報告，看你實際上是怎麼跟 AI 一起工作的

## 安裝

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install session-review
```

## 用法

```
/session-review                                  # 目前 session 所在的專案
/session-review ~/code/my-app                    # 指定專案
/session-review ~/code/web ~/code/admin          # 多個專案合併成一份報告
/session-review --since 2026-09-01               # 只看這天之後還有活動的 session
/session-review --no-global                      # 不掃其他專案的使用紀錄，比較快
```

沒寫路徑時用目前目錄的 git 根目錄，不是 git repo 就用目錄本身；寫多個路徑會合併，每個 session、skill、原話都會標上所屬專案

## 報告回答什麼

| 區塊 | 內容 |
|------|------|
| **時間軸** | 每個 session 在同一條日期軸上的長條、每天的訊息數、訊息類型的粗略分布 |
| **Skill 排行** | 依次數排序，分成你自己打的 /指令 和 AI 自己叫的，並對照你 CLAUDE.md 寫的工作流程 |
| **工作流程** | 收斂出你實際的做事順序，畫成泳道圖（你和 AI）與除錯流程圖，附逐步說明 |
| **溝通方式** | 從 0 到 1 開發和除錯時的說話模式，每個都附原話，另外整理讓你不耐煩的時刻 |
| **原話庫** | 可分類、可搜尋的原話卡片 |
| **可做成 skill 的流程** | 重複出現的流程，附出現次數、做法、可直接複製的 SKILL.md 草稿，以及該放 user 還是 project scope |
| **建議移除的 skill** | 已安裝、但這段期間 0 次使用，而且對話裡也沒提過類似需求的 skill，分成建議移除、這個專案用不到、保留但改描述、先觀察四類，附上每個的移除指令 |

## 運作方式

1. `scripts/collect.py` 掃 `~/.claude/projects` 和 `~/.codex/sessions`，只留工作目錄在指定專案底下的 session，排除 SDK 自動執行的對話（例如每次 commit 後的安全審查），並去掉回溯造成的重複訊息
2. Claude 讀完所有訊息（量大時分批交給子代理），歸納模式並挑出原話
3. 移除建議會先盤點所有已安裝的 skill（user、專案、plugin），算這段期間和所有專案的使用次數，排除內部用與被其他 skill 依賴的，再搜你的訊息有沒有相關需求，只給建議不會刪東西
4. 報告寫成單一 HTML 檔，有 Artifact 工具就發布成 artifact，沒有就在本機打開

流程圖有裝 `diagram-design` skill 就用它，沒裝就改用內建的同一套色票與畫圖規則

## 放 user 還是 project scope

每個建議的 skill 都會標 scope：

- **Project scope**（`<專案>/.claude/skills/`，進 git）：內容寫到這個專案才有的東西（API、元件、分支名、業務規則），或團隊同事也該照著做
- **User scope**（`~/.claude/skills/`）：是你個人的習慣、會碰到你的私人筆記，或同一個模式在多個專案都出現

## 需求

- Python 3.9 以上（跑 `collect.py`）
- Node.js（選用，用來檢查報告的 script）

## 隱私

所有資料都在本機讀取，報告會引用你自己的訊息，分享 artifact 連結前記得先看過內容

## License

MIT
