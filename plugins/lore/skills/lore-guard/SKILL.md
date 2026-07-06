---
name: lore-guard
description: Check pending code changes against recorded lore before committing. Use after implementing a change (and before commit / PR) in a repo that has docs/lore/ — it maps the changed files to lore entries through their code: links and reports any business rule, pitfall, or glossary naming rule the change violates. Read-only for both code and lore.
---

# Lore Guard

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — the entry-meta format and the feedback-log format come from there.

`lore-consult` reads lore *before* work starts. This skill is the other bookend: it re-checks the *result* of the work, because rules that were surfaced can still get lost during implementation, and rules nobody thought to surface can turn out to apply. Without this pass, nothing stands between a diff that quietly breaks a recorded business rule and the commit that ships it.

## When to use

After implementing a change and before committing or opening a PR, in a repo that has `docs/lore/`. Also on an explicit ask like "does this change break any of our rules?". If there is no `docs/lore/`, say so briefly and move on — there is nothing to guard against.

## Procedure

1. **Collect the changed files.** Take the union of staged and unstaged changes (`git diff --name-only HEAD`, plus untracked files that belong to the change). If the user points at a specific diff or branch, use that instead.
2. **Reverse-lookup by `code:` link.** Grep every `` `code:` `` reference across `docs/lore/` and keep the entries whose path intersects the changed files. Match by prefix too — an entry pointing at `src/payments/` covers any changed file under it, and an entry pointing at a file covers that file's changes.
3. **Widen by area.** Map the changed files to areas via the `docs/lore/README.md` index, and scan those areas' `pitfalls.md` / `business-rules.md` headings for entries that clearly bear on the change even though their `code:` link points elsewhere. The `code:` match is precise but incomplete; this step catches the rest. Skip non-`active` entries unless one is directly relevant.
4. **Judge each matched entry against the actual diff.** Read the diff hunks, not just the filenames, and classify: **violated** (the change conflicts with the entry), **respected** (the change complies), or **not applicable**. When an entry contradicts the current code but the diff isn't what broke it, don't call it a violation — flag it as possibly stale and point at `lore-maintain`.
5. **Naming check.** If `docs/lore/glossary.md` (or an area's `terms.md`) exists, scan the diff's added lines for identifiers and user-facing strings that hit a term's `not:` list. Judge semantics before flagging: `client` naming an HTTP client is fine; `client` naming the paying party when the glossary says `Customer` is a violation. Read the hunk, not just the match. Report a hit like any other violation — the term's heading, the `not:` name the diff introduced, and the canonical name to use instead.
6. **Report.** Violations first: the entry heading, its `code:` link, what in the diff conflicts, and the direction a fix would take. You never edit code yourself — fixing is the caller's job. When nothing matches, still say so in one line ("lore-guard: N entries checked, no conflicts"), so the user knows the pass actually ran.
7. **Feedback log (best-effort).** Per lore-spec: append a `surfaced` event for each entry you judged (glossary terms keyed `glossary.md#<Term>`), then reconcile — `heeded` when a violation was flagged and the user fixed it, `redundant` when the change already respected the entry, `ignored` when the user dismissed the flag. Never let logging block or delay the report.

## Guardrail

Read-only, both directions: never edit the code under review, and never edit lore. A violation is a report, not an auto-fix. Relevance over completeness — judging five entries that actually touch the diff beats listing fifty that don't.
