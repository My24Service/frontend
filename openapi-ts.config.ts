import { defineConfig } from '@hey-api/openapi-ts'

/**
 * Generates `src/api/` from the backend's OpenAPI schema.
 *
 * `openapi/schema.yaml` is produced by the Django side and committed here so
 * codegen is reproducible without a running backend or a tenant database:
 *
 *     cd ../my24service/source
 *     ../venv/bin/python manage.py generate_schema --include-internal \
 *         --tenant <schema_name> --file ../../frontend/openapi/schema.yaml
 *
 * `--include-internal` is required. Most of the endpoints this app calls are
 * hidden from the published API docs with @extend_schema(exclude=True), and
 * without the flag their serializers are absent entirely - OrderSerializer,
 * OrderDispatchSerializer and OrderCustomerHistorySerializer among them. The
 * published docs describe the external contract and are a different artifact;
 * do not generate from them.
 *
 * See ../my24service/docs/typescript-codegen.md for why generation needs a
 * tenant and what the schema is and is not accurate about.
 *
 * The `valibot` plugin matters as much as the types one: `src/models/` uses
 * valibot at runtime (parsing payloads, deriving form defaults), so a
 * types-only generator would replace half of what the model files do and leave
 * the rest hand-maintained.
 *
 * NOTE: @hey-api/openapi-ts crashes on TypeScript 7.0 with
 * "Cannot read properties of undefined (reading 'AnyKeyword')". This repo is on
 * ~6.0, which works. Check that before upgrading TypeScript.
 */
export default defineConfig({
  // Object form, not a bare string: a plain relative path is parsed as Hey API
  // registry shorthand ("organization/project") and fails.
  input: {
    path: './openapi/schema.yaml',
  },
  output: {
    path: 'src/api',
    format: false,
    lint: false,
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: 'valibot',
      /**
       * Component schemas only - no per-operation wrappers.
       *
       * The schema has 442 paths and 797 operations, and by default the plugin
       * emits a request and a response schema for every one of them: parameter
       * bundles and response envelopes that mostly just point back at the
       * components. That is ~1600 of the ~2300 exports, and nothing imports
       * them - `src/models/` uses the components directly and the API layer is
       * hand-written. They would only earn their keep with a generated SDK
       * client validating calls end to end.
       *
       * What remains is the pair per serializer that the model files actually
       * build on: `vOrder` (the response body) and `vOrderWritable` (the
       * request body, i.e. the same minus `readOnly: true` fields). Named
       * components survive regardless, so pagination envelopes like
       * `vPaginatedStockLocationList` are still generated.
       */
      requests: false,
      responses: false,
    },
  ],
})
