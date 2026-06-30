---
name: lore-check
description: Audit a project's docs/lore/ and report whether it is actually helping — coverage, link health, freshness, entry quality (does each pass the "could you recover it from code?" test), and adoption (were surfaced entries acted on). Read-only: it diagnoses, then hands fixes off to lore-maintain and lore-capture.
---

# Lore Check

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — the entry-meta format, the "What lore is / isn't" boundary test, and the feedback-log format all come from there.

## When to use

When you want to know whether a project's lore is healthy and actually pulling its weight: on an explicit request ("how healthy is our lore?", "is the lore still useful?"), or as a periodic check. Only meaningful when the repo has a `docs/lore/` folder — if there is none, say so briefly and suggest `lore-init`, rather than reporting an empty audit.

This skill is **read-only**. It never edits, marks, or deletes anything — it produces a report and hands the fixes off.

## Procedure

Run all six checks, then produce one report. Use your file tools directly (Read, Grep, checking that paths exist) — there is no script to run.

1. **① Quality — the headline.** For each entry, apply lore-spec's boundary test against the current code: "Could a competent engineer reading the code recover this on their own?" If yes, the entry is noise, not lore. Report the pass rate (for example 10/12). This leads because noise drowns out real lore — a base full of code-derivable entries is actively worse than a small clean one.
2. **② Coverage.** Identify the codebase's top-level domains or subsystems, then compare against the existing areas. Report domains that have no lore at all — these are the gaps worth filling.
3. **③ Link health.** Grep every `` `code:` `` reference and check each path still exists on disk. Report the broken-link count and ratio.
4. **④ Freshness.** Read each entry's `updated:` and `status:`. Report the age distribution, how many are older than ~180 days, and the `active` / `resolved` / `obsolete` breakdown.
5. **⑤ Retrievability.** Check that every entry has complete, greppable meta (`code:`, `updated:`, `status:`), and that the README Areas table matches the folders actually on disk. If `lore-consult` can't find or link an entry, it can't surface it.
6. **⑥ Adoption.** Read `docs/lore/.lore-feedback.jsonl` if it exists and aggregate per entry: how often each was surfaced, and the `heeded` / `redundant` / `ignored` split. Flag entries surfaced repeatedly but never heeded as review candidates. If the log is absent or empty, report "no data yet" — that is normal for a fresh base, not an error.

## Report

Produce one report. Give each dimension its own line with the raw numbers and a green / yellow status. Do NOT roll the six into a single score — that hides what to fix. End with concrete next steps that point at the right skill:

- broken links, stale entries, suspected noise, low-adoption entries → `lore-maintain`
- coverage gaps → `lore-capture`

Yellow/green thresholds are heuristic: flag yellow when there is any broken link, the boundary-test pass rate is low, there are uncovered domains, or an entry is surfaced repeatedly with zero `heeded`. Don't chase precise numbers — the point is to steer the next action, not to grade.

## Guardrail

Read-only, always. `lore-check` reports and recommends; it never edits, marks, deletes, or refreshes anything itself. Every fix is a handoff to `lore-maintain` or `lore-capture`, which carry their own confirmation steps.
