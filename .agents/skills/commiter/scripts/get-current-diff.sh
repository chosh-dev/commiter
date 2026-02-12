#!/usr/bin/env bash
set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1

mode() {
  if ! git diff --cached --quiet; then
    echo "cached"
    return
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "working"
    return
  fi

  echo "none"
}

if [[ "${1:-}" == "--mode" ]]; then
  mode
  exit 0
fi

current_mode="$(mode)"

if [[ "$current_mode" == "cached" ]]; then
  git diff --cached --no-color --unified=3
  exit 0
fi

if [[ "$current_mode" == "none" ]]; then
  echo "No changes (diff) found." >&2
  exit 3
fi

if [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  echo "untracked files are not included in working diff; stage them to include." >&2
fi

git diff --no-color --unified=3
