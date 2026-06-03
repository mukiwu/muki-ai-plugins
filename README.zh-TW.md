# muki-ai-plugins

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin marketplace，專注於品質保證 — 視覺回歸測試與測試體檢。

## Plugins

| Plugin | 說明 |
|--------|------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | 視覺回歸測試 — 比對 Figma 設計稿與實際網頁 |
| [review-tests](plugins/review-tests/) | 測試體檢 — 找出測試盲點，產出 self-contained 的 HTML 報告 |

## 安裝

```bash
# 加入 marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# 安裝個別 plugin
/plugin install figma-visual-reviewer
/plugin install review-tests
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

## 授權

MIT
