# hyday-pet

[繁體中文版](README.zh-TW.md)

A virtual pet that lives above your Claude Code prompt and feeds on the work you and Claude do together. The more Claude does, the faster it grows; the kind of work decides what species it becomes; tool errors make it sick, and green tests make it well again

```
(^ω^) 啾啾 · 幼年期  飽 ████░  樂 █████  精 ███░░  ● 42
[ 餵食 ] [ 玩耍 ] [ 睡覺 ] [ 展開側邊欄 ] [ 收起 ]
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
claude plugin install hyday-pet@muki-ai-plugins
```

Restart Claude Code or run `/reload-plugins`

Claude Code only; `npx skills add` does not install this plugin

## Growing up

- It starts as an egg. Every tool call Claude makes is 1 XP, every finished turn is 3
- 10 XP hatches it, 150 makes it a child, 800 an adult
- Over time it gets hungry, bored and tired; sleep restores energy and it wakes up when rested
- Every third meal it poops, and an uncleaned mess drains its mood faster
- While Claude works, it cheers you on

## Species

Each tool call counts as one of three kinds of work: editing files, running commands, or looking things up (MCP tools count as looking things up)

On becoming a child, the work it saw most as a baby decides the species:

| Most common work | Species |
| --- | --- |
| Editing files | Mole (crafter) |
| Running commands | Otter (sailor) |
| Looking things up | Owl (explorer) |
| Nothing above 45% | Chimera (generalist) |

On becoming an adult it branches once more by the work it saw as a child, giving a swimming mole, a pure-bred mole, and so on: 16 outcomes in all

## Getting sick

- A tool error adds 10 germs; a success removes 2
- At 60 germs it falls sick: its stats drop faster and it refuses to play
- A passing test command (vitest, jest, pytest, `go test` and the like) removes 20; while sick, any other success removes 4
- Medicine removes 15 but tastes bad, costing 10 mood
- Below 20 germs it recovers

## Side pane

`/pet open`, or the button on the band, opens a pane with:

- An animated ASCII pet that bounces, blinks, sparkles while Claude works, snores in its sleep and runs a fever when sick
- Colored stat bars, germs, growth progress and this stage's work mix
- Two mini games: rock paper scissors and guess the number
- The shop and the detail page

In the fullscreen layout (`/tui fullscreen`) it docks beside the transcript; on the classic layout it sits above the prompt. The classic layout does not report mouse clicks, so focus the pane with ctrl+x then tab and use the hotkeys shown on the buttons

## Coins and the shop

| Earned by | Coins |
| --- | --- |
| Claude finishing a turn | 2 |
| A passing test run | 5 |
| Winning rock paper scissors, guessing the number | 3, 8 |
| Hatching, becoming a child, becoming an adult | 10, 30, 80 |

Premium food, fed on purchase:

| Food | Price | Effect |
| --- | --- | --- |
| Strawberry cake | 25 | Fullness +40, mood +15 |
| Energy drink | 30 | Energy +40 |
| Organic salad | 35 | Fullness +30, germs -15, no poop |
| Deluxe bento | 60 | Fullness to max, mood and energy +10 |

Color styles: pink and mono are free; mint and sky cost 150, gold 400, neon 800, rainbow 1200 and galaxy 1500. Each one has a live swatch in the shop, and the changing styles flow with the animation

## Detail page

Birthday, coins, how many turns it has watched, errors and green tests seen, times sick, mini game record, and a log of hatching, evolving, falling sick and shopping

## Commands

| Command | What it does |
| --- | --- |
| `/pet` | Show status |
| `/pet open`, `/pet close` | Open or close the side pane |
| `/pet feed`, `play`, `sleep`, `wake`, `clean`, `heal` | Care actions; Chinese words work too, like `/pet 餵` |
| `/pet shop`, `/pet buy 蛋糕` | List the shop, buy something |
| `/pet skin`, `/pet skin mint` | Cycle through owned colors, or pick one |
| `/pet detail` | Detail page |
| `/pet name 小咪` | Rename it |
| `/pet hide`, `/pet show` | Hide or bring back the band above the prompt |
| `/pet reset confirm` | Give up this pet and start over with a new egg |

## Save data

The pet lives in this plugin's own store, so every project and every open session share one pet. Each change reads the latest save first, so it never splits into two

## Development

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/hyday-pet
claude plugin validate plugins/hyday-pet
claude plugin test plugins/hyday-pet
```

To restyle the pet, edit the ASCII art in `hooks/sprites.ts`; widths are padded for you. Keep the capital letters L, R and M out of the art: they are replaced with the eyes and mouth
