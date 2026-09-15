# AGENTS.md

Vue 3 frontend for My24Service.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `My24Service/frontend`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, using their default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Form schemas

Forms in a Slice parse the generated valibot request schema. Before writing or
extending a `schemas.ts`, see `docs/agents/form-schemas.md`.

### Contract usage gate

`npm run usage-gate` lists operations in `openapi/schema.yaml` that no client
calls (web generated client, legacy `src/models` services, raw path literals,
and the Flutter apps). It lives here because the schema and the generated
client are in this repo and CI already has Node. Flutter call sites come from
`scripts/usage-gate/mobile-callers.json`; refresh it with
`node scripts/usage-gate.mjs --mobile ../my24-mobile --write-mobile-snapshot`
after changing mobile services. Exceptions go in
`scripts/usage-gate/allowlist.json`. CI runs it as a warning; `--strict`
makes it fail.
