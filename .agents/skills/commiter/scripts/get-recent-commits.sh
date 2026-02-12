#!/usr/bin/env bash
set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1

limit="${1:-5}"
if [[ ! "$limit" =~ ^[0-9]+$ ]] || [[ "$limit" -eq 0 ]]; then
  echo "limit must be a positive integer" >&2
  exit 2
fi

git log -n "$limit" --pretty=format:'%h%x1f%s%x1e'
