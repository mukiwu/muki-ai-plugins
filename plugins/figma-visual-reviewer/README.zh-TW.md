# figma-visual-reviewer

給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的視覺回歸測試 plugin。透過像素級比對和 AI 視覺判斷，比較 Figma 設計稿與實際網頁的差異。

## 安裝

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install figma-visual-reviewer
```

## 快速開始

```bash
/figma-visual-reviewer:review
```

Plugin 會詢問：
1. **目標 URL** — 要審查的網頁（可以是 localhost）
2. **Figma 連結** — 設計稿 URL（或提供本地截圖）

接著自動執行完整流程：導出 Figma → 截網頁 → 像素比對 → AI 判斷 → 產出報告。

## 運作方式

```
Figma 設計稿 ──→ 導出 PNG（透過 Figma API）
                                              ├──→ 像素 Diff ──→ AI 視覺判斷 ──→ 報告
網頁 ──────────→ 截圖（透過 Playwright）
```

### 三種取得設計稿的方式

| 方式 | 適用情境 |
|------|---------|
| **Figma API** | 有設定 `FIGMA_ACCESS_TOKEN`，全自動 |
| **手動截圖** | 沒有 token，手動提供設計稿 PNG |
| **Playwright** | 用瀏覽器開 Figma 截圖（需要已登入 Figma） |

### 像素比對做了什麼

- 使用 numpy 逐像素比對兩張圖
- 用彩色疊加標記差異區域
- 用 scipy 偵測連續的差異區塊
- 回報差異百分比和區域座標

### AI 判斷什麼

不是所有像素差異都是 bug。AI 會把每個差異分類：

| 類型 | 意思 | 處理方式 |
|------|------|---------|
| 🔴 Bug | 排版錯誤、元素遺漏、顏色錯誤 | 必須修正 |
| 🟡 Drift | 累積的小偏差（間距、字型渲染差異） | 需要檢視 |
| 🟢 Acceptable | 瀏覽器渲染差異、反鋸齒、動態內容 | 可忽略 |

## 指令

| 指令 | 說明 |
|------|------|
| `/review` | 互動式視覺審查 — 詢問 URL 和 Figma 連結 |

## 腳本

| 腳本 | 說明 |
|------|------|
| `figma-export.py` | 透過 Figma REST API 導出 frame 為 PNG |
| `pixel-diff.py` | 像素級圖片比對，含區域偵測 |
| `generate-report.py` | 產出 HTML 報告（三欄並排比對） |

### figma-export.py

```bash
python scripts/figma-export.py "<figma_url>" --output design.png --scale 2
```

需要設定 `FIGMA_ACCESS_TOKEN` 環境變數。

### pixel-diff.py

```bash
python scripts/pixel-diff.py design.png screenshot.png --output diff.png --threshold 10
```

輸出 JSON 差異統計數據和視覺化差異圖。

### generate-report.py

```bash
python scripts/generate-report.py \
  --design design.png \
  --screenshot screenshot.png \
  --diff diff.png \
  --stats stats.json \
  --output report.html
```

產出獨立的 HTML 報告，圖片直接嵌入（不需要外部檔案）。

## 與 shipshape-skills 的整合

兩個 plugin 都安裝時，shipshape 的 `/feature` 工作流（階段 6：UIUX 審查）會在有 Figma 設計稿的情況下自動使用 figma-visual-reviewer。不需要額外設定。

## 系統需求

- Python 3.10+
- `Pillow`、`numpy`（必要）
- `scipy`（選用，用於區域偵測）
- `requests`（用於 Figma API）
- Playwright MCP（用於網頁截圖）

## 設定

```bash
pip install Pillow numpy scipy requests
```

取得 Figma API 權限：
1. 前往 [Figma](https://www.figma.com) → Settings → Personal access tokens
2. 產生一個新 token（名稱可以取 `visual-reviewer`）
3. 用以下任一方式設定 token：

**方式 A — 專案 `.env` 檔（推薦）：**
```bash
# 加到專案的 .env 檔
FIGMA_ACCESS_TOKEN=figd_你的token
```

**方式 B — Claude Code 設定：**
```bash
# 在 Claude Code 中執行
/update-config
# 然後把 FIGMA_ACCESS_TOKEN 加到環境變數
```

**方式 C — Shell export（暫時）：**
```bash
export FIGMA_ACCESS_TOKEN=figd_你的token
```

Token 會被 `figma-export.py` 用來呼叫 [Figma REST API](https://www.figma.com/developers/api)，導出設計稿的 frame 為 PNG 圖片。沒有 token 也可以使用 plugin，改成手動提供設計稿截圖即可。

## 授權

MIT
