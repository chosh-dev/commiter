#!/usr/bin/env bash
set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1

if [[ $# -eq 0 ]]; then
  echo "commit message is required" >&2
  exit 2
fi

message="$*"
if [[ -z "${message// }" ]]; then
  echo "commit message cannot be blank" >&2
  exit 2
fi

git commit -m "$message"
