---
name: lore-consult
description: Read existing project lore before acting. Use before planning a feature or fixing a bug in a repo that has a docs/lore/ folder — it surfaces the relevant business rules, pitfalls, and API map, and flags entries that look stale.
---

# Lore Consult

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first for the structure and entry-meta format.

## When to use

Before planning a feature or starting a bug fix — but only when the repo actually has a `docs/lore/` folder. If there is no `docs/lore/`, there is nothing to consult: tell the user briefly and suggest running `lore-init` to scaffold one, rather than going quiet.

## Procedure

1. **Find the area.** Read `docs/lore/README.md` and map the current task to one (or more) area. A task can touch several areas; pick all that apply.
2. **Read the core files.** For each matched area, read its `pitfalls.md` and `business-rules.md`. If you are planning a new feature, also read `api-map.md` when it is present.
3. **Brief, don't dump.** Produce a SHORT brief covering only the rules and pitfalls that bear on this task, together with their `code:` links — aim for at most ~5 bullets or ~300 words unless the user explicitly asks for more. Do not paste the whole area. Skip `status: obsolete` entries unless one is directly relevant to what you are doing.
4. **Check the links.** For each entry you surfaced, verify its `code:` path still exists. If a path is missing or has moved, flag that entry as possibly stale.

## Just-in-time cleanup

When step 4 turns up a stale entry — or one that plainly contradicts the current code — offer to fix it on the spot: refresh its `updated:` date, rewrite it, or mark it `obsolete`. You are already in context, so this is cheap. Keep it a side-offer the user can decline; never force it, and never let it block the main task.

## Adoption feedback (best-effort)

Following lore-spec's feedback log: when your brief surfaces an entry, append a `surfaced` event for it to `docs/lore/.lore-feedback.jsonl`. At the end of the task, reconcile each surfaced entry to its real outcome — `heeded` (the work followed it), `redundant` (it only confirmed what was already planned), or `ignored` (skipped, or it turned out wrong). This signal is what `lore-check` aggregates into its adoption report.

This is strictly best-effort and must never block or delay the task. If the log can't be written, skip it. A session that ends before reconciliation simply leaves the entry as `surfaced`. If `docs/lore/.gitignore` doesn't already ignore `.lore-feedback.jsonl`, add it.

## Guardrail

Relevance over completeness — a tight brief beats a full dump. Maintenance is an offer here, not an interruption. Feedback logging is best-effort and never blocks the task.
