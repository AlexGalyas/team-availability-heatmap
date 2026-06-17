#!/usr/bin/env bash
# Phase gate (frontend). Nothing is "done" until this exits 0.
# Cheap/fast checks first. Usage: bash scripts/gate.sh [--e2e]
set -uo pipefail

RUN_E2E=0
[[ "${1:-}" == "--e2e" ]] && RUN_E2E=1

fail=0
step() {
  local name="$1"; shift
  echo ""; echo "──▶ $name"
  if "$@"; then echo "✓ $name"; else echo "✗ $name  (FAILED)"; fail=1; fi
}

step "typecheck" pnpm typecheck
step "lint"      pnpm lint
step "test"      pnpm test        # Vitest + Testing Library
step "build"     pnpm build       # next build (catches RSC/serialization errors)
if [[ $RUN_E2E -eq 1 ]]; then
  step "e2e" pnpm test:e2e         # Playwright
fi

echo ""
if [[ $fail -eq 0 ]]; then
  echo "════════════════════════════"; echo " GATE GREEN — safe to proceed"; echo "════════════════════════════"; exit 0
else
  echo "════════════════════════════"; echo " GATE RED — fix before moving on"; echo "════════════════════════════"; exit 1
fi
