# muki-ai-plugins

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin marketplace — 視覺回歸測試、測試體檢，與專案知識記錄。

## Plugins

| Plugin | 說明 |
|--------|------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | 視覺回歸測試 — 比對 Figma 設計稿與實際網頁 |
| [review-tests](plugins/review-tests/) | 測試體檢 — 找出測試盲點，產出 self-contained 的 HTML 報告 |
| [lore](plugins/lore/) | 專案 lore — 建立、查閱、記錄、維護程式碼講不出來的隱性知識 |

## 安裝

```bash
# 加入 marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# 安裝個別 plugin
/plugin install figma-visual-reviewer
/plugin install review-tests
/plugin install lore
```

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

建立、查閱、記錄、維護專案的 lore——那些程式碼自己藏著、卻講不出來的隱性知識。

- `lore-init`／`lore-consult`／`lore-capture`／`lore-maintain` — 四個 skill 涵蓋完整生命週期
- 把業務規則、踩坑、API map，以及決定背後的「為什麼」記在 `docs/lore/`
- 規劃或修 bug 前先查，動手過程中學到什麼就記下來
- 標記優先於刪除——以前對、現在過期的知識，那個教訓還留著

[詳細說明 →](plugins/lore/README.zh-TW.md)

## 授權

MIT
