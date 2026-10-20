#!/bin/bash
# PreToolUse(Bash): refuse eslint run directly (npx eslint, pnpm exec eslint,
# node_modules/.bin/eslint, bare eslint). The type-aware config runs out of
# heap that way; scripts/lint.mjs lints file by file with a heap guard and
# shares .eslintcache.
cmd=$(jq -r '.tool_input.command // empty')
pattern='(^|[;&|(]|\$\()[[:space:]]*([A-Za-z_]+=[^[:space:]]+[[:space:]]+)*((npx|bunx|yarn|pnpm[[:space:]]+(exec|dlx))[[:space:]]+)?([^[:space:]]*/)?eslint([[:space:]]|$)'
if grep -qE "$pattern" <<<"$cmd"; then
  echo "Run lint through the package script: \`pnpm run lint -- <files or dirs>\` (all of src with no paths, \`pnpm run lint:fix\` to fix). Direct eslint runs out of heap on the type-aware config and skips the shared cache." >&2
  exit 2
fi
exit 0
