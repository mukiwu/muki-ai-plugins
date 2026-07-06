# lore-ul 設計 spec

- 日期：2026-07-06
- 狀態：待實作
- 範圍：lore plugin 新增通用語言 skill `lore-ul`，並把詞彙迴圈接進既有六個 skill

> 註：本 spec 用正體中文供審閱，實際產出的 SKILL.md 與 lore-spec.md 內文維持英文，與既有 lore skill 一致。另有一條硬約束：所有產出檔案內不得提及任何外部參考來源或其他 skill 專案的名稱

## 背景與動機

把 lore 當 DDD 工具檢視的結論：戰術面已經成形（規則條目、code 連結、狀態演進、採納回饋迴圈），戰略面缺兩塊，通用語言與限界脈絡的邊界語意

本質問題是 lore 的知識主鍵是 code 位置，不是領域概念。DDD 的模型以詞為中心，規則掛在概念上；缺了詞這一層，條目之間串不起來，團隊和 agent 對話時也沒有共同詞彙可查、可挑戰。account 到底是 Customer 還是 User 這種對齊，現在沒有落點

`lore-ul` 補這一層：建立 `docs/lore/glossary.md` 詞彙表，用主動追問的手法把模糊詞煉成精確定義，並讓 consult、guard、check、capture 都吃得到詞，讓語言進入 lore 既有的自我修正迴圈

## 目標與非目標

### 目標

- 新增 skill `lore-ul`：對齊模式（日常追問）加 bootstrap 模式（冷啟動）
- glossary 詞條格式寫進 lore-spec，與既有 entry meta 同款一行 meta
- 閉環：consult 讀詞、guard 查禁用詞、check 驗語言健康、capture 可反連詞條、maintain 納入巡檢
- hook 常駐指示加上詞彙時機

### 非目標

- 不做 Context Map（area 之間的關係圖），等真的有多 context 需求再說
- 不做 linter 式強制；guard 的命名檢查是語意判斷，不是規則引擎
- 不與其他 glossary 或文件系統互通、遷移
- 不自動批量生成詞條，每個詞一律經使用者確認才寫入

## 設計決策記錄

| 問題 | 決定 | 理由 |
|------|------|------|
| 詞彙表位置 | `docs/lore/glossary.md` 全域一檔 | 小專案一個 context，起步不碎；符合 lore 的 lazy 哲學 |
| 拆檔時機 | 單一 area 詞條累積約 10 條以上才拆 `<area>/terms.md`，需確認 | 與 index.md 約 5 檔才長出來同一邏輯 |
| 職責範圍 | 只管詞 | 計畫壓力測試是 brainstorming 的事，決策 why 是 `architecture/` 的事 |
| 觸發 | 手動 + hook 輕推 + 冷啟動 bootstrap | 融入既有 nudge 機制，並解中途導入專案的冷啟動 |
| 詞條格式 | 沿用 lore entry meta 一行 meta，新增 `aka:` 與 `not:` | greppable，check 的 retrievability 檢查直接沿用 |
| 整合範圍 | 全套（七處） | glossary 只有寫入沒有讀取和體檢，就是另一份會爛掉的文件 |

## lore-ul skill 本體

### 兩個模式，skill 自行判斷

對齊模式（日常）：對話中出現模糊詞、同詞異義、code 命名與使用者用詞打架時進入

- 一次一問，每問附建議答案
- 模糊詞提出精確候選（account 是指 Customer 還是 User）
- 與現有 glossary 衝突當場指出（glossary 定義 cancellation 是整單取消，你現在講的是部分取消，哪個對）
- 用具體情境戳概念邊界，發明 edge case 逼出精確定義
- 對照 code 找矛盾；能從 codebase 查到答案的自己查，不浪費使用者的問答輪次

bootstrap 模式（冷啟動）：glossary 不存在或空

- 掃 README、型別名、area 名，抽不超過 10 個候選詞
- 候選只是訪談起點，逐個確認後寫入，不自動生成

### 寫入規則

- 詞一定案當場寫入 glossary，不批次累積
- glossary 檔 lazy 建立：第一個詞定案時才從 template 生出來
- 新建檔案時同步在 `docs/lore/README.md` 提及（Optional 段或索引）

### guardrails

- 詞是對齊出來的，不是生成的
- glossary 只放語言（定義、邊界、例子），不放實作細節，不當 spec 用
- `updated:` 日期遵守 lore-spec date rule
- feedback log best-effort：詞條被 surfaced、heeded 的記錄與既有條目同款，entry key 用 `glossary.md#詞`

## glossary 格式（lore-spec 新章節）

檔案 frontmatter（全域檔沒有單一 area，只留 kind）：

```yaml
---
kind: glossary
---
```

詞條格式：

```markdown
## Customer

`code:` `src/models/customer.ts` → `Customer` · `area:` `billing` · `aka:` `buyer` · `not:` `client, account` · `updated:` `2026-07-06` · `status:` `active`

付錢的人。跟 User（登入系統的人）不同：一個 Customer 可以有多個 User。
例：公司訂閱方案，公司是 Customer，員工帳號是 User。
```

- `code:` 指向實作這個概念的型別或 class，沿用既有反查機制；尚無實作用 `—`
- `area:` 限定脈絡，全專案通用可省
- `aka:` 可接受的同義詞
- `not:` 禁用詞（討論後淘汰的同義詞），guard 命名檢查的鉤子，逗號分隔
- body 至少一句定義，建議附一個具體例子

同詞異義處理：

- 跨 area 撞詞：同檔用括號區分 heading（`## Customer (billing)` 與 `## Customer (support)`），此時兩條的 `area:` 必填
- 同 area 內撞詞：不允許，追問拆成兩個詞
- 拆檔後的 `<area>/terms.md` frontmatter 帶 `area:` 加 `kind: glossary`，與其他 area 檔案同款

詞的演進，mark over delete 適用：

- 概念改名：舊詞條標 `status: obsolete`，body 指向新詞，語言演進史保留
- 從未為真的錯誤詞條：刪除，需使用者確認

entry meta 全域擴充：

- 既有條目（pitfalls、business-rules、topic）的一行 meta 新增可選 `term:` 欄位，反連 glossary 詞條，值是詞條 heading 原文（例 `term:` `Customer`；帶 area 括號的撞詞條目連括號一起寫）

## 整合改動

| 檔案 | 改什麼 |
|------|--------|
| lore-consult | 讀 core files 時順讀 glossary 相關詞條；brief 可帶 1 到 2 個關鍵詞條；feedback log 記 `glossary.md#詞` |
| lore-guard | 新步驟命名檢查：從 diff 新增行抽識別字與字串，對 glossary 的 `not:` 禁用詞比對；只報領域語意的撞名（client 當 HTTP client 不報，當客戶才報），由讀 hunks 判斷；報告格式同既有違反項 |
| lore-check | 加第 ⑦ 維度語言：glossary 存在與否、詞條 meta 完整度、`not:` 禁用詞在 codebase 的殘留量（heuristic 抽查即可）、詞條 adoption；沒 glossary 報 no data 並指向 lore-ul，不算錯誤 |
| lore-capture | 寫 entry 時若涉及 glossary 詞，meta 掛 `term:` 反連；鼓勵 body 附一個具體例子 |
| lore-maintain | 巡檢範圍納入 glossary.md 與 `<area>/terms.md`；詞條 stale 判準同款（讀 code 確認 `code:` 連結與命名還在不在用）；低採納詞條同機制處理 |
| hook lore-session-start | 常駐指示加第 4 時機：詞彙模糊、同詞異義、code 命名與使用者用詞不一致時考慮 `lore:lore-ul`；專案已有 glossary 時提醒 agent 對話與命名跟著 glossary 用詞 |
| templates | 新增 `glossary.md.tmpl`；`README.md.tmpl` 的 Optional 段加 glossary.md 一行 |
| README.md 與 README.zh-TW.md | 六技變七技；The Loop 補語言環節（ul 建詞、consult 讀詞、guard 守詞、check 驗詞） |

lore-init 不動：glossary 是 lazy 建立，由 lore-ul 負責，init 不預先 scaffold 空檔

## 檔案清單

新增

- `plugins/lore/skills/lore-ul/SKILL.md`
- `plugins/lore/reference/templates/glossary.md.tmpl`

修改

- `plugins/lore/reference/lore-spec.md`
- `plugins/lore/skills/lore-consult/SKILL.md`
- `plugins/lore/skills/lore-guard/SKILL.md`
- `plugins/lore/skills/lore-check/SKILL.md`
- `plugins/lore/skills/lore-capture/SKILL.md`
- `plugins/lore/skills/lore-maintain/SKILL.md`
- `plugins/lore/hooks/lore-session-start`
- `plugins/lore/reference/templates/README.md.tmpl`
- `plugins/lore/README.md`、`plugins/lore/README.zh-TW.md`
- `plugins/lore/.claude-plugin/plugin.json`（版本號）

## 驗收情境

1. 冷啟動：無 glossary 的專案跑 lore-ul，bootstrap 抽候選、逐個訪談、寫入 glossary.md 並更新 README
2. 對齊：對話出現 account 歧義，lore-ul 追問定案為 Customer，client 進 `not:`，glossary 當場更新
3. 撞詞：billing 與 support 對 Customer 定義不同，同檔兩個帶 area 括號的 heading
4. guard：diff 新增 client 識別字且語意為客戶，lore-guard 報違反並指向 Customer 詞條；語意為 HTTP client 則不報
5. consult：規劃 billing 功能，brief 帶出 Customer 詞條與相關 rules
6. check：報告第 ⑦ 維度列出 meta 完整度與禁用詞殘留；無 glossary 的專案報 no data 指向 lore-ul

## 風格與硬約束

- SKILL.md 與 lore-spec.md 內文維持英文，語氣與結構貼齊既有六個 skill（When to use、Procedure、Guardrail 的骨架）
- 所有產出檔案內不得提及任何外部參考來源或其他 skill 專案的名稱
- 所有寫入日期遵守 lore-spec date rule
