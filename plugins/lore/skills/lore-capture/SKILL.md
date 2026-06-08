---
name: lore-capture
description: Record implicit project knowledge into docs/lore/. Use when you learn something code, types, tests, or git history can't reveal — a pitfall you hit, a behavior confirmed intentional, an API quirk, or the why behind a decision.
---

# Lore Capture

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — especially "What lore is / isn't" and the entry-meta format.

## When to use

When you learn something the current code can't tell you on its own: a pitfall you hit and its cause, a behavior confirmed intentional, an API quirk or contract, or the *why* behind a decision.

## Procedure

1. **Boundary check.** Apply lore-spec's test: "Could a competent engineer reading the current code recover this on their own?" If yes, it is not lore — don't record it. Only the things code, types, tests, and git history can't reveal belong here.
2. **Pick the area.** Choose an existing `<area>/`, or create a new one from the templates with its own `pitfalls.md` and `business-rules.md`.
3. **Pick the file.** A gotcha goes in `pitfalls.md`; a rule or the *why* behind something goes in `business-rules.md`; a topic deep enough to stand alone gets its own `<topic>.md`.
4. **Dedup.** Scan the target file for an entry that already covers this. If you find an overlap, ask the user whether to merge it, supersede the old one, or add this as a separate entry.
5. **Write the entry.** Add a `## heading` followed by the one-line meta directly under it: `code:` (the file path, with an optional `→ symbol`), `updated:` (today's date), and `status:` `active`. Then write the body — what it is, why, and what to do.
6. **Update the index.** If you created a new area or a new file, add it to the Areas table in `docs/lore/README.md`.

## Guardrail

Never record what the code already expresses — its structure, what a function does, or a fix that is already visible in git. That noise drowns out the real lore.

## Note on the date

For `updated:`, use the known current date or ask the user. Do not invent a date.
