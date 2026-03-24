# shipshape-skills

[繁體中文版](README.zh-TW.md)

Disciplined development workflow plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Inspired by [obra/superpowers](https://github.com/obra/superpowers).

## Install

```bash
/plugin marketplace add mukiwu/shipshape-skills
/plugin install shipshape-skills
```

## What's included

### Skills

| Skill | Description |
|-------|-------------|
| `auto-improve-tests` | Iteratively review and improve unit tests until quality score >= 9.2 |
| `bug-learning` | After fixing a bug, decide whether to document the root cause in cookbook, memory, or workflow |
| `coding-standards` | TypeScript/JavaScript coding standards and best practices |
| `e2e-testing` | Playwright E2E patterns — POM, flaky test handling, CI/CD, artifact management |
| `react-patterns` | React Hooks, Custom Hooks, Zustand, performance optimization, anti-patterns |
| `vue-patterns` | Vue 3 Composition API, Pinia, composables, performance optimization, anti-patterns |

### Commands

| Command | Description |
|---------|-------------|
| `/feature` | Full development workflow: brainstorming, planning, TDD, implementation, code review |
| `/tdd` | Test-Driven Development: scaffold interfaces, write tests first, then implement |
| `/plan` | Create step-by-step implementation plan with risk assessment |
| `/build-fix` | Diagnose and fix build/type errors |
| `/e2e` | Generate and run Playwright E2E tests |

### Agents

| Agent | Description |
|-------|-------------|
| `code-reviewer` | Two-stage review: spec compliance first, then code quality |
| `tdd-guide` | TDD coaching with rationalization prevention |
| `planner` | Feature planning with atomic task breakdown |
| `build-error-resolver` | Build and TypeScript error resolution |
| `e2e-runner` | E2E test generation, execution, and flaky test management |

## `/feature` workflow

The core workflow follows a disciplined development cycle:

```
Stage 0: Brainstorming (Socratic questioning, YAGNI)
Stage 1: Planning (atomic tasks, file paths, expected behavior)
Stage 2: UI/UX Design (3 proposals, optional)
Stage 3: Interface Design (TypeScript types, function signatures)
Stage 4: Write Tests (TDD Red, with rationalization prevention)
Stage 5: Implement (TDD Green, verify no regression)
Stage 5.5: Refactor (improve without changing behavior)
Stage 6: Auto-improve Tests (iterate to >= 9.2 score)
Stage 7: E2E Tests (Playwright, optional)
Stage 8: Code Review (two-stage: spec compliance -> code quality)
```

Each stage pauses for user confirmation. Stages can be skipped based on complexity — the user decides which to run after seeing the skip suggestions.

## Key principles

Borrowed from [obra/superpowers](https://github.com/obra/superpowers):

- **No production code without a failing test first** — wrote code before the test? Delete it.
- **Verification before completion** — "should work" is not verification. Run the command, read the output, confirm the result.
- **Rationalization prevention** — common excuses for skipping tests are listed and rebutted in the TDD stage.
- **Two-stage code review** — check spec compliance before code quality. Don't polish code that shouldn't exist.
- **Mock three laws** — never test mock behavior, never add test-only methods to production code, never mock without understanding dependencies.

## Customization

shipshape-skills provides generic workflows. For project-specific needs:

1. Install shipshape-skills as a base
2. Add project-specific skills in your `.claude/skills/` directory (they override shipshape)
3. Define project conventions in `CLAUDE.md` — agents will automatically reference it

Example: if your project uses Element Plus, create `.claude/skills/element-plus/SKILL.md` in your project. shipshape's generic `/feature` command will work with your project-specific skills.

## License

MIT
