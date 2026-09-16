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

### Product families and flavours

The server tells the client what product a tenant is: `profile.family`
(`default` or `shltr`) and `profile.flavour` (`maintenance` or `temps`) in
`get-initial-data`, read through the main store's `getProductFamily` and
`getFlavour` (`isDefaultFamily` and `flavour` on `componentMixin`).

- One component per screen. Never a `*Default`/`*Shltr` pair, and no
  wrapper that picks one.
- A family difference is CSS (scope it under a family class on the root)
  or a branch on `profile.family`. At most five branches in one component;
  past that, keep the data in the view and give each family a small layout
  file filled through named slots (see `views/equipment/components/`).
- A flavour difference is a branch on `profile.flavour`, never on the
  hostname, the companycode or the theme.
