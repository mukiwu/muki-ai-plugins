# Lore Spec

Lore is the implicit knowledge a project carries that its code, types, tests, and git history can't reveal on their own — the business rules, the rationale behind decisions, the API maps, and the pitfalls you only learn by getting burned. It is standalone: it does not depend on any other documentation system, glossary, or index to be useful. Every `lore` skill reads this spec first so that the structure, frontmatter, and entry meta they produce stay consistent.

## What lore is / isn't

Lore captures what reading the current code can never give you back.

**IS lore (record it):**
- A pitfall you actually hit, together with its cause.
- A behavior you confirmed is intentional (not a bug, even though it looks like one).
- An API quirk or contract that isn't visible in the code calling it.
- The *why* behind a decision — the constraint, trade-off, or history that shaped it.
- A non-obvious business rule that the code enforces but never explains.

**NOT lore (do not record):**
- What a function does, or how the code is structured / imported.
- A past fix that is already visible in git history.
- Anything a reader could derive simply by reading the code.

**The test:** "Could a competent engineer reading the current code recover this on their own?" If the answer is yes, it is not lore — leave it out.

## Directory structure

```
docs/lore/
  README.md            # the single entry point: how-to-use + index
  <area>/              # one axis: by domain/subsystem (payments/, auth/, ...)
    pitfalls.md        # core: gotchas (what breaks, don't-do-X)
    business-rules.md  # core: rules & the "why" code can't show
    <topic>.md         # optional: a topic that deserves its own file
    index.md           # optional: only when an area has many files (~5+)
  architecture/        # optional area: cross-cutting tech-choice "why"
  api-map.md           # optional: feature <-> API <-> entry points (API-heavy projects)
```

Rules:
- **Core** = `README.md` + each area's `pitfalls.md` and `business-rules.md`. Everything else is optional.
- **No mandatory MOC.** The index lives in `README.md`; an area only grows its own `index.md` once it has many files (~5+).
- **One axis.** Everything is an `<area>/` keyed by domain/subsystem — no mixing of a `features/` wrapper layer, top-level areas, and loose files.
- **Vocabulary:** always call it "lore". Don't relabel it "cookbook", "wiki", or anything else.

## File frontmatter

Every `pitfalls.md` / `business-rules.md` / topic file starts with a light frontmatter block:

```yaml
---
area: payments
kind: pitfalls   # pitfalls | business-rules | topic | architecture | api-map
---
```

Keep it light — only `area` and `kind`. Per-entry recency does not belong here; it lives in the entry meta so it isn't duplicated.

## Entry meta

Inside the aggregate files, each `## entry` carries a one-line meta directly under its heading, then the body:

```markdown
## Short title of the gotcha

`code:` `src/utils/energy/contractCalc.ts` → `findOptimalContract` · `updated:` `2026-06-08` · `status:` `active`

What breaks, why, and what to do instead.
```

- `code:` — the file path this entry points at, with an optional `→ symbol`. Multiple `code:` references are allowed. Use `—` when the entry isn't tied to any specific code.
- `updated:` — the ISO date (`YYYY-MM-DD`) the entry was last verified.
- `status:` — one of `active` (still true), `resolved` (the problem was fixed but the history is worth keeping), or `obsolete` (no longer applies).

The format is deliberately both human-readable AND greppable: tools grep `` `code:` `` to check that the linked paths still exist, and `status:` lets stale entries be marked rather than silently deleted.

## Maintenance & deletion policy

**Principle: mark over delete.** Lore is hard-won knowledge — "we did it this way, then found it breaks" keeps its lesson even after it stops being current. Default to marking, not deleting.

- **Outdated but was correct** → set `status: obsolete` and leave it in place. `lore-consult` skips non-`active` entries by default, so it stops cluttering briefs without losing the lesson. Don't delete it.
- **Wrong / never true** → this is misinformation, so delete it (git keeps the history). This requires confirmation.
- **Fixed but worth keeping** → set `status: resolved`.
- **Obsolete pile-up hurting readability** → batch-archive to an `archive.md` (per area, or at the lore root) or delete; a human decides which.
- **Two cleanup paths, complementary:** just-in-time cleanup woven into `lore-consult` / `lore-capture` (cheap, because you're already in context), plus a periodic sweep via `lore-maintain` (catches the long tail no one is reading).
- **Destructive actions (delete / archive / merge) always require human confirmation.** The default action is "mark", never an automatic delete.

## Plays well with others

If a project also keeps a domain glossary (the *what* — vocabulary and concepts) or a code-structure index (the *where* — files, imports, layers), lore is the third leg: the *why* and the gotchas. The three are complementary but distinct. Lore stands on its own and does not require either of them to be present.
