---
name: lore-maintain
description: Audit and clean up docs/lore/ as it grows. Use to find stale, duplicate, or wrong entries, check that code links and the README index still hold, and prune obsolete content — marking over deleting, with confirmation for destructive actions.
---

# Lore Maintain

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — follow its Maintenance & deletion policy.

## When to use

On an explicit request ("tidy up lore", "clean out stale entries") or as a scheduled sweep that catches the long tail nobody is reading.

## Procedure

1. **Check every link.** Walk every entry across all areas and verify each `code:` path still exists on disk.
2. **Judge the broken and the old.** For an entry whose link is broken, or whose `updated:` date is long ago, read the current code and decide: is it still true, is it wrong, or is it merely outdated? Make this call by reading the code, not by guessing.
3. **Find duplicates.** Within each area, look for entries that overlap or say the same thing — these are merge candidates.
4. **Check the index for drift.** Compare the Areas table in `docs/lore/README.md` against the folders actually on disk, and note anything that no longer lines up.
5. **Produce a report.** For each entry, recommend an action: keep, refresh `updated:`, mark `resolved`, mark `obsolete`, merge, or flag as a delete-candidate.
6. **Apply per the deletion policy.** Follow lore-spec: **mark over delete**. Every destructive action — delete, archive, or merge — is confirmed item-by-item with the user. The default action is always "mark", never an automatic delete.

## Guardrail

Never delete on your own — report first, then act only on confirmation. Decide "still true?" and "wrong vs. merely outdated?" by reading the code, not by guessing.
