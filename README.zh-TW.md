# muki-ai-plugins

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin marketplace，專注於視覺品質保證。

## Plugins

| Plugin | 說明 |
|--------|------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | 視覺回歸測試 — 比對 Figma 設計稿與實際網頁 |

## 安裝

```bash
# 加入 marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# 安裝 plugin
/plugin install figma-visual-reviewer
```

## Plugin 總覽

### figma-visual-reviewer

像素級視覺比對，比較 Figma 設計稿與實際網頁的差異。

- `/review` — 互動式視覺審查
- Figma API 導出 → Playwright 截圖 → 像素 diff → AI 判斷
- 產出 HTML 差異報告（三欄並排比對）
- 支援 RWD 多尺寸檢查

[詳細說明 →](plugins/figma-visual-reviewer/README.zh-TW.md)

## 授權

MIT
