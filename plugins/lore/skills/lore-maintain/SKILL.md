---
name: lore-maintain
description: Use when lore looks stale or noisy, when a lore-check report flags problems, or on a periodic sweep — finds stale, duplicate, or wrong entries, checks that code links and the README index still hold, and prunes obsolete content; marking over deleting, with confirmation for destructive actions.
---

# Lore Maintain

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — follow its Maintenance & deletion policy.

## When to use

On an explicit request ("tidy up lore", "clean out stale entries") or as a scheduled sweep that catches the long tail nobody is reading. Also the natural follow-up to a `lore-check` report: its flagged broken links, stale entries, suspected noise, and low-adoption entries (surfaced repeatedly but never heeded) are your work list.

## Procedure

1. **Check every link.** Walk every entry across all areas — including `glossary.md` and any `<area>/terms.md` — and verify each `code:` path still exists on disk.
2. **Judge the broken and the old.** For an entry whose link is broken, or whose `updated:` date is long ago, read the current code and decide: is it still true, is it wrong, or is it merely outdated? Treat an `updated:` date older than ~180 days as "long ago" (unless the user sets a different threshold) — but the date only decides what to re-read, never whether the entry is stale. That call is always made by reading the code, not by guessing. For a glossary term, stale means the concept (or its `code:` type) no longer exists or was renamed — follow the spec's term-evolution rule: mark the old term `obsolete` and point it at the new one, rather than deleting.
3. **Find duplicates.** Within each area, look for entries that overlap or say the same thing — these are merge candidates.
4. **Check the index for drift.** Compare the Areas table in `docs/lore/README.md` against the folders actually on disk, and note anything that no longer lines up.
5. **Produce a report.** For each entry, recommend an action: keep, refresh `updated:`, rewrite, mark `resolved`, mark `obsolete`, merge, or flag as a delete-candidate. For low-adoption entries (surfaced repeatedly, never heeded), read their `note` fields in the feedback log before judging — an entry that keeps getting ignored may be true but badly written, and then the right action is a rewrite, not a mark or a delete.
6. **Apply per the deletion policy.** Follow lore-spec: **mark over delete**. Every destructive action — delete, archive, or merge — is confirmed with the user. Don't batch-confirm with a single blanket "yes": confirm each entry, or a small group you have explicitly listed out (per lore-spec, batch-archiving an obsolete pile is fine when the items are listed and the user approves them). The default action is always "mark", never an automatic delete. As you apply each confirmed action, append an `accepted` (the user approved it) or `declined` (the user refused it) event to lore-spec's feedback log — best-effort, never blocking.

## Report format (suggested)

Group step 5's recommendations under clear action headings so the user can confirm or decline each line. This is a suggested shape, not a rigid contract:

```markdown
## Lore maintenance report
- keep: <entry heading> (`code: ...`)
- refresh-updated: <entry heading>
- rewrite: <entry heading> — reason: surfaced 3x, never heeded; body buries the rule
- mark-resolved: <entry heading>
- mark-obsolete: <entry heading>
- merge-candidates: <heading A> + <heading B>
- delete-candidates: <heading> — reason: never true
```

## Guardrail

Never delete on your own — report first, then act only on confirmation. Decide "still true?" and "wrong vs. merely outdated?" by reading the code, not by guessing.

## Note on the date

When you refresh an `updated:` value, follow lore-spec's date rule: use a real, known current date or ask the user — never invent or backdate one.
