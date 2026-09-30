# session-review

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that reads every AI session you had in a project — Claude Code and Codex — and turns it into one interactive HTML report about *how you actually work with AI*.

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install session-review
```

For Codex, Cursor, Gemini CLI, and other agents:

```bash
npx skills add mukiwu/muki-ai-plugins
```

When the installer lists the skills, pick `session-review`.

## Quick Start

```
/session-review                                  # the project of the current session
/session-review ~/code/my-app                    # a specific project
/session-review ~/code/web ~/code/admin          # several projects, merged into one report
/session-review --since 2026-09-01               # only sessions active after this date
/session-review --no-global                      # skip the all-projects usage scan (faster)
```

With no path it uses the git root of the current directory (or the directory itself outside git). Several paths are merged, and every session, skill, and quote is tagged with its project.

## What the Report Answers

| Section | What you get |
|---------|--------------|
| **Timeline** | Every session as a bar on a shared date axis, messages per day, and a rough breakdown of what your messages are about |
| **Skill ranking** | Skills sorted by use, split into ones *you* typed as `/commands` and ones the *model* invoked on its own, compared with the workflow your `CLAUDE.md` claims |
| **Your workflow** | The routine you really follow, drawn as a swimlane (you vs. AI) and a debugging flowchart, with step-by-step notes |
| **How you talk to AI** | Patterns for building a feature from zero and for debugging, each backed by verbatim quotes, plus the moments you got frustrated |
| **Quote library** | Filterable, searchable cards of your own words |
| **Skills to build** | Routines that repeat across sessions, with evidence counts, what the skill would do, a ready-to-copy `SKILL.md` draft, and whether it belongs in **user** or **project** scope |
| **Skills to remove** | Installed skills with zero uses in these sessions *and* no related request anywhere in your messages, grouped into remove / not needed in this project / keep but fix the description / wait and see, with the exact removal command for each |

## How It Works

1. `scripts/collect.py` scans `~/.claude/projects` and `~/.codex/sessions`, keeps sessions whose working directory is inside the given project(s), drops automated SDK runs (for example per-commit security reviews), and de-duplicates messages replayed by rewinds.
2. Claude reads every remaining message (fanning out to subagents when the transcript is large) and extracts patterns and quotes.
3. For removal suggestions it inventories every installed skill (user, project, and plugin), counts uses here and across all your projects, skips internal skills and ones other skills depend on, and searches your messages for related needs before recommending anything. It never deletes.
4. The report is written as a single HTML file and published as an artifact when the Artifact tool is available; otherwise it opens locally.

Diagrams use the `diagram-design` skill if you have it installed, and fall back to built-in drawing rules with the same palette if you don't.

## User or Project Scope?

Every suggested skill gets a scope call:

- **Project scope** (`<project>/.claude/skills/`, committed) — it mentions things only this project has (APIs, components, branch names, business rules), or teammates should follow it too.
- **User scope** (`~/.claude/skills/`) — it's about your personal habits, touches your private notes, or the same pattern shows up in more than one project.

## Requirements

- Python 3.9+ (for `collect.py`)
- Node.js (optional, to syntax-check the report's script)
- Google Chrome, Chromium, or Edge (for the pre-publish layout check at 1280 / 900 / 600 / 390 px; set `CHROME` if it is not in a standard location)

## Privacy

Everything is read locally. The report quotes your own messages, so check it before sharing an artifact link with anyone.

## License

MIT
