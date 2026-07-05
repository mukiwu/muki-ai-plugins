# lore

[繁體中文版](README.zh-TW.md)

A plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to scaffold, consult, capture, guard, maintain, and health-check project **lore** — the implicit knowledge your codebase carries but can't show on its own.

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

## The Six Skills

| Skill | When it triggers |
|-------|------------------|
| **lore-init** | Scaffold `docs/lore/` for the first time — when a project has no lore yet, or you ask to initialize / bootstrap it. |
| **lore-consult** | Read lore before acting — before planning a feature or fixing a bug, it surfaces the relevant rules, pitfalls, and API map, and flags entries that look stale. |
| **lore-capture** | Record implicit knowledge — when you learn something the code can't reveal (a pitfall, an intentional behavior, an API quirk, a decision's *why*). |
| **lore-guard** | Check a diff against recorded lore before commit / PR — maps changed files to entries via their `code:` links and reports any business rule or pitfall the change violates. |
| **lore-maintain** | Clean up as lore grows — find stale, duplicate, or wrong entries, check that code links and the index still hold, and prune obsolete content. |
| **lore-check** | Audit whether the lore is actually helping — a read-only health report across coverage, link health, freshness, entry quality, and adoption, then hands the fixes to lore-maintain / lore-capture. |

## The Loop

The six skills close a loop that keeps the lore alive instead of rotting like most docs:

1. **capture** writes knowledge down as you learn it (the SessionStart hook nudges at the right moments).
2. **consult** reads it back before the next feature or bug fix — so it actually shapes the work.
3. **guard** re-checks the finished diff against it before commit — so recorded rules can't be silently broken.
4. Both log whether each surfaced entry was **heeded, redundant, or ignored**.
5. **check** aggregates that signal into a health report (a heartbeat nudge suggests one every ~30 days), and **maintain** acts on it — refreshing, rewriting, or retiring entries.

Knowledge that keeps helping stays; knowledge that stops helping gets flagged and fixed. That is the self-correcting part.

## Quick Start

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install lore
```

Then, in the project you want to track:

1. Run `lore-init` to scaffold `docs/lore/`.
2. Add a one-line pointer to your `CLAUDE.md` (or `AGENTS.md`) so the other skills trigger naturally, e.g.:

   > Project lore lives in `docs/lore/` — consult it before planning / bug-fixing, guard diffs against it before committing, and capture implicit knowledge into it.

From then on, `lore-consult` reads before you act, `lore-capture` records what you learn, and `lore-guard` checks your diffs before they ship.

## Updating

The plugin ships through the marketplace, so pulling a new version takes two steps:

1. Refresh the marketplace. Claude Code keeps a local cached clone, so it won't see a new version until you refresh:

   ```bash
   /plugin marketplace update muki-ai-plugins
   ```

   This pulls the latest commit and bumps the installed plugin.

2. Confirm (or update manually) from the plugin menu:

   ```bash
   /plugin
   ```

   It should report **lore** at the latest version; if not, update it from there.

Step 1 is the one that matters — skip it and Claude Code keeps serving the cached version, so it looks like there's no update available.

## Maintenance Philosophy

**Mark over delete.** Hard-won knowledge keeps its lesson even after it stops being current, so outdated-but-once-true entries get marked `obsolete` rather than removed. Every destructive action (delete / archive / merge) requires your confirmation — the default is always "mark".

## Health Check

`lore-check` answers a question the other skills don't: *is this lore actually helping?* It runs a read-only audit and reports per dimension — entry quality (does each still pass the boundary test?), coverage gaps, broken links, staleness, retrievability, and **adoption**. It never edits anything; it hands fixes to `lore-maintain` and `lore-capture`.

Adoption is the real-use signal. When `lore-consult` or `lore-guard` surfaces an entry and when `lore-maintain` proposes an action, the outcome is logged (best-effort) to `docs/lore/.lore-feedback.jsonl` — `heeded`, `redundant`, or `ignored`, with an optional note saying why. Entries that get surfaced again and again but never heeded bubble up as review candidates. The log lives in your project and is gitignored by default.

Each run also refreshes a gitignored `.lore-last-check` stamp; when it's more than ~30 days old, the SessionStart hook suggests a re-check, so the health loop keeps running without anyone remembering to.

## License

MIT
