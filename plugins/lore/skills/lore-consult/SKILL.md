---
name: lore-consult
description: Read existing project lore before acting. Use before planning a feature or fixing a bug in a repo that has a docs/lore/ folder — it surfaces the relevant business rules, pitfalls, and API map, and flags entries that look stale.
---

# Lore Consult

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first for the structure and entry-meta format.

## When to use

Before planning a feature or starting a bug fix — but only when the repo actually has a `docs/lore/` folder. If there is no `docs/lore/`, there is nothing to consult: tell the user briefly and suggest running `lore-init` to scaffold one, rather than going quiet.

## Procedure

1. **Find the area.** Read `docs/lore/README.md` and map the current task to one (or more) area. A task can touch several areas; pick all that apply. If the Areas table marks any of them core (per lore-spec's Core areas), read those first — their rules bear the most weight.
2. **Reverse-lookup by file.** When you already know which files the task will touch, also grep `docs/lore/` for `` `code:` `` references matching those paths (prefix matches count — an entry pointing at `src/payments/` covers files under it). This catches entries filed under an area you didn't map in step 1; the `code:` meta exists precisely to make this lookup cheap.
3. **Read the core files.** For each matched area, read its `pitfalls.md` and `business-rules.md`. If you are planning a new feature, also read `api-map.md` when it is present. If `docs/lore/glossary.md` (or an area's `terms.md`) exists, also grep its `## ` headings for the concepts this task touches and read the matching term entries — the brief's own wording should follow the glossary. When one of these core files has grown long, don't read it wall-to-wall: grep its `## ` headings and meta lines first, then read only the entries that look relevant.
4. **Brief, don't dump.** Produce a SHORT brief covering only the rules and pitfalls that bear on this task, together with their `code:` links — plus at most 1-2 glossary terms when their definitions bear on the task — aim for at most ~5 bullets or ~300 words unless the user explicitly asks for more. Do not paste the whole area. Skip non-`active` entries (`resolved`, `obsolete`) unless one is directly relevant to what you are doing.
5. **Check the links.** For each entry you surfaced, verify its `code:` path still exists. If a path is missing or has moved, flag that entry as possibly stale.

## Just-in-time cleanup

When step 5 turns up a stale entry — or one that plainly contradicts the current code — offer to fix it on the spot: refresh its `updated:` date, rewrite it, or mark it `obsolete`. You are already in context, so this is cheap. Keep it a side-offer the user can decline; never force it, and never let it block the main task.

## Adoption feedback (best-effort)

Following lore-spec's feedback log: when your brief surfaces an entry, append a `surfaced` event for it to `docs/lore/.lore-feedback.jsonl`. Glossary terms are keyed `glossary.md#<Term>` (or `<area>/terms.md#<Term>` after a split). At the end of the task, reconcile each surfaced entry to its real outcome — `heeded` (the work followed it), `redundant` (it only confirmed what was already planned), or `ignored` (skipped, or it turned out wrong). This signal is what `lore-check` aggregates into its adoption report.

This is strictly best-effort and must never block or delay the task. If the log can't be written, skip it. A session that ends before reconciliation simply leaves the entry as `surfaced`. If `docs/lore/.gitignore` doesn't already ignore `.lore-feedback.jsonl`, add it.

## Guardrail

Relevance over completeness — a tight brief beats a full dump. Maintenance is an offer here, not an interruption. Feedback logging is best-effort and never blocks the task.
