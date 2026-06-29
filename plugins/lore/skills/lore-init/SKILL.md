---
name: lore-init
description: Scaffold a docs/lore/ knowledge base in a project. Use when setting up lore for the first time, when a project has no docs/lore/ yet, or when the user asks to initialize, bootstrap, or set up project lore.
---

# Lore Init

Read `${CLAUDE_PLUGIN_ROOT}/reference/lore-spec.md` before doing anything — it defines the structure, frontmatter, and entry meta you will create. The seed files you copy live in `${CLAUDE_PLUGIN_ROOT}/reference/templates/`.

## When to use

- The project has no `docs/lore/` yet and you want to bootstrap one.
- The user asks to initialize, bootstrap, or set up project lore.

If `docs/lore/` already exists, do NOT overwrite it. Switch to augment-mode: add only the missing core files and report what you added.

## Procedure

1. **Detect existing lore.** Check whether `docs/lore/` already exists. If it does, switch to augment-mode — add only missing core files (`README.md`, an area's `pitfalls.md` / `business-rules.md`) and never clobber anything that is already there.
2. **Infer the project type.** Decide whether this is a frontend app, a backend service, a library, or a CLI. Use that to judge whether `api-map.md` is worth seeding (it pays off for API-heavy projects). When you are unsure, ask the user instead of guessing. If you still can't tell and the user doesn't answer, fall back to the safe minimum: scaffold only the core files and skip `api-map.md` and `architecture/`.
3. **Infer the initial areas.** Look at the codebase's top-level domains or subsystems and propose one or two starter areas (for example `payments/`, `auth/`). Confirm the list with the user before creating anything. Never create areas without explicit confirmation — if the user doesn't respond, propose them and stop there, don't create them.
4. **Create from the templates** in `${CLAUDE_PLUGIN_ROOT}/reference/templates/`:
   - `docs/lore/README.md` from `README.md.tmpl` — fill the Areas table with the areas you chose.
   - For each starter area, `docs/lore/<area>/pitfalls.md` and `docs/lore/<area>/business-rules.md` from `pitfalls.md.tmpl` and `business-rules.md.tmpl`, replacing the `<AREA>` placeholder with the real area name.
   - Optionally `docs/lore/api-map.md` from `api-map.md.tmpl` and/or `docs/lore/architecture/index.md` from `architecture-index.md.tmpl`, only when the project type warrants them.
5. **Wire up the trigger.** Tell the user to add a one-line lore pointer to their `CLAUDE.md` (or `AGENTS.md`) so `lore-consult` and `lore-capture` fire naturally — for example: "Project lore lives in `docs/lore/` — consult it before planning or bug-fixing, and capture implicit knowledge into it."

## Guardrail

This skill is idempotent: never overwrite existing content. Running it on a project that already has lore should only fill in missing core files, and it should report exactly what it added.

## Note on content

What you scaffold is generic structure, not real knowledge. The areas start empty — the user fills them with actual lore later via `lore-capture`.
