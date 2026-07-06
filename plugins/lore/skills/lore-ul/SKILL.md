---
name: lore-ul
description: Build and align the project's ubiquitous language in docs/lore/glossary.md. Use when a conversation hits a vague or overloaded term, when the same word means different things in different places, when code names disagree with how the user talks — or to bootstrap a glossary for a project that has none.
---

# Lore UL (Ubiquitous Language)

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — its Glossary section defines the file location, the term-entry meta, collision handling, and the split rule.

The other lore skills key knowledge by code location; this one keys it by concept. A shared vocabulary is what lets rules hang off concepts instead of file paths, lets the user and the agent challenge each other's wording, and gives `lore-guard` something to check names against.

## When to use

- A conversation hits a vague or overloaded term ("account" — the Customer or the User?).
- The user's words and the code's names disagree, or the same word is being used for two different things.
- The project has no glossary yet and wants one (bootstrap).
- The user explicitly asks to define, align, or clean up terminology.

## Two modes

Look at `docs/lore/glossary.md`: missing or empty → bootstrap mode; otherwise → alignment mode.

### Alignment mode (the everyday one)

Work the ambiguity one question at a time, and attach your recommended answer to every question:

1. **Sharpen fuzzy words.** When a term is vague or overloaded, propose precise candidates: "You said account — do you mean the Customer or the User? Those are different things here."
2. **Challenge against the glossary.** When the user's usage conflicts with an existing entry, call it out immediately: "The glossary defines cancellation as voiding the whole order, but you seem to mean partial — which is it?"
3. **Probe boundaries with concrete scenarios.** Invent edge cases that force precision: "A company subscribes and an employee logs in — who is the Customer in that sentence?"
4. **Cross-check the code.** When the user states what a term means, check whether the code agrees, and surface contradictions. If a question can be answered by reading the codebase, read the codebase instead of spending a question on it.
5. **Write the term the moment it settles.** Update `glossary.md` inline, entry by entry — never batch. Rejected candidates go into the winning term's `not:` list so `lore-guard` can enforce the choice later.

### Bootstrap mode (cold start)

1. Scan the README, the lore areas, and the main type/model names for candidate terms. Cap the list at ~10 — it is an interview agenda, not a generated glossary.
2. Walk the candidates one at a time with the user, using the alignment moves above. Confirmed terms get written; unclear ones are dropped or parked.
3. When the first term settles, create `docs/lore/glossary.md` from `${CLAUDE_PLUGIN_ROOT}/reference/templates/glossary.md.tmpl` and add a `glossary.md` line to the Optional section of `docs/lore/README.md`.

## Collisions and splits

Follow the spec: a cross-area collision stays in the global file with area-qualified headings (`## Customer (billing)`) and `area:` mandatory on both entries; a collision inside one area means the concept must be split into two differently-named terms. Propose moving an area's terms to `<area>/terms.md` only once it holds ~10+ of them, and only with the user's confirmation.

## Adoption feedback (best-effort)

Per lore-spec's feedback log: when you challenge usage with an existing entry, append a `surfaced` event keyed `glossary.md#<Term>` (or `<area>/terms.md#<Term>` after a split), then reconcile it — `heeded` (the wording changed to follow it, or the entry was sharpened), `redundant` (usage already matched), or `ignored` (the user overrode it). Never let logging block or delay the session.

## Guardrail

Terms are aligned, never generated — every entry is confirmed by the user before it is written. The glossary holds language only: definitions, boundaries, examples. No implementation details, no specs, no plans. `updated:` dates follow lore-spec's date rule.
