---
name: lore-capture
description: Record implicit project knowledge into docs/lore/. Use when you learn something code, types, tests, or git history can't reveal — a pitfall you hit, a behavior confirmed intentional, an API quirk, or the why behind a decision.
---

# Lore Capture

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — especially "What lore is / isn't" and the entry-meta format.

A SessionStart hook may nudge you toward this skill when you're working in a repo that has `docs/lore/` and the user starts explaining a product rule, a behavior, or a gotcha. The hook only prompts you — whether the knowledge is worth recording, and whether to invoke the skill, is still your call. You can also invoke it directly anytime you learn something worth keeping.

## When to use

When you learn something the current code can't tell you on its own: a pitfall you hit and its cause, a behavior confirmed intentional, an API quirk or contract, or the *why* behind a decision.

## Procedure

1. **Boundary check.** Apply lore-spec's test: "Could a competent engineer reading the current code recover this on their own?" If yes, it is not lore — don't record it. Only the things code, types, tests, and git history can't reveal belong here.
2. **Pick the area.** Choose an existing `<area>/`, or create a new one from the templates with its own `pitfalls.md` and `business-rules.md`. When the area is marked core in the README, lean toward recording on a borderline call — core knowledge pays the highest interest.
3. **Pick the file.** A gotcha goes in `pitfalls.md`; a rule or the *why* behind something goes in `business-rules.md`; a topic deep enough to stand alone gets its own `<topic>.md`. Any brand-new file starts with lore-spec's file frontmatter (`area:` + `kind:`, e.g. `kind: topic`) so it stays greppable like the rest of the base.
4. **Dedup.** Scan the target file for an entry that already covers this. If you find an overlap, ask the user whether to merge it, supersede the old one, or add this as a separate entry. If the user doesn't choose, default to a separate entry and note the overlap in its body.
5. **Write the entry.** Add a `## heading` followed by the one-line meta directly under it: `code:` (the file path, with an optional `→ symbol`), `updated:` (today's date), and `status:` `active`. When the entry hangs off a glossary term, add `term:` with the term's exact heading to the meta line. Then write the body — what it is, why, and what to do; include a concrete example when you can, examples are what pin the boundary. When the rule has an observable "done right" state, also say what that looks like — a success criterion makes the entry checkable, not just readable.
6. **Update the index.** If you created a new area or a new file, add it to the Areas table in `docs/lore/README.md`.

## Guardrail

Never record what the code already expresses — its structure, what a function does, or a fix that is already visible in git. That noise drowns out the real lore.

## Note on the date

For the `updated:` value, follow lore-spec's date rule: use a real, known current date or ask the user — never invent or backdate one.
