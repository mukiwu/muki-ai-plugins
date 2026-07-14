---
name: lore-check
description: Use when asked whether the project's lore is healthy or still helping, or when the 30-day heartbeat suggests a re-check — audits coverage, link health, freshness, entry quality, adoption, and language health, read-only, then hands fixes off to lore-maintain, lore-capture, and lore-ul.
---

# Lore Check

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — the entry-meta format, the "What lore is / isn't" boundary test, and the feedback-log format all come from there.

## When to use

When you want to know whether a project's lore is healthy and actually pulling its weight: on an explicit request ("how healthy is our lore?", "is the lore still useful?"), or as a periodic check. Only meaningful when the repo has a `docs/lore/` folder — if there is none, say so briefly and suggest `lore-init`, rather than reporting an empty audit.

This skill is **read-only**. It never edits, marks, or deletes anything — it produces a report and hands the fixes off.

## Procedure

Run all seven checks, then produce one report. Use your file tools directly (Read, Grep, checking that paths exist) — there is no script to run.

1. **① Quality — the headline.** For each entry, apply lore-spec's boundary test against the current code: "Could a competent engineer reading the code recover this on their own?" If yes, the entry is noise, not lore. Report the pass rate (for example 10/12). This leads because noise drowns out real lore — a base full of code-derivable entries is actively worse than a small clean one.
2. **② Coverage.** Identify the codebase's top-level domains or subsystems, then compare against the existing areas. Report domains that have no lore at all — these are the gaps worth filling. Weight by the README's core marks: a core area with thin or no lore is a red flag, an uncovered peripheral area is merely a note. If no area is marked core yet, suggest asking the user which one is — as a report line, not an action.
3. **③ Link health.** Grep every `` `code:` `` reference and check each path still exists on disk. Report the broken-link count and ratio.
4. **④ Freshness.** Read each entry's `updated:` and `status:`. Report the age distribution, how many are older than ~180 days, and the `active` / `resolved` / `obsolete` breakdown.
5. **⑤ Retrievability.** Check that every entry has complete, greppable meta (`code:`, `updated:`, `status:`), and that the README Areas table matches the folders actually on disk. If `lore-consult` can't find or link an entry, it can't surface it.
6. **⑥ Adoption.** Read `docs/lore/.lore-feedback.jsonl` if it exists and aggregate per entry: how often each was surfaced, and the `heeded` / `redundant` / `ignored` split. Flag entries surfaced repeatedly but never heeded as review candidates. If the log is absent or empty, report "no data yet" — that is normal for a fresh base, not an error.
7. **⑦ Language.** Resolve the glossary per lore-spec. For lore's own format (`docs/lore/glossary.md` / any `<area>/terms.md`): check every term's meta is complete (`code:`, `updated:`, `status:`). For an external root `CONTEXT.md`: skip the meta check — that file carries none by design — and audit content only. Either way, spot-check the codebase for banned names (`not:` / `_Avoid_:`) still used in domain positions — a heuristic sample judged in context, not an exhaustive lint. Also spot-check liveness the other way: does the term still appear anywhere in the codebase (and, in lore's format, does its `code:` type still exist)? A term that fails both is a dead word — a document whose language no longer appears in the code has stopped working; flag it as an `obsolete` candidate for `lore-maintain`. Fold in each term's adoption from the feedback log (keys `glossary.md#<Term>` or `CONTEXT.md#<Term>`). If both a root `CONTEXT.md` and `docs/lore/glossary.md` exist, flag the duplication — per lore-spec the external file is canonical; hand the merge to `lore-maintain`. If there is no glossary at all, report "no glossary yet — `lore-ul` can bootstrap one"; that is a note, not a failure.

## Report

Produce one report. Give each dimension its own line with the raw numbers and a green / yellow status. Do NOT roll the seven into a single score — that hides what to fix. End with concrete next steps that point at the right skill:

- broken links, stale entries, suspected noise, low-adoption entries → `lore-maintain`
- coverage gaps → `lore-capture`
- incomplete term meta, banned-name drift, missing glossary → `lore-ul`

Yellow/green thresholds are heuristic: flag yellow when there is any broken link, the boundary-test pass rate is low, there are uncovered domains, or an entry is surfaced repeatedly with zero `heeded`. Don't chase precise numbers — the point is to steer the next action, not to grade.

After delivering the report, refresh the heartbeat stamp: write today's date to `docs/lore/.lore-last-check` (one line, `YYYY-MM-DD`), and make sure `docs/lore/.gitignore` ignores it. The SessionStart hook reads this stamp to suggest a re-check after ~30 days — it is how the health loop keeps running without anyone remembering to.

## Guardrail

Read-only toward the lore itself, always. `lore-check` never edits, marks, deletes, or refreshes any lore content — every fix is a handoff to `lore-maintain`, `lore-capture`, or `lore-ul`, which carry their own confirmation steps. The one exemption is bookkeeping: the gitignored `.lore-last-check` stamp (and, per lore-spec, the feedback log) are metadata about the check, not lore.
