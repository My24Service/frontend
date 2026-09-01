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
    postProcess: [],
  },
  output: {
    path: 'src/api',
    postProcess: [],
  },
  plugins: [
    '@hey-api/typescript',
    {
      // The client's baseURL comes from `createClientConfig` in
      // src/services/api-client/runtimeConfig.ts rather than from a
      // `client.setConfig()` call at startup: this way the client is
      // configured as it is created, so an import-time request cannot go out
      // unconfigured. Interceptors (auth, CSRF) attach to `client.instance`
      // in the sibling interceptors.ts.
      //
      // Both live outside `output.path`, which is emptied on every run — a
      // hand-written file under src/api/ does not survive codegen.
      name: '@hey-api/client-axios',
      runtimeConfigPath: './src/services/api-client/runtimeConfig.ts',
    },
    {
      name: '@hey-api/sdk',
      client: '@hey-api/client-axios',

      // Requests are *validated* and responses are *transformed*, which is not
      // the same thing done twice.
      //
      // `validator` runs the schema and throws on failure, then discards the
      // parsed output — so a body carrying keys the schema does not declare
      // passes (valibot objects tolerate unknown keys) and is sent verbatim.
      // `transformer` replaces the data with the parse output, and per the
      // docs applies to responses only.
      //
      // On the way out there is no transformer at all, so a caller is
      // responsible for the shape of the body it hands over: validation says
      // whether the body is acceptable, it does not make it acceptable.
      //
      // `transformer` is OFF, so responses arrive exactly as the server sent
      // them, the way BaseModel used to hand them over. It is not off because
      // response parsing is a bad idea — it is off because the schema is not
      // yet accurate enough to enforce. The backend contract checker
      // (apps/core/schema_contract.py) currently counts 339 places where a
      // real response does not match its declaration, and with the
      // transformer on, every one of those is a rejected promise and a broken
      // page rather than a wrong type.
      //
      // Turning it back on is the goal, not a maybe. The order is: work that
      // count to zero, flip SCHEMA_CONTRACT to `strict` so it cannot drift
      // back, then set this to true. Do not flip this one first.
      //
      // What is given up meanwhile: responses are no longer narrowed to the
      // declared shape, so a key the schema does not describe now reaches the
      // call site instead of being stripped, and nothing coerces values. The
      // generated types still describe responses, so they are unsound where
      // the schema is wrong — which is the same 339 places.
      validator: { request: true, response: false },
      transformer: false,
    },
    {
      name: 'valibot',
      requests: true,
      responses: true,
    },
    '@tanstack/vue-query',
  ],
})
