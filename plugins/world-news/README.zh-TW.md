# world-news

[English](README.md)

把台灣的新聞大事釘在 Claude Code 的提示框下方。每次送出訊息時，它會看冷卻時間到了沒，到了就讀 [Google 新聞台灣版](https://news.google.com/home?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant)裡你選的分類。在背景讀取，送出的訊息不用等它

```
⚠ world-news: 🆕 [國際] 法國學運燒遍全國！逾25萬人上街 單日488人被捕（Yahoo新聞） · 另 4 則
```

## 安裝

這是用 function hooks 寫的 mod，目前是 early access 功能，要先在 `~/.claude/settings.json` 打開：

```json
{ "env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" } }
```

然後加入 marketplace 並安裝：

```sh
claude plugin marketplace add mukiwu/muki-ai-plugins
claude plugin install world-news@muki-ai-plugins
```

裝完重啟 Claude Code，或執行 `/reload-plugins`

只支援 Claude Code，`npx skills add` 不會裝到這個 plugin

## 狀態列

| 顯示 | 意思 |
| --- | --- |
| `🆕 [科技] 標題（媒體） · 另 2 則` | 上次查詢後有新的大事，顯示 Google 排第一的那則 |
| `🌐 沒有新的大事 · 08:54 查過` | 查過了，沒有新的 |
| `🌐 等你送出第一則訊息後開始追新聞` | 還沒查過 |
| `🌐 Google 新聞暫時連不上，下則訊息再試` | 這次全部讀取都失敗，下一則訊息會再試 |

## 分類

| 編號 | 分類 | 對應的 Google 新聞 |
| --- | --- | --- |
| 1 | 國際 | 國際版面 |
| 2 | 科技 | 科技版面 |
| 3 | 財經 | 商業版面 |
| 4 | 台灣 | 台灣版面 |
| 5 | 軍事 | 搜尋一天內的軍事、國防、共軍或戰爭，Google 新聞沒有這個版面 |
| 6 | 科學 | 科學版面 |
| 7 | 健康 | 健康版面 |
| 8 | 體育 | 體育版面 |

國際新聞再依地區細分，用英文字母選。Google 新聞沒有地區版面，所以都是搜尋一天內的新聞：

| 代號 | 地區 | 搜尋關鍵字 |
| --- | --- | --- |
| a | 美國 | 美國、川普、白宮 |
| b | 中國 | 中國、北京、習近平 |
| c | 日韓 | 日本、南韓、北韓 |
| d | 歐洲 | 歐洲、歐盟、英國、法國、德國 |
| e | 俄烏 | 俄羅斯、烏克蘭 |
| f | 中東 | 中東、以色列、伊朗、加薩 |
| g | 東南亞 | 東南亞、越南、菲律賓、印尼、泰國 |

預設開啟 1、2、3。地區之間會重疊，例如美俄元首通話同時算美國和俄烏，但看過的新聞不會重複出現

## 指令

| 指令 | 作用 |
| --- | --- |
| `/world-news` | 看設定和最近 15 則標題，含連結 |
| `/world-news 14ace` | 選分類，數字是版面、字母是地區 |
| `/world-news cd 15` | 冷卻時間改成幾分鐘，預設 30，最少 5 |
| `/world-news now` | 馬上查一次 |
| `/world-news on`、`off` | 開啟或關閉 |

## 怎樣才算新聞

- 24 小時內發布的，照 Google 的排序
- 連結和標題都沒看過的才算，每次每個分類最多取 3 則
- 搜尋偶爾會混進 Facebook、Instagram 這類社群貼文，會濾掉
- Google 新聞台灣版本來就是正體中文；萬一標題是簡體，會轉成台灣的正體字形當作保險

## 隱私與限制


- 只會向 Google 新聞讀取固定的 feed 網址，不會送出你的訊息
- 不會塞進給模型的 prompt，所以不吃 token，也不影響 prompt 快取
- 只有你送訊息時才會查，不是推播服務
- 狀態列只放得下一則標題，其他的用 `/world-news` 看

## 存檔

設定、看過的連結和最新標題都存在這個 plugin 自己的 store，所有專案和 session 共用同一份

## 開發

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/world-news
claude plugin validate plugins/world-news
claude plugin test plugins/world-news
```

分類和各自的 feed 在 `hooks/policy.ts`

`hooks/zh-data.ts` 的轉換表是從 [OpenCC](https://github.com/BYVoid/OpenCC)（Apache-2.0）產生的，要更新就執行 `python3 scripts/build-zh.py`
