# review-code

A code review plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It reviews the diff since a fixed point along three axes, each in its own sub-agent, then has independent sub-agents vote on every important finding so only confirmed problems reach the report. Read-only; it never edits your code.

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install review-code
```

Codex, Cursor, Gemini CLI and other tools:

```bash
npx skills add mukiwu/muki-ai-plugins
```

Pick `review-code` when the installer lists the skills.

## Quick start

```
review-code main
review-code HEAD~3 --quick
```

Give it a fixed point (commit, branch, tag). `--quick` skips the voting step for small changes or mid-iteration rounds.

## How it works

1. **Three axes in parallel**
   - **Standards**: does the code follow the repo's documented standards (`CODING_STANDARDS.md`, `CONTRIBUTING.md`, related `docs/lore/` entries), plus a baseline of Fowler code smells
   - **Spec**: does it do what the issue or spec asked, no more and no less
   - **Bugs**: will it break at runtime, including other places in the repo that do the same thing but weren't updated
2. **Every finding is labelled** `Important`, `Nit`, or `Pre-existing` (a problem that predates this change and is out of scope)
3. **Voting**: each `Important` finding goes to two fresh sub-agents that see only the finding and the code, not the original reasoning. Both agree, it stays; both reject, it's dropped; a split gets a third vote
4. **Report**: axes stay separate, each finding carries its vote, pre-existing problems are listed apart as issue candidates

Re-reviews only look at the new diff, never repeat a finding the author already declined, and stop after the third round to suggest rethinking the approach.

## Pairs with

- `review-tests` reviews the tests themselves; `review-code` reviews production code
- `lore-guard` checks the full lore base; `review-code` reads only the lore related to the change

The process and smell baseline are adapted from Matt Pocock's [code-review](https://github.com/mattpocock/skills) skill, extended with the bug axis, finding labels, and voting.

## License

MIT
