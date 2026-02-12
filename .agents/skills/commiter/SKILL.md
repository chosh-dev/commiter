---
name: commiter
description: Create and execute semantic git commit plans from staged or unstaged diffs via `scripts/*.sh` wrappers. Use when Codex should split a mixed diff into scoped commits, validate hunk coverage, show a commit summary, and apply commits safely with a single confirmation.
---

# Commiter

## Overview

Run the workflow in a single pass with minimal user ping-pong.
Ask only once at final apply confirmation unless a hard blocker appears.

## Workflow

1. Collect diff context:

```bash
scripts/get-current-diff.sh
```

2. Read style anchors:

```bash
scripts/get-recent-commits.sh 5
```

3. Apply commit patch and commit message units:

```bash
scripts/apply-patch-cached.sh
scripts/create-commit.sh "<message>"
```

4. Roll back staged state on abort/failure:

```bash
scripts/reset-cached.sh
```

## Interaction Contract

- Keep execution one-pass: run analysis and plan generation first, then ask exactly one final confirmation to apply.
- Avoid ping-pong status spam: do not list every command run as separate chat lines unless the user explicitly requests verbose logs.
- Prefer read-only diff collection to avoid permission prompts in sandboxed environments.
- `get-current-diff.sh` automatically prefers cached diff when staged changes exist, otherwise falls back to working diff.
- Untracked files are not included in working diff; stage them first to include.

## Commit Plan Output Format

Match the original commiter terminal summary style.
Use a compact "Commit Plan Summary" layout with separators and per-file stats.
Do not print file paths in a single comma-separated line.
Print one file per line.
Show line stats per file as `+<added> -<deleted>`.
If ANSI color is supported, render:

- header in cyan
- divider in dim gray

Use this format:

```text
---
=== Commit Plan Summary ===
Total commits: `<N>`
Total files: `<F>` | `+<A>` `-<D>`

---
[1/N] <type>: <message>
  - `<path1>` `+<added>` `-<deleted>`
  - `<path2>` `+<added>` `-<deleted>`
  - `<path3>` `+<added>` `-<deleted>`

---
[2/N] <type>: <message>
  - `<path4>` `+<added>` `-<deleted>`

---
```

If the user needs edits, ask for message changes in the same reply without extra intermediate steps.

## Operating Rules

- Route all shell execution through `scripts/*.sh`; do not type raw `git ...` in workflow steps.
- Execute end-to-end in one turn; avoid intermediate confirmation questions.
- Preserve user intent; do not rewrite commit messages after confirmation.
- Do not auto-commit without explicit user confirmation unless user requested non-interactive execution.
- Keep output deterministic and auditable: plan first, apply second.
