# Lore Spec

Lore is the implicit knowledge a project carries that its code, types, tests, and git history can't reveal on their own — the business rules, the rationale behind decisions, the API maps, and the pitfalls you only learn by getting burned. It is standalone: it does not depend on any other documentation system or index to be useful. Every `lore` skill reads this spec first so that the structure, frontmatter, and entry meta they produce stay consistent.

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
  glossary.md          # optional: shared vocabulary (ubiquitous language), one entry per term
```

Rules:
- **Core files** = `README.md` + each area's `pitfalls.md` and `business-rules.md`. Everything else is optional. (Distinct from the *core area* mark below — that one is about which area matters most, not which files are mandatory.)
- **No mandatory MOC.** The index lives in `README.md`; an area only grows its own `index.md` once it has many files (~5+).
- **One axis.** Everything is an `<area>/` keyed by domain/subsystem — no mixing of a `features/` wrapper layer, top-level areas, and loose files.
- **Vocabulary:** always call it "lore". Don't relabel it "cookbook", "wiki", or anything else.

## Core areas

Not every area matters equally. The area(s) holding the project's competitive heart — the logic you would keep secret, the part that makes the product worth building — can carry a **core** mark in the README Areas table (a `★` in a Core column). Like glossary terms, core status is aligned, never inferred: the mark is set only on the user's explicit confirmation, and most projects have one core area, rarely two.

The skills weight their work by it:

- `lore-consult` expands core-marked areas first when several match a task.
- `lore-check` treats an uncovered core area as a red flag; an uncovered peripheral area is merely a note.
- `lore-capture` leans toward recording when the knowledge touches a core area — core knowledge pays the highest interest.

## File frontmatter

Every `pitfalls.md` / `business-rules.md` / topic file starts with a light frontmatter block:

```yaml
---
area: payments
kind: pitfalls   # pitfalls | business-rules | topic | architecture | api-map | glossary
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
- `term:` — optional: the glossary term this entry hangs off, written exactly as the term's heading (including an area qualifier when the term is collision-split, e.g. `Customer (billing)`).

**Date rule (applies to every write).** Any `updated:` value must come from a real, known current date — the system clock or a date the user gives you. Never fabricate or backdate it. When you don't know today's date, ask rather than guess. Every skill that writes or refreshes an entry follows this rule.

A strong body answers three things: what it is, why, and what to do. When the rule has an observable "done right" state, add a fourth — what behavior you'd see when it is respected. An entry that states its success criterion is checkable (by `lore-guard`, by a reviewer) instead of merely readable. Optional, never forced — some lore has no observable state.

The format is deliberately both human-readable AND greppable: tools grep `` `code:` `` to check that the linked paths still exist, and `status:` lets stale entries be marked rather than silently deleted.

## Glossary (ubiquitous language)

`docs/lore/glossary.md` holds the project's shared vocabulary — the terms the team, the code, and the agent agree to use, one `## Term` entry per concept. It is optional like `api-map.md`, and it is created lazily: the file appears when the first term is agreed (via `lore-ul`), never at scaffold time. Terms are aligned with the user, never auto-generated.

**Glossary resolution (run this before any glossary read or write).** Some projects already keep their vocabulary outside lore — most commonly a root `CONTEXT.md` (single context) or a root `CONTEXT-MAP.md` pointing at per-context `CONTEXT.md` files, the format used by domain-modeling / grilling skills. That file is the same artifact as lore's glossary: an opinionated term list whose `_Avoid_:` line plays the role of `not:`. Every skill that touches vocabulary resolves the glossary source in this order:

1. **External glossary** — a root `CONTEXT.md`, or a root `CONTEXT-MAP.md` and the per-context files it lists. When present it is canonical: read terms from it, treat `_Avoid_:` names as banned, and never create `docs/lore/glossary.md` next to it.
2. **Lore glossary** — `docs/lore/glossary.md` (plus any post-split `<area>/terms.md`), the format the rest of this section defines.
3. **None** — no glossary yet; `lore-ul` can bootstrap one, honoring this same order when choosing where to write.

Rules for the external case:

- **Consume, don't restructure.** The file belongs to whatever tool maintains it (often a domain-modeling skill). When a lore skill writes a term there, it uses the file's native format — a `**Term**:` definition plus an `_Avoid_:` list — and never injects lore's `code:` / `updated:` / `status:` meta into it.
- **Feedback events** for external terms are keyed `CONTEXT.md#<Term>` (or `<path>/CONTEXT.md#<Term>` in a multi-context repo).
- **Never maintain both.** If a legacy `docs/lore/glossary.md` coexists with a root `CONTEXT.md`, the external file wins: `lore-check` flags the duplication, and `lore-maintain` offers a user-confirmed merge of the remaining lore terms into `CONTEXT.md` before retiring `glossary.md`.

The rest of this section describes lore's own glossary format — it applies when no external glossary exists.

The global file spans areas, so its frontmatter carries only `kind`:

```yaml
---
kind: glossary
---
```

Each term entry follows the same one-line-meta shape as every other entry:

```markdown
## Customer

`code:` `src/models/customer.ts` → `Customer` · `area:` `billing` · `aka:` `buyer` · `not:` `client, account` · `updated:` `2026-07-06` · `status:` `active`

The paying party. Distinct from User (someone who can log in): one Customer can have many Users.
Example: on a company subscription, the company is the Customer; employee accounts are Users.
```

- `code:` — the type/class/module that implements the concept; use `—` when it has no implementation yet.
- `area:` — the area the definition belongs to; omit when the term means the same thing project-wide.
- `aka:` — accepted synonyms.
- `not:` — rejected names for this concept, comma-separated. This is the hook `lore-guard`'s naming check greps.
- Body: at least a one-line definition, plus a concrete example whenever possible — examples are what pin a concept's boundary.

**Term collisions.** When two areas use the same word for different things, keep both entries in the global file and qualify the headings with the area in parentheses — `## Customer (billing)` and `## Customer (support)` — with `area:` mandatory on both. The same word meaning two things *inside one* area is not allowed: split the concept into two differently-named terms instead.

**Splitting into per-area files.** When a single area accumulates roughly 10+ terms, propose moving them into `<area>/terms.md` (frontmatter: `area:` + `kind: glossary`). Same spirit as the lazy `index.md` rule — split when size demands it, with the user's confirmation, never preemptively.

**Terms evolve under the same mark-over-delete policy.** When a concept is renamed, mark the old term `status: obsolete` and point its body at the new term — the language's history is part of the lore. A term that was never true is misinformation: delete it, with confirmation.

**Feedback events for terms** use the entry key `glossary.md#<Term>` (or `<area>/terms.md#<Term>` after a split) and the same outcome vocabulary as every other entry.

## Maintenance & deletion policy

**Principle: mark over delete.** Lore is hard-won knowledge — "we did it this way, then found it breaks" keeps its lesson even after it stops being current. Default to marking, not deleting.

- **Outdated but was correct** → set `status: obsolete` and leave it in place. `lore-consult` skips non-`active` entries by default, so it stops cluttering briefs without losing the lesson. Don't delete it.
- **Wrong / never true** → this is misinformation, so delete it (git keeps the history). This requires confirmation.
- **Fixed but worth keeping** → set `status: resolved`.
- **Obsolete pile-up hurting readability** → batch-archive to an `archive.md` (per area, or at the lore root) or delete; a human decides which.
- **Two cleanup paths, complementary:** just-in-time cleanup woven into `lore-consult` / `lore-capture` (cheap, because you're already in context), plus a periodic sweep via `lore-maintain` (catches the long tail no one is reading).
- **Destructive actions (delete / archive / merge) always require human confirmation.** The default action is "mark", never an automatic delete.

## Health check & adoption feedback

`lore-check` is a **read-only** audit. It scores a lore base on seven dimensions — entry quality (the boundary test above), coverage, link health, freshness, retrievability, adoption, and language health — then hands fixes off to `lore-maintain` (cleanup), `lore-capture` (gaps), and `lore-ul` (vocabulary). It never mutates lore content itself; its one bookkeeping write is the heartbeat stamp below.

**Heartbeat stamp.** After each run, `lore-check` writes today's date to `docs/lore/.lore-last-check` (one line, `YYYY-MM-DD`, gitignored like the feedback log). The SessionStart hook reads the stamp's age and suggests a re-check after ~30 days. The stamp is metadata about the check, not lore — writing it does not break lore-check's read-only contract.

**Adoption feedback log.** To measure whether surfaced lore actually gets used, the skills append events to `docs/lore/.lore-feedback.jsonl` — one JSON object per line, created on first use. It lives in the user's project and is **gitignored by default** (keeping it is the user's call; a skill that writes it may add `.lore-feedback.jsonl` to `docs/lore/.gitignore` if not already ignored).

Event shape:

```json
{"ts": "2026-06-30", "skill": "lore-consult", "entry": "payments/pitfalls.md#contractCalc rounding", "task": "add annual billing", "outcome": "surfaced", "note": ""}
```

`note` is optional — a short free-text reason, most valuable on `ignored` / `declined` (was the entry wrong, irrelevant, or badly written?). It gives `lore-maintain` something concrete to act on when a low-adoption entry comes up for review.

`outcome` is one of:

- `surfaced` — `lore-consult` put this entry in a brief, or `lore-guard` matched it against a diff.
- `heeded` — the work followed it, or a `lore-guard` flag led to a fix. Helpful.
- `redundant` — it only confirmed what the user already planned, or the diff already respected it. Neutral, NOT a strike.
- `ignored` — skipped, dismissed, or it turned out wrong. Unhelpful; a review candidate.
- `accepted` / `declined` — a `lore-maintain` action the user confirmed or refused.

Notes:

- The three-way `heeded` / `redundant` / `ignored` split is deliberate. A plain helpful/unhelpful binary would punish good lore that merely confirmed a sound plan.
- `lore-consult` records `surfaced` when it surfaces an entry, then reconciles each to a final outcome at task end. This reconciliation is **best-effort** — a dropped session simply leaves the entry as `surfaced`.
- `lore-guard` records the same three-way outcome per entry it judged against a diff.
- `lore-maintain` records `accepted` / `declined` per confirmed action.
- Writing to the log must NEVER block or fail the main task. If it can't be written, skip it silently.

## Plays well with others

If a project also keeps a code-structure index (the *where* — files, imports, layers), lore covers the rest: the *what* (the glossary's shared vocabulary), the *why*, and the gotchas. Lore stands on its own and does not require any other documentation system to be present.
