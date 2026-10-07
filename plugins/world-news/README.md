# world-news

[繁體中文版](README.zh-TW.md)

Taiwan's top news pinned under your Claude Code prompt. Each time you send a message, it checks whether the cooldown has passed and, if so, reads the Taiwan edition of [Google News](https://news.google.com/home?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant) for the categories you picked. The feeds load in the background, so your message never waits for them

```
⚠ world-news: [國際] 法國學運燒遍全國！逾25萬人上街 單日488人被捕（Yahoo新聞）
```

The interface is in Traditional Chinese

## Install

This is a function-hooks mod, an early access feature. Turn it on in `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" } }
```

Then add the marketplace and install:

```sh
claude plugin marketplace add mukiwu/muki-ai-plugins
claude plugin install world-news@muki-ai-plugins
```

Restart Claude Code or run `/reload-plugins`

Claude Code only; `npx skills add` does not install this plugin

## The status line

| Line | Meaning |
| --- | --- |
| `[科技] headline（outlet）` | This session's headline; it stays until a check brings new ones |
| `等你送出第一則訊息後開始追新聞` | Not checked yet |
| `Google 新聞暫時連不上，下則訊息再試` | Every feed failed; the next message tries again |

## One headline per session

Each open session takes its own headline from the latest ones, so two sessions side by side show different news. When a check finds something new, sessions start again from the newest

## Categories

| # | Category | Google News feed |
| --- | --- | --- |
| 1 | 國際 | World section |
| 2 | 科技 | Technology section |
| 3 | 財經 | Business section |
| 4 | 台灣 | Taiwan section |
| 5 | 軍事 | Search for 軍事, 國防, 共軍 or 戰爭 in the last day (Google News has no such section) |
| 6 | 科學 | Science section |
| 7 | 健康 | Health section |
| 8 | 體育 | Sports section |

International news split by region, each a search of the last day (Google News has no region sections):

| Key | Region | Searches for |
| --- | --- | --- |
| a | 美國 | 美國, 川普, 白宮 |
| b | 中國 | 中國, 北京, 習近平 |
| c | 日韓 | 日本, 南韓, 北韓 |
| d | 歐洲 | 歐洲, 歐盟, 英國, 法國, 德國 |
| e | 俄烏 | 俄羅斯, 烏克蘭 |
| f | 中東 | 中東, 以色列, 伊朗, 加薩 |
| g | 東南亞 | 東南亞, 越南, 菲律賓, 印尼, 泰國 |

1, 2 and 3 are on by default. Regions overlap (a call between the US and Russian presidents is both), but a story you have seen is never shown twice

## Commands

| Command | What it does |
| --- | --- |
| `/world-news` | Show the settings and the latest 15 headlines with links |
| `/world-news open`, `close` | Open or close a side pane of the latest headlines; click one to read it |
| `/world-news 14ace` | Pick categories: digits for sections, letters for regions |
| `/world-news cd 15` | Set the cooldown in minutes (default 30, at least 5) |
| `/world-news now` | Check right away |
| `/world-news on`, `off` | Turn checking on or off |

## What counts as news

- Published within the last 24 hours, in Google's order
- Not seen before, by link or by title; at most 3 per category per check
- Social posts (Facebook, Instagram and the like) that a search sometimes mixes in are dropped
- Google News is in Traditional Chinese already; a headline that reads as Simplified is converted with Taiwan character forms as a safety net

## Privacy and limits


- Only the fixed feed addresses are requested from Google News, never your messages
- Nothing is added to the model's prompt, so it costs no tokens and leaves the prompt cache alone
- It only checks when you send a message; it is not a push service
- The status line fits one headline and cannot hold a link; use `/world-news open` for clickable headlines

## Save data

Settings, seen links and the latest headlines live in this plugin's own store, so every project and session share them

## Development

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/world-news
claude plugin validate plugins/world-news
claude plugin test plugins/world-news
```

Categories and their feeds are in `hooks/policy.ts`

The conversion tables in `hooks/zh-data.ts` are generated from [OpenCC](https://github.com/BYVoid/OpenCC) (Apache-2.0); rebuild them with `python3 scripts/build-zh.py`
