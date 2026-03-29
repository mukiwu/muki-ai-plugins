# shipshape-skills

[繁體中文版](README.zh-TW.md)

Disciplined development workflow plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Inspired by [obra/superpowers](https://github.com/obra/superpowers) and [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Install

```bash
/plugin marketplace add mukiwu/muki-ai-plugins
/plugin install shipshape-skills
```

## Getting started

After installing, run `/init` to let shipshape learn about your project:

```bash
/shipshape-skills:init
```

It reads your `package.json`, asks a few questions, then generates a `CLAUDE.md` and project-specific skills. Here's a real example:

### Example: React + Ant Design project

**AI detects the tech stack and only asks what it can't infer:**

```
⏺ From package.json I can see:
  - React 18 + React Router 6
  - Ant Design 5 + @ant-design/icons
  - Tailwind CSS + Emotion
  - ECharts 5, Axios, Vite, Day.js

  No test framework found.
  First question: what do you use for testing? (Vitest, Jest, Playwright… or none?)

❯ No tests yet

⏺ Any project-specific conventions you'd like AI to know? (can skip)

❯ None for now
```

**Generates `CLAUDE.md` (project overview):**

```markdown
# my-project

## Tech Stack

- Framework: React 18
- UI Library: Ant Design 5
- CSS: Tailwind CSS + Emotion
- Charts: ECharts 5
- HTTP: Axios
- Build: Vite
...
```

**Suggests and creates project skills:**

```
.claude/skills/
├── antd-patterns/
│   └── SKILL.md       ← antd 5 component patterns, Table/Form, style overrides
├── project-api/
│   └── SKILL.md       ← Axios interceptor conventions, token refresh, error handling
```

Once initialized, running `/feature` to develop new features will automatically reference this project knowledge.

## `/feature` workflow

The core workflow follows a disciplined development cycle:

| Stage | Description | Skill / Agent | Skippable |
|-------|-------------|---------------|-----------|
| 0 | Brainstorming — Socratic questioning, YAGNI | — | ✅ If requirements are already clear |
| 1 | Planning — atomic tasks, file paths, expected behavior | `planner` agent | ❌ |
| 2 | UI/UX Design — 3 proposals, iterative refinement | `frontend-design` skill* | ✅ No UI changes |
| 3 | Interface Design — TypeScript types, function signatures | `tdd-guide` agent | ✅ ≤ 2 files, simple logic |
| 4 | Write Tests — TDD Red, rationalization prevention | `tdd-guide` agent | ✅ Pure UI, no business logic |
| 5 | Implement — TDD Green, verify no regression | — | ❌ |
| 5.5 | Refactor — improve without changing behavior | — | ✅ Nothing to refactor |
| 6 | UIUX Review — Figma pixel diff or AI visual inspection | `visual-reviewer` / `uiux-reviewer` agent** | ✅ No UI changes |
| 7 | Auto-improve Tests — iterate to >= 9.2 score | `auto-improve-tests` skill | ✅ Pure UI, no business logic |
| 8 | E2E Tests — Playwright | `e2e-runner` agent | ✅ Small scope, manual verify |
| 9 | Code Review — spec compliance, then code quality, iterative fix | `code-reviewer` agent | ❌ |

*`frontend-design` is a separate plugin, not bundled with shipshape-skills.

**Stage 6 supports two modes: (A) Figma pixel diff via [`figma-visual-reviewer`](../figma-visual-reviewer/) plugin when installed and Figma design is available, or (B) AI visual review via `claude-in-chrome`. Automatically selects the best available mode.

Each stage pauses for user confirmation. After Stage 1, skip suggestions are provided — the user decides which stages to run.

## What's included

### Skills

| Skill | Description |
|-------|-------------|
| `auto-improve-tests` | Iteratively review and improve unit tests until quality score >= 9.2 |
| `bug-learning` | After fixing a bug, decide whether to document the root cause in cookbook, memory, or workflow |
| `coding-standards` | Framework-agnostic coding standards (naming, types, error handling, API design). Routes to `react-patterns` or `vue-patterns` for framework-specific guidance |
| `e2e-testing` | Playwright E2E patterns — POM, flaky test handling, CI/CD, artifact management |
| `react-patterns` | React Hooks, Custom Hooks, Zustand, performance optimization, anti-patterns |
| `vue-patterns` | Vue 3 Composition API, Pinia, composables, performance optimization, anti-patterns |

### Commands

| Command | Description |
|---------|-------------|
| `/init` | Interactive project setup — generates `CLAUDE.md` and suggests project-specific skills |
| `/feature` | Full development workflow: brainstorming, planning, TDD, implementation, code review |
| `/tdd` | Test-Driven Development: scaffold interfaces, write tests first, then implement |
| `/plan` | Create step-by-step implementation plan with risk assessment |
| `/build-fix` | Diagnose and fix build/type errors |
| `/e2e` | Generate and run Playwright E2E tests |

### Agents

| Agent | Description |
|-------|-------------|
| `code-reviewer` | Two-stage review: spec compliance first, then code quality |
| `uiux-reviewer` | Visual UI/UX review via claude-in-chrome — evaluates layout, typography, readability, visual hierarchy, and spec compliance from a real user's perspective |
| `tdd-guide` | TDD coaching with rationalization prevention |
| `planner` | Feature planning with atomic task breakdown |
| `build-error-resolver` | Build and TypeScript error resolution |
| `e2e-runner` | E2E test generation, execution, and flaky test management |

### Hooks

| Hook event | Stage | What it does |
|------------|-------|--------------|
| `PreToolUse` (Edit\|Write) | Before writing code | Blocks edits until `docs/cookbook/` and memory feedback have been read |
| `Stop` | After Claude responds | Detects bug fixes and reminds to run bug-learning workflow |
| `TaskCompleted` | After task completion | Uses AI to judge whether experience should be documented in cookbook/memory |
| `PreToolUse` (stage-5, once) | First code edit in implementation | Agent verifies cookbook/memory were read before allowing edits |

## How to use

You don't need to remember command names. Just describe what you want in natural language — shipshape will activate the right workflow.

### Feature development

| You say | What happens |
|---------|-------------|
| "Add a dark mode toggle" | `/feature` — full workflow from brainstorming to code review |
| "I want to build a new dashboard" | `/feature` — starts with Socratic questioning to clarify requirements |
| "Add a simple util function" | `/feature` — suggests skipping UI/UX and E2E stages |

### Testing

| You say | What happens |
|---------|-------------|
| "Write tests for UserService" | `/tdd` — scaffold interface, write tests first, then implement |
| "Improve test quality for this file" | `auto-improve-tests` — iterates until score >= 9.2 |
| "Test the login flow end to end" | `/e2e` — generates Playwright test with POM pattern |

### Planning & review

| You say | What happens |
|---------|-------------|
| "Plan the refactoring of the auth module" | `/plan` — atomic task breakdown with risk assessment |
| "Review my changes" | `code-reviewer` — two-stage review (spec compliance → code quality) |
| "The build is broken" | `/build-fix` — diagnose and fix build/type errors |

### Bug fixing

| You say | What happens |
|---------|-------------|
| "This is broken", "Found a bug", "This isn't working" | `bug-learning` — after fixing, decides where to document the root cause |

### Tips

- **Be specific about scope** — "Add a button to the header" triggers `/feature` with skip suggestions for heavy stages.
- **Mention testing explicitly** — "Write tests for X" triggers `/tdd` directly instead of the full `/feature` flow.
- **You can use commands directly** — `/feature`, `/tdd`, `/plan`, `/e2e`, `/build-fix` all work as slash commands.

## Key principles

Borrowed from [obra/superpowers](https://github.com/obra/superpowers):

- **No production code without a failing test first** — wrote code before the test? Delete it.
- **Verification before completion** — "should work" is not verification. Run the command, read the output, confirm the result.
- **Rationalization prevention** — common excuses for skipping tests are listed and rebutted in the TDD stage.
- **Two-stage code review** — check spec compliance before code quality. Don't polish code that shouldn't exist.
- **Mock three laws** — never test mock behavior, never add test-only methods to production code, never mock without understanding dependencies.

## Customization

shipshape-skills workflows are generic and not tied to any specific framework. You can add framework knowledge through your project's `CLAUDE.md` and additional skills.

Say your project uses **Element Plus**:

```
your-project/
├── .claude/
│   ├── CLAUDE.md          ← "This project uses Element Plus + Vue 3"
│   └── skills/
│       └── element-plus/
│           └── SKILL.md   ← Element Plus component usage, naming conventions, etc.
```

When you run `/feature`, shipshape automatically references your project knowledge alongside its generic workflow, so the generated code uses the correct framework components. If a project skill has the same name as a built-in one, **the project version takes priority**.

Not sure how to write `CLAUDE.md`? Run `/init` — it reads your `package.json`, asks a few questions, and generates one for you.

## License

MIT
