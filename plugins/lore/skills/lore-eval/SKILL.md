---
name: lore-eval
description: Use when asked whether lore actually catches the mistakes it records, after rewording entries or changing lore-guard, or when lore-check suggests measuring — replays past violations against a fresh lore-guard pass, scores which entries get caught, and hands the misses to lore-maintain. Read-only toward lore.
---

# Lore Eval

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` first — the entry-meta format and the feedback-log format come from there.

`lore-check` asks whether lore *looks* healthy. This skill asks whether it *works*: if someone made the same mistake again, would `lore-guard` catch it? Each pitfall or business rule was recorded because a change once broke it, so that change is a ready-made test question. Replaying those questions gives a score you can compare before and after rewording an entry, moving it to another area, or changing the guard itself — without the score, you can't tell an improvement from a regression.

## When to use

On an explicit ask ("does our lore actually catch anything?", "run the lore eval"), after a batch of `lore-maintain` rewrites, or when `lore-check` shows entries that are surfaced but never heeded. Only meaningful when `docs/lore/` holds at least ~10 `active` entries in `pitfalls.md` / `business-rules.md` — below that, say the base is too small for the score to mean anything and stop.

## Files

Everything lives in `docs/lore/.lore-eval/`:

- `cases.jsonl` — the test questions, one JSON object per line. Commit it: the cases are reusable project knowledge.
- `results.jsonl` — one line per run with the scores. Gitignored by default, like the feedback log.

Case shape:

```json
{"id": "payments-rounding-01", "entry": "payments/pitfalls.md#contractCalc rounding", "kind": "violation", "source": "commit", "diff_ref": "a1b2c3d^..a1b2c3d", "note": "the commit that introduced the rounding bug"}
```

- `kind`: `violation` (the guard should flag `entry`) or `clean` (a change in the same code that respects the entry; the guard should flag nothing).
- `source`: `commit` (taken from git history) or `synthetic` (written for the eval).
- `diff_ref` for `commit` cases; for `synthetic` cases store the diff text in `diff` instead.

## Procedure

1. **Collect or refresh cases.** For each `active` entry without a case yet:
   - Look for the real mistake first. Search git history on the entry's `code:` paths around its `updated:` date for the commit that fixed the problem; the change that introduced it, or the fix reversed, is the violation case. Real cases beat synthetic ones because they carry the shape mistakes actually take.
   - When no commit can be found, write a minimal synthetic diff that breaks the entry the way its body describes. Keep it small and realistic, and don't echo the entry's wording in identifiers or comments — that leaks the answer.
   - Add one `clean` case for roughly every three violation cases, so the score also measures false alarms.
   - Show the new cases to the user before appending them to `cases.jsonl`. Skip entries with `code:` `—` that can't be expressed as a diff, and say how many were skipped.
2. **Run each case blind.** For every case, dispatch a fresh subagent with a clean context that runs the `lore-guard` procedure on that diff. Give it the diff and the repo path only, never the expected entry. Run cases in parallel when the environment allows.
3. **Score.** For each case record one outcome:
   - `caught` — a violation case where the guard flagged the expected entry.
   - `missed-retrieval` — the guard never looked at the expected entry. Usually a wrong or missing `code:` link, or the entry sits in an area the changed files don't map to.
   - `missed-judgement` — the guard read the entry but judged the diff compliant. Usually the body is vague or lacks an observable success criterion.
   - `false-alarm` — a clean case flagged, or a violation case flagged with an unrelated entry. Record which entry fired.
4. **Report.** Give the catch rate (caught / violation cases) and the false-alarm count as separate numbers; don't merge them into one score. List each miss with its outcome type and the likely fix. Compare against the previous line in `results.jsonl` when one exists, and name every case that flipped between runs — a flip says more than the totals.
5. **Record the run.** Append one line to `results.jsonl`:

   ```json
   {"ts": "2026-10-19", "cases": 24, "caught": 17, "missed_retrieval": 3, "missed_judgement": 2, "false_alarm": 1, "flipped": ["payments-rounding-01"], "note": "after rewording billing pitfalls"}
   ```

   Make sure `docs/lore/.gitignore` ignores `.lore-eval/results.jsonl`. Follow the lore-spec date rule for `ts`.
6. **Hand off.** `missed-retrieval` → fix `code:` links or area placement via `lore-maintain`. `missed-judgement` → reword the entry via `lore-maintain`, adding the observable "done right" state from lore-spec. `false-alarm` → narrow the entry that fired. After the fixes land, run the eval again: keep a change only if the catch rate rises without new false alarms.

## Guardrail

Read-only toward lore and code: this skill never edits an entry or the code under test. Its only writes are `cases.jsonl` (after the user confirms new cases) and `results.jsonl`. Synthetic diffs are evaluated as text and never applied to the working tree. Never tune an entry to pass one specific case — that overfits the eval; a reword has to read as a better rule for a human first.
