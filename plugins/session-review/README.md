# session-review

[繁體中文版](README.zh-TW.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that reads every AI session you had in a project — Claude Code and Codex — and turns it into one interactive HTML report about *how you actually work with AI*.

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install session-review
```

## Quick Start

```
/session-review                                  # the project of the current session
/session-review ~/code/my-app                    # a specific project
/session-review ~/code/web ~/code/admin          # several projects, merged into one report
/session-review --since 2026-09-01               # only sessions active after this date
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

## How It Works

1. `scripts/collect.py` scans `~/.claude/projects` and `~/.codex/sessions`, keeps sessions whose working directory is inside the given project(s), drops automated SDK runs (for example per-commit security reviews), and de-duplicates messages replayed by rewinds.
2. Claude reads every remaining message (fanning out to subagents when the transcript is large) and extracts patterns and quotes.
3. The report is written as a single HTML file and published as an artifact when the Artifact tool is available; otherwise it opens locally.

Diagrams use the `diagram-design` skill if you have it installed, and fall back to built-in drawing rules with the same palette if you don't.

## User or Project Scope?

Every suggested skill gets a scope call:

- **Project scope** (`<project>/.claude/skills/`, committed) — it mentions things only this project has (APIs, components, branch names, business rules), or teammates should follow it too.
- **User scope** (`~/.claude/skills/`) — it's about your personal habits, touches your private notes, or the same pattern shows up in more than one project.

## Requirements

- Python 3.9+ (for `collect.py`)
- Node.js (optional, to syntax-check the report's script)

## Privacy

Everything is read locally. The report quotes your own messages, so check it before sharing an artifact link with anyone.

## License

MIT
