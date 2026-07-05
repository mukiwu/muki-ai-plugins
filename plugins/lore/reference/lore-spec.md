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

**Date rule (applies to every write).** Any `updated:` value must come from a real, known current date — the system clock or a date the user gives you. Never fabricate or backdate it. When you don't know today's date, ask rather than guess. Every skill that writes or refreshes an entry follows this rule.

The format is deliberately both human-readable AND greppable: tools grep `` `code:` `` to check that the linked paths still exist, and `status:` lets stale entries be marked rather than silently deleted.

## Maintenance & deletion policy

**Principle: mark over delete.** Lore is hard-won knowledge — "we did it this way, then found it breaks" keeps its lesson even after it stops being current. Default to marking, not deleting.

- **Outdated but was correct** → set `status: obsolete` and leave it in place. `lore-consult` skips non-`active` entries by default, so it stops cluttering briefs without losing the lesson. Don't delete it.
- **Wrong / never true** → this is misinformation, so delete it (git keeps the history). This requires confirmation.
- **Fixed but worth keeping** → set `status: resolved`.
- **Obsolete pile-up hurting readability** → batch-archive to an `archive.md` (per area, or at the lore root) or delete; a human decides which.
- **Two cleanup paths, complementary:** just-in-time cleanup woven into `lore-consult` / `lore-capture` (cheap, because you're already in context), plus a periodic sweep via `lore-maintain` (catches the long tail no one is reading).
- **Destructive actions (delete / archive / merge) always require human confirmation.** The default action is "mark", never an automatic delete.

## Health check & adoption feedback

`lore-check` is a **read-only** audit. It scores a lore base on six dimensions — entry quality (the boundary test above), coverage, link health, freshness, retrievability, and adoption — then hands fixes off to `lore-maintain` (cleanup) and `lore-capture` (gaps). It never mutates lore content itself; its one bookkeeping write is the heartbeat stamp below.

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

If a project also keeps a domain glossary (the *what* — vocabulary and concepts) or a code-structure index (the *where* — files, imports, layers), lore is the third leg: the *why* and the gotchas. The three are complementary but distinct. Lore stands on its own and does not require either of them to be present.
