# muki-ai-plugins

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace — visual regression testing, test review, project knowledge capture, AI session review, and Jev-powered web search.

## Plugins

| Plugin | Description |
|--------|-------------|
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | Visual regression testing — compare Figma designs against live web pages |
| [review-tests](plugins/review-tests/) | Test review doctor — diagnose a test file for blind spots, output a self-contained HTML report |
| [lore](plugins/lore/) | Project lore — scaffold, consult, capture, guard, maintain, health-check, and language-align the implicit knowledge your codebase can't show |
| [session-review](plugins/session-review/) | AI session review — turn every Claude Code and Codex session of a project into an interactive report on how you work with AI, and which routines to make into skills |
| [jev-search](https://github.com/mukiwu/jev-search-mcp) | Web search through Jev Search: answers the built-in WebSearch with Jev-ranked results and falls back to the built-in tool when Jev cannot answer |
| [hyday-pet](plugins/hyday-pet/) | Virtual pet above your prompt: the work Claude does decides its species, tool errors make it sick, plus mini games and a shop |
| [world-news](plugins/world-news/) | News under your prompt: reads the Taiwan edition of Google News for the categories you pick in the background and pins the top headline |

## Install

```bash
# Add the marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# Install individual plugins
/plugin install figma-visual-reviewer
/plugin install review-tests
/plugin install lore
/plugin install session-review
/plugin install jev-search
/plugin install hyday-pet
/plugin install world-news
```

### Codex, Cursor, Gemini CLI, and other agents

```bash
npx skills add mukiwu/muki-ai-plugins
```

The installer asks which skills to install, which agents to install them to, and whether to install for the current project or for every project. In Codex, invoke a skill with `$name` (for example `$session-review`) instead of `/name`.

This installs the skill folders only. Plugin extras such as lore's session-start reminder and pre-commit check are not included, so Claude Code users should prefer `/plugin install`. jev-search lives in its own repository and is not part of this list; hyday-pet and world-news are Claude Code mods with no skill to install.

## Plugin Overview

### figma-visual-reviewer

Pixel-level visual comparison between Figma designs and live web implementations.

- `/review` — Interactive visual review
- Figma API export → Playwright screenshot → pixel diff → AI judgment
- Generates HTML diff reports with side-by-side comparison
- Supports RWD multi-viewport checks

[Read more →](plugins/figma-visual-reviewer/README.md)

### review-tests

Reads an existing test file, finds blind spots, and produces a self-contained HTML report — read-only, never touches your code.

- Checks assertion validity, behavior gaps, mock health, and test structure
- Backlinks every finding to the key lines of the source under test
- Outputs a single inline-everything HTML report to `.review-tests/`
- Diagnose only — fixes are left to TDD

[Read more →](plugins/review-tests/README.md)

### lore

Scaffold, consult, capture, guard, maintain, health-check, and language-align project lore — the implicit knowledge your codebase carries but can't show on its own.

- `lore-init` / `lore-consult` / `lore-capture` / `lore-guard` / `lore-check` / `lore-maintain` / `lore-ul` — seven skills covering the full lifecycle
- Stores business rules, pitfalls, API maps, a shared glossary, and the *why* behind decisions under `docs/lore/`
- Consult before planning or bug-fixing; capture what you learn as you go; guard your diff against recorded lore before commit
- Mark over delete — outdated-but-once-true knowledge keeps its lesson

[Read more →](plugins/lore/README.md)

### session-review

Reads every AI session you had in one or more projects (Claude Code and Codex) and turns it into one interactive HTML report.

- `/session-review [path ...]` — defaults to the current project; several paths are merged into one report
- Skill ranking split by who invoked it (you vs. the model), your real workflow drawn as diagrams, and verbatim quotes on how you build and debug with AI
- Suggests custom skills for routines that keep repeating, each with a `SKILL.md` draft and a user/project scope call
- Flags installed skills you never used and never needed in these sessions, with the command to remove each
- Skips automated SDK sessions and de-duplicates rewound messages; falls back to built-in diagram rules without `diagram-design`

[Read more →](plugins/session-review/README.md)

### jev-search

Answers Claude Code's built-in WebSearch with [Jev Search](https://github.com/superagents-lab/jev-search): Jev reads the request in plain language, picks the sources and time window, and ranks every result by relevance. When Jev cannot answer, the built-in search runs as before. The code lives in its own repository because it is also an npm package.

- Function hook on `WebSearch`, nothing changes in how you or the model search
- `jev_search` MCP tool for explicit `sources` / `window` filters, plus a skill on when to reach for it
- Also usable outside Claude Code as an MCP server or CLI via `npx jev-search-mcp`
- Function hooks are early access: set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` in your settings `env`

[Read more →](https://github.com/mukiwu/jev-search-mcp)

### hyday-pet

A virtual pet above your Claude Code prompt that feeds on the work you and Claude do together

- Every tool call and finished turn gives it XP, from egg to adult
- Whether Claude mostly edits files, runs commands or looks things up decides if it grows into a mole, otter, owl or chimera, and it branches again as an adult
- Tool errors give it germs; green tests make it well
- The side pane has an animated ASCII pet, rock paper scissors and guess the number, a coin shop for premium food and color styles, and a detail page
- Function hooks are early access: set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` in the `env` of your settings

[Read more →](plugins/hyday-pet/README.md)

### world-news

Taiwan's top news pinned under your Claude Code prompt

- Each message you send checks whether the cooldown has passed (30 minutes by default), then reads the Taiwan edition of Google News for your categories, in the background
- Eight sections plus seven international regions, picked like `/world-news 14ace`
- Only stories from the last day that you have not seen, in Google's order
- Nothing is added to the model's prompt, so no tokens and no cache misses
- Function hooks are early access: set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` in the `env` of your settings

[Read more →](plugins/world-news/README.md)

## License

MIT
