# lore

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin，幫你建立、查閱、記錄、守門、維護、體檢專案的 **lore**，並對齊團隊的通用語言——那些程式碼自己藏著、卻講不出來的隱性知識。

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
  glossary.md          # 選用：通用語言詞彙表（一個詞一條）
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

## 七個 skill

| Skill | 什麼時候會觸發 |
|-------|----------------|
| **lore-init** | 第一次建立 `docs/lore/`——專案還沒有 lore，或你要它初始化、bootstrap 起來時。 |
| **lore-consult** | 動手前先讀 lore——規劃功能或修 bug 之前，把相關的規則、坑、API map 撈出來，順便標出看起來過期的 entry。 |
| **lore-capture** | 記錄隱性知識——當你學到程式碼看不出來的東西（踩到的坑、確認是刻意的行為、API 怪癖、某個決定的「為什麼」）。 |
| **lore-guard** | commit／PR 前用 diff 對照 lore——把改到的檔案透過 `code:` 連結反查對應 entry，回報這次改動有沒有踩到已記錄的商業規則或坑。 |
| **lore-maintain** | 隨 lore 長大做整理——找出過期、重複、錯誤的 entry，檢查 `code:` 連結與索引還對不對，清掉沒用的內容。 |
| **lore-check** | 檢查 lore 到底有沒有在幫你——唯讀體檢，逐面向看覆蓋率、連結健康、新鮮度、entry 品質、採納率，再把要修的交給 lore-maintain／lore-capture。 |
| **lore-ul** | 建立與對齊通用語言——對話出現模糊詞、同詞異義、code 命名跟你的用詞對不上時把詞煉成詞條；也能替還沒有詞彙表的專案從零 bootstrap 一份。寫進 `docs/lore/glossary.md`；專案根目錄已有 `CONTEXT.md` 時則以它為準、不另建一份。 |

## 閉環

七個 skill 串成一個迴圈，讓 lore 活著，而不是像多數文件一樣慢慢爛掉：

1. **capture** 在你學到的當下把知識寫下來（SessionStart hook 會在對的時機提醒）。
2. **consult** 在下一次做功能、修 bug 前把它讀回來——知識真的影響工作，而不是躺在那裡。
3. **guard** 在 commit 前拿完成的 diff 回頭對照——已記錄的規則不會被悄悄打破。
4. 兩者都會記錄每條被撈出的 entry 最後是**被採納、只是確認、還是被忽略**。
5. **check** 把這些訊號彙整成健康報告（心跳提醒約每 30 天建議跑一次），**maintain** 據此動手——更新、重寫、或讓 entry 退役。
6. **ul** 讓語言本身也在迴圈裡：consult 把詞條讀進 brief、guard 用 `not:` 禁用詞把關命名、check 體檢詞彙健康——連用詞都會自我修正。

一直在幫忙的知識留下，不再幫忙的知識被點名、被修正。這就是它能自我修正的原因。

## 跟 CONTEXT.md 共存

如果專案已經把詞彙放在根目錄的 `CONTEXT.md`／`CONTEXT-MAP.md`（domain-modeling／grilling 這類 skill 用的格式），lore 會直接把那個檔案當成正典詞彙表，不會再建一份平行的：`lore-consult` 從它讀詞條、`lore-guard` 在 commit 前用它的 `_Avoid_` 清單把關命名（那套格式本身沒有的執法環節）、`lore-ul` 則讓路——只有在沒有 `CONTEXT.md` 的專案才會用 `docs/lore/glossary.md`。

## 快速開始

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install lore
```

接著，在你要記錄的專案裡：

1. 跑 `lore-init` 把 `docs/lore/` 建起來。
2. 在 `CLAUDE.md`（或 `AGENTS.md`）加一句指引，讓其他 skill 自然觸發，例如：

   > 專案 lore 放在 `docs/lore/`——規劃／修 bug 前先查，commit 前用 diff 對照，學到隱性知識就記進去。

之後，`lore-consult` 會在你動手前先讀，`lore-capture` 會把你學到的記下來，`lore-guard` 會在 diff 出門前把關。

## 更新

這個 plugin 透過 marketplace 散佈，要更新到新版分兩步：

1. 先刷新 marketplace。Claude Code 對 marketplace 是本地快取，不刷新就看不到新版：

   ```bash
   /plugin marketplace update muki-ai-plugins
   ```

   這會拉到最新 commit，並把已安裝的 plugin 一起升上去。

2. 用 plugin 選單確認（或手動更新）：

   ```bash
   /plugin
   ```

   它應該顯示 **lore** 已是最新版；如果還沒，從這裡更新。

第一步是關鍵——少了它，Claude Code 會一直給你快取的舊版，看起來就像沒有可更新的東西。

## 維護哲學

**標記優先於刪除。** 得來不易的知識，就算不再是現況，那個教訓還是有價值，所以「以前對、現在過期」的 entry 是標成 `obsolete`，而不是直接刪掉。任何破壞性動作（刪除／封存／合併）都要經你確認——預設動作永遠是「標記」。

## 健康檢查

`lore-check` 回答其他 skill 不回答的問題：*這包 lore 到底有沒有在幫你？* 它跑一次唯讀體檢，逐面向報告——entry 品質（每條還過不過 boundary test？）、覆蓋缺口、死連結、過期、撈不撈得出來，還有**採納率**。它不改任何東西，要修的交給 `lore-maintain` 跟 `lore-capture`。

採納率是真實使用的訊號。當 `lore-consult` 或 `lore-guard` 撈出一條 entry、或 `lore-maintain` 提一個動作，結果會（best-effort）記進 `docs/lore/.lore-feedback.jsonl`——`heeded`、`redundant` 或 `ignored`，還可以帶一句為什麼。一直被撈出來、卻從沒被採用的 entry 會浮上來變成複查候選。這個 log 放在你的專案裡，預設 gitignore。

每次體檢也會更新一個 gitignore 的 `.lore-last-check` 時間戳；超過約 30 天沒體檢時，SessionStart hook 會主動提醒再跑一次，健康迴圈不用靠任何人記得。

## 授權

MIT
