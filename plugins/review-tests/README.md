# review-tests

[繁體中文版](README.zh-TW.md)

A test review plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It reads an existing test file, finds blind spots, and produces a self-contained HTML report — without touching any of your code.

It's a **diagnosis tool, not a fixer**. It points out gaps; you decide what to fix, and you fix it with TDD.

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install review-tests
```

## Quick Start

Point it at a test file (or the source file — it will find the matching test):

```
review-tests src/utils/foo.spec.ts
```

You can also just ask in natural language: *"review the tests for foo"*. It analyses the test, then opens an HTML report in your browser.

## What It Checks

| Dimension | What it looks for |
|-----------|-------------------|
| **Assertion validity** | Meaningless assertions, coverage-only tests, weak `toBeDefined()` checks, comments that compute an exact value but only assert `> 0` |
| **Behavior gaps** | Missing happy path / edge cases / error handling / null handling, untested branches, uncovered parameter combinations |
| **Mock health** | Over-mocking that hides the real code path, mock data that doesn't match the TypeScript interface |
| **Structure** | AAA (Arrange-Act-Assert), clear test descriptions, side-effect cleanup |

## The Report

A single self-contained HTML file (inline CSS/JS, zero external dependencies) written to `.review-tests/` and opened automatically:

- A health badge (good / pass / needs-work) with a one-line verdict.
- Findings grouped by the four dimensions, each pinned to a test line.
- **Backlinks** — every finding has a toggle that expands the *key lines* of the source function under test (not the whole function), with syntax highlighting and the source path + line range.

Add `.review-tests/` to your `.gitignore` so reports don't get committed.

## Three Rules It Follows

1. **Diagnose only** — it never edits your source, tests, or config. The only thing it writes is the HTML report.
2. **Fix with TDD** — gaps it finds are meant to be filled one red-green cycle at a time, not batch-generated.
3. **Behavior-level only** — it suggests behaviors to verify, never implementation-coupled tests that would break on refactor.

## Test Framework

Primarily aimed at Vue 3 + TypeScript + Vitest; the same principles apply to other frameworks.

## Requirements

- Node.js (for the report generator `render.cjs`)

## License

MIT
