#!/usr/bin/env bash
set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1
git apply --cached --unidiff-zero --whitespace=nowarn -
