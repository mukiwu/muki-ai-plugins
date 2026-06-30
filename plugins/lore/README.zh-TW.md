# lore

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin，幫你建立、查閱、記錄、維護、體檢專案的 **lore**——那些程式碼自己藏著、卻講不出來的隱性知識。

## 什麼是 lore

Lore 是程式碼、型別、測試、git 紀錄都看不出來的知識：沒人寫下來的業務規則、某個決定背後的「為什麼」、踩過坑才學到的 API 怪癖，還有會咬你第二次的陷阱。判斷標準很簡單：*一個夠格的工程師，光讀現在的程式碼能不能自己還原這件事？* 能的話，它就不算 lore。

它放在 `docs/lore/` 底下：

```
docs/lore/
  README.md            # 唯一入口：使用說明 + 索引
  <area>/              # 一條軸線：依領域／子系統切（payments/、auth/…）
    pitfalls.md        # 核心：踩坑（什麼會壞、不要做 X）
    business-rules.md  # 核心：規則，以及程式碼講不出來的「為什麼」
  api-map.md           # 選用：功能 <-> API <-> 進入點
  architecture/        # 選用：跨模組的技術選型理由
```

每條 entry 在標題正下方都帶一行可以 grep 的 meta：

```markdown
## 這個坑的簡短標題

`code:` `src/payments/charge.ts` → `chargeCard` · `updated:` `2026-06-08` · `status:` `active`
```

- `code:`——這條 entry 指向的檔案路徑（可選 `→ symbol`）。
- `updated:`——最後一次確認這條還成立的日期（ISO 格式）。
- `status:`——`active`｜`resolved`｜`obsolete`。

## 五個 skill

| Skill | 什麼時候會觸發 |
|-------|----------------|
| **lore-init** | 第一次建立 `docs/lore/`——專案還沒有 lore，或你要它初始化、bootstrap 起來時。 |
| **lore-consult** | 動手前先讀 lore——規劃功能或修 bug 之前，把相關的規則、坑、API map 撈出來，順便標出看起來過期的 entry。 |
| **lore-capture** | 記錄隱性知識——當你學到程式碼看不出來的東西（踩到的坑、確認是刻意的行為、API 怪癖、某個決定的「為什麼」）。 |
| **lore-maintain** | 隨 lore 長大做整理——找出過期、重複、錯誤的 entry，檢查 `code:` 連結與索引還對不對，清掉沒用的內容。 |
| **lore-check** | 檢查 lore 到底有沒有在幫你——唯讀體檢，逐面向看覆蓋率、連結健康、新鮮度、entry 品質、採納率，再把要修的交給 lore-maintain／lore-capture。 |

## 快速開始

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install lore
```

接著，在你要記錄的專案裡：

1. 跑 `lore-init` 把 `docs/lore/` 建起來。
2. 在 `CLAUDE.md`（或 `AGENTS.md`）加一句指引，讓其他 skill 自然觸發，例如：

   > 專案 lore 放在 `docs/lore/`——規劃／修 bug 前先查，學到隱性知識就記進去。

之後，`lore-consult` 會在你動手前先讀，`lore-capture` 會把你學到的記下來。

## 維護哲學

**標記優先於刪除。** 得來不易的知識，就算不再是現況，那個教訓還是有價值，所以「以前對、現在過期」的 entry 是標成 `obsolete`，而不是直接刪掉。任何破壞性動作（刪除／封存／合併）都要經你確認——預設動作永遠是「標記」。

## 健康檢查

`lore-check` 回答其他 skill 不回答的問題：*這包 lore 到底有沒有在幫你？* 它跑一次唯讀體檢，逐面向報告——entry 品質（每條還過不過 boundary test？）、覆蓋缺口、死連結、過期、撈不撈得出來，還有**採納率**。它不改任何東西，要修的交給 `lore-maintain` 跟 `lore-capture`。

採納率是真實使用的訊號。當 `lore-consult` 撈出一條 entry、或 `lore-maintain` 提一個動作，結果會（best-effort）記進 `docs/lore/.lore-feedback.jsonl`——`heeded`、`redundant` 或 `ignored`。一直被撈出來、卻從沒被採用的 entry 會浮上來變成複查候選。這個 log 放在你的專案裡，預設 gitignore。

## 授權

MIT
