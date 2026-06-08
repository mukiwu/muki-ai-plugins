# lore

[繁體中文版](README.zh-TW.md)

A plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to scaffold, consult, capture, and maintain project **lore** — the implicit knowledge your codebase carries but can't show on its own.

## What Is Lore

Lore is the knowledge that code, types, tests, and git history can't reveal: the business rules nobody wrote down, the *why* behind a decision, the API quirks you only learn by getting burned, and the pitfalls that bite you twice. The test: *could a competent engineer recover this just by reading the current code?* If yes, it isn't lore.

It lives under `docs/lore/`:

```
docs/lore/
  README.md            # the single entry point: how-to-use + index
  <area>/              # one axis: by domain/subsystem (payments/, auth/, ...)
    pitfalls.md        # core: gotchas (what breaks, don't-do-X)
    business-rules.md  # core: rules & the "why" code can't show
  api-map.md           # optional: feature <-> API <-> entry points
  architecture/        # optional: cross-cutting tech-choice rationale
```

Each entry carries a one-line, greppable meta directly under its heading:

```markdown
## Short title of the gotcha

`code:` `src/payments/charge.ts` → `chargeCard` · `updated:` `2026-06-08` · `status:` `active`
```

- `code:` — the file path (and optional `→ symbol`) the entry points at.
- `updated:` — ISO date the entry was last verified.
- `status:` — `active` | `resolved` | `obsolete`.

## The Four Skills

| Skill | When it triggers |
|-------|------------------|
| **lore-init** | Scaffold `docs/lore/` for the first time — when a project has no lore yet, or you ask to initialize / bootstrap it. |
| **lore-consult** | Read lore before acting — before planning a feature or fixing a bug, it surfaces the relevant rules, pitfalls, and API map, and flags entries that look stale. |
| **lore-capture** | Record implicit knowledge — when you learn something the code can't reveal (a pitfall, an intentional behavior, an API quirk, a decision's *why*). |
| **lore-maintain** | Clean up as lore grows — find stale, duplicate, or wrong entries, check that code links and the index still hold, and prune obsolete content. |

## Quick Start

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install lore
```

Then, in the project you want to track:

1. Run `lore-init` to scaffold `docs/lore/`.
2. Add a one-line pointer to your `CLAUDE.md` (or `AGENTS.md`) so the other skills trigger naturally, e.g.:

   > Project lore lives in `docs/lore/` — consult it before planning / bug-fixing, and capture implicit knowledge into it.

From then on, `lore-consult` reads before you act and `lore-capture` records what you learn.

## Maintenance Philosophy

**Mark over delete.** Hard-won knowledge keeps its lesson even after it stops being current, so outdated-but-once-true entries get marked `obsolete` rather than removed. Every destructive action (delete / archive / merge) requires your confirmation — the default is always "mark".

## License

MIT
