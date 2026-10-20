# review-code

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的程式碼審查 plugin。它對照一個基準點的 diff，從三個角度各派一個子代理審查，重要的發現再交給獨立的子代理投票確認，只有確認成立的問題才會進報告。全程唯讀，不修改任何程式碼

## 安裝

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install review-code
```

Codex、Cursor、Gemini CLI 等其他工具：

```bash
npx skills add mukiwu/muki-ai-plugins
```

安裝時會列出所有 skill，勾選 `review-code`

## 快速開始

```
review-code main
review-code HEAD~3 --quick
```

給它一個基準點（commit、分支、tag）。`--quick` 會跳過投票，適合小改動或還在來回修的時候

## 運作方式

1. **三個角度平行審查**
   - **規範**：寫法符不符合 repo 的規範（`CODING_STANDARDS.md`、`CONTRIBUTING.md`、相關的 `docs/lore/` 條目），再加上一份 Fowler 程式碼異味清單
   - **需求**：有沒有照 issue 或 spec 做，沒有少做也沒有多做
   - **Bug**：執行時會不會出錯，也會查 repo 裡做同一件事、卻沒跟著改的地方
2. **每條發現都有類別**：`Important`、`Nit`，或 `Pre-existing`（改動之前就存在的問題，不算這次的範圍）
3. **投票確認**：每條 `Important` 交給兩個新的子代理，它們只看得到發現本身和程式碼，看不到原本的推理。兩票都成立就保留，兩票都不成立就丟掉，意見分歧再加第三票
4. **報告**：三個角度分開列，每條附投票結果，舊問題另外列成建議開的 issue

再審時只看新的 diff，作者已經說明不修的問題不再重提，審到第三輪就停下來，建議回頭檢查整體做法

## 搭配使用

- `review-tests` 審測試本身，`review-code` 審正式程式碼
- `lore-guard` 對照整份 lore，`review-code` 只讀和這次改動相關的 lore

流程與異味清單參考 Matt Pocock 的 [code-review](https://github.com/mattpocock/skills)，另外加上 bug 角度、發現分類與投票確認

## 授權

MIT
