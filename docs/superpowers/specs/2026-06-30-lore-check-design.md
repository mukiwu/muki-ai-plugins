# lore-check 設計 spec

- 日期：2026-06-30
- 狀態：待實作
- 範圍：lore plugin 新增唯讀健康檢查 skill，並加上採納回饋迴圈

> 註：本 spec 用正體中文供審閱，實際產出的 SKILL.md 與 lore-spec.md 內文維持英文，與既有三個 lore skill 一致

## 背景與動機

lore plugin 目前有四個 skill：capture（記錄）、consult（查閱）、init（建置）、maintain（清理）。它解決的是把專案的隱性知識寫下來，但沒有任何機制回答一個問題，這包 lore 到底有沒有在幫使用者

這次要做的，是一個會跟著使用者專案走的健康檢查能力，裝進 plugin 本身。不管裝到誰的哪個專案，它都能體檢那包 lore，回報健康度，並指出下一步。它驗的是通用判斷會不會 generalize 加上這包 lore 對這個使用者有沒有實際被採用，不是把任何特定專案的業務邏輯寫死

設計過程排除了另外兩條路，列在這裡備查

- 離線 eval 工具（開發者端用合成情境跑分）：偏向驗 skill 判斷的 generalize，但產出只有開發者看得到，這次選的是裝進產品給使用者用的路線，故不做
- 知識管理理論的純概念檢核：不獨立做，改成融入每個面向的依據

## 目標與非目標

### 目標

- 新增唯讀 skill `lore-check`，套到任何專案都能跑出一份健康報告
- 報告涵蓋六個面向，每個面向各自報數字，可行動
- 加入採納回饋迴圈，量測 lore 撈出來的建議實際被採用的比例
- 報告結尾把要修的交棒給 `lore-maintain` 與 `lore-capture`

### 非目標

- 不接任何 telemetry 後端，不連網，全部本地檔案
- 不揉成單一總分，單一分數會藏資訊且不可行動
- `lore-check` 自己永不改檔，唯讀，動手一律交棒
- 不做 CI 閘門，這是給人看的健康報告
- consult 那側的採納收尾是 best-effort，不保證每次收到
- 不另做離線 eval 工具

## 元件與分工

新增一個唯讀 skill，做三件事，體檢、打分、指路。它與既有 skill 的分工

| Skill | 意圖 | 會動手嗎 |
|-------|------|---------|
| `lore-check`（新） | 診斷：lore 健不健康、有沒有在幫你 | 否，純唯讀 |
| `lore-maintain` | 清理：標記、刪除、合併 | 會，逐筆確認 |
| `lore-capture` | 補洞：把缺的知識記進去 | 會 |

開新 skill 而不塞進 `lore-maintain` 的理由：兩者意圖不同，一個是只看不動的診斷，一個是動手清理。lore 既有設計就是一個 skill 一個清楚職責，混在一起會讓報告與動手糊掉。唯讀也代表零風險，隨時可跑

## 六個面向

①②靠 Claude 判斷（需讀 code），③④⑤讀檔彙整，⑥靠回饋 log

### ① 品質（頭號指標）

- 量什麼：每一條 entry 問一次，讀現行 code 能不能推回來。能，代表它根本不是 lore，是雜訊。算出通過率
- 為什麼是頭號：lore 設計反覆強調雜訊會淹掉真 lore，一包 lore 裡若一堆條目讀 code 就有，它不只沒幫忙還在扣分。這條通過率直接驗 lore 自己的命題
- 理論依據：內隱知識（Polanyi），SECI 外化（Nonaka），把講得出但寫不出的東西變文件
- 怎麼算：Claude 讀 entry 加對應 code 後判斷

### ② 覆蓋

- 量什麼：code 裡有哪些頂層領域或子系統，是 lore 完全沒碰的缺口
- 理論依據：知識缺口分析
- 怎麼算：先抓 code 領域，再比對現有 area，半判斷

### ③ 連結健康

- 量什麼：每個 `code:` 路徑還在不在，壞連結比例
- 理論依據：文件腐化
- 怎麼算：純機械，Claude 用 Grep 撈 `code:` 後逐一 `test -e`

### ④ 新鮮度

- 量什麼：`updated:` 年齡分佈、超過 180 天幾條、active / resolved / obsolete 各幾條
- 理論依據：知識衰減
- 怎麼算：純機械，讀檔解 meta

### ⑤ 撈得出來

- 量什麼：meta 完不完整（每條都有 code、updated、status，格式可 grep），README 索引跟磁碟有沒有對不上
- 理論依據：資訊檢索前置條件，consult 找不到、連不上的東西等於撈不出來
- 怎麼算：純機械，讀檔比對

### ⑥ 採納率

- 量什麼：lore 撈出來的建議實際被採用的比例
- 理論依據：相關性回饋（implicit relevance feedback），知識的實際使用，沒被用過的知識是死重
- 怎麼算：讀回饋 log 彙整，詳見下節
- 注意：要等使用累積才有資料，剛裝好時顯示尚無資料，屬正常

## 採納回饋迴圈

### 迴圈

1. 攔截：`lore-consult` 撈出一條 pitfall 或 rule，或 `lore-maintain` 提一個動作
2. 記下結果：在使用者自然會表態的點，把結果寫進 append-only 的 log
3. `lore-check` 彙整：讀 log，算每條 entry 的採納率，報告裡點名高採納與低採納
4. 交棒 maintain：採納率低的變成複查候選

### 三態結果模型

不用二分，用三態，避免冤枉只是確認使用者原計畫的好條目

- `heeded`：照做，視為有幫助
- `redundant`：使用者本來就知道，它只是確認，中性，不扣分
- `ignored`：忽略或它根本錯，視為沒幫助，列入複查

### 收集點

- `lore-maintain`：免費又乾淨。它本來就逐筆問要不要這樣做，使用者答 yes / no 直接記 `accepted` / `declined`
- `lore-consult`：要補一個收尾，且偏軟。撈出時先記 `surfaced`，任務結束時再回頭標每條三態。session 中途斷或忘了收尾會有缺口，是 best-effort

### log 格式

- 路徑：`docs/lore/.lore-feedback.jsonl`，在使用者專案內，跑起來才產生
- 形式：append-only，一行一個事件
- 欄位：時間、來源 skill、指到的 entry 參照、當時任務摘要、結果（`surfaced` / `heeded` / `redundant` / `ignored` / `accepted` / `declined`）
- git：預設 gitignore，要不要留由使用者決定
- 寫入不可阻擋主任務，失敗就略過

## 報告格式

給使用者看的健康報告範例

```
# Lore check ｜ 2026-06-30
整體：需要關注（6 項裡 2 項黃燈）

① 品質（boundary-test）  10/12 通過   ⚠ 2 條讀 code 就有 → 複查
② 覆蓋                   3 個 code 領域沒 lore：billing, notification, auth
③ 連結健康               14/15 有效   ⚠ 1 條死連結
④ 新鮮度                 3 條 >180 天；active 11 / resolved 1 / obsolete 0
⑤ 撈得出來               meta 完整、README 索引與磁碟一致 ✓
⑥ 採納率                 surfaced 8｜heeded 5 / redundant 2 / ignored 1
                         ⚠「contractCalc 四捨五入」撈 3 次、0 heeded → 複查

下一步
- 跑 lore-maintain：1 條死連結、2 條疑似雜訊、1 條低採納
- 跑 lore-capture：補 billing / notification / auth 三個缺口
```

原則：每個面向各自報數字加上一個黃燈或綠燈狀態，不揉總分。結尾一律給下一步並指向對應 skill

黃燈與綠燈的門檻是 heuristic，由 SKILL.md 給出參考值（例如有任一死連結、boundary-test 通過率低於某比例、或有未覆蓋領域就亮黃燈），實作時定，刻意不追求精準數字

## 架構決策：純 skill，不寫腳本

機械檢查（③④⑤加上彙整 log）由 SKILL.md 指示 Claude 用現有工具做（Read、Grep、`test -e`），不另寫腳本

理由

- 跨平台 shell 算日期年齡、解 frontmatter、彙整 jsonl 很脆，GNU 與 BSD 的 `date` 不同，jq 不一定有
- 既有三個 lore skill 都是純 SKILL.md 零腳本，只有 SessionStart hook 是 script，加腳本會破壞一致性並逼使用者專案多一個依賴
- 代價是每次跑略慢、數字有極小模型抖動，但這是給人看的健康報告不是 CI 閘門，影響小

## 檔案變更

```
plugins/lore/
├─ skills/lore-check/SKILL.md      新增，唯讀診斷
├─ skills/lore-consult/SKILL.md    改：撈出時記 surfaced，收尾標三態
├─ skills/lore-maintain/SKILL.md   改：accepted / declined 入 log、低採納列複查
├─ reference/lore-spec.md          改：新增採納回饋 log 格式加三態定義（共用契約）
└─ .claude-plugin/plugin.json      改：version bump
docs/lore/.lore-feedback.jsonl     執行期在使用者專案產生，預設 gitignore
```

另需更新 plugin README（中英）與 marketplace 描述，列入第一段收尾

## 動工分段

可分開上，各自獨立有價值

### 第一段：lore-check 本體

- 新增 `skills/lore-check/SKILL.md`，涵蓋①〜⑤
- `lore-spec.md` 補 lore-check 的定位說明
- plugin README 與 plugin.json 更新
- 裝好就能用，不依賴回饋迴圈

### 第二段：採納回饋 ⑥

- `lore-spec.md` 新增回饋 log 格式與三態定義（共用契約）
- 改 `lore-consult`：撈出記 surfaced、收尾標三態
- 改 `lore-maintain`：accepted / declined 入 log、低採納列複查
- `lore-check` 加上⑥讀 log 彙整
- 較侵入，動到既有 skill，單獨上比較穩

## 風險與待確認

- consult 收尾的可靠度：best-effort，實作時要把收尾步驟寫得夠明確，但無法保證 session 中斷時補得回來，報告需誠實標示資料可能不全
- ⑥的冷啟動：新裝專案 log 為空，報告要明確顯示尚無資料而非報錯
- 寫 log 動到既有 skill 的行為面，需確保不影響主任務，且不違反 lore 既有的 mark over delete 與唯讀查閱精神

已定案決策（非待確認）：skill 名為 `lore-check`，三態採納模型，純 skill 不寫腳本，分兩段動工
