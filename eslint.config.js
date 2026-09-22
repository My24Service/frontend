import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import vue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import globals from "globals";

/** Every `src/features/<slice>/index.ts`; see the barrel rule below. */
const FEATURE_BARRELS = [
  "account",
  "auth",
  "company",
  "customer",
  "documents",
  "equipment",
  "field-service",
  "forms",
  "invoice",
  "member",
  "order",
  "shared",
  "statuscode",
  "table",
  "user",
  "workforce",
];

/**
 * The characters a UI draws as marks rather than writes as words: Latin-1
 * punctuation, general punctuation, super- and subscripts, currency and
 * letterlike symbols, arrows, mathematical operators, geometric shapes and
 * dingbats. A raw text built only from these — with digits and spacing — is not
 * copy and needs no catalogue entry, so the raw-text rule ignores it; a mark
 * that carries words ("« Back »") still fails, because the whole text has to be
 * marks before the rule stays quiet.
 *
 * The blocks are named rather than the characters, so a new caret, arrow or
 * star in the UI needs no edit here.
 */
const MARK_RANGES =
  "\\u00A1-\\u00BF\\u00D7\\u00F7\\u2000-\\u206F\\u2070-\\u209F" +
  "\\u20A0-\\u20BF\\u2100-\\u214F\\u2190-\\u21FF\\u2200-\\u22FF" +
  "\\u2300-\\u23FF\\u2460-\\u24FF\\u25A0-\\u25FF\\u2600-\\u27BF" +
  "\\u2B00-\\u2BFF";

export default [
  // Generated from the backend's OpenAPI schema by `npm run codegen`; see
  // openapi-ts.config.ts. Not linted, because `lint` runs with `--fix` and any
  // fix it made would be discarded by the next regeneration - producing a diff
  // that looks like hand edits to a file nobody edits by hand.
  {
    ignores: ["src/api/**"],
  },

  // Vue 3 essential rule set (replaces the legacy `extends: ['plugin:vue/essential']`)
  // This also sets the parser for *.vue files and sourceType: 'module'.
  ...vue.configs["flat/essential"],

  // TypeScript. Without a block whose `files` matches *.ts, ESLint 9 reports
  // "File ignored because no matching configuration was supplied" and lints
  // nothing - flat config derives the file set from `files` alone, so the
  // `--ext` flag on the old lint script had no effect.
  //
  // These are the non-type-checked ("recommended") rules: they need no
  // `project` wiring, so linting stays fast and does not fail on files that
  // are outside tsconfig's `include`. Switching to
  // `recommended-requiring-type-checking` later is a drop-in change here.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,mts,cts}"],
  })),

  {
    files: ["**/*.{ts,mts,cts}"],
    rules: {
      // A warning, not an error, for the same reason tsconfig.json starts at
      // relaxed strictness: files are being converted from JS one at a time
      // and their untyped .js subclasses still pass whatever they like. An
      // explicit `any` at a boundary is the honest annotation today; erroring
      // on it would mean either blocking the migration or papering over it
      // with a fictional type. Tighten once the callers are converted.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    files: ["**/*.d.ts"],
    rules: {
      // The stock Vue SFC shim in env.d.ts is `DefineComponent<{}, {}, any>`,
      // straight from the Vue/Vite docs: those `{}`s are generic slots meaning
      // "no props / no bindings", which is exactly what the type wants. The
      // rule's suggested `object`/`unknown` are wrong here.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  // SFCs with `<script lang="ts">`. vue-eslint-parser handles the .vue
  // envelope and hands the script block to the parser named here; without
  // this a typed SFC fails to parse. No SFC uses lang="ts" yet, but the
  // models are mid-migration to TS and the components follow.
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Untranslated bare text in Vue templates / attributes
  {
    files: ["**/*.vue"],
    plugins: { "@intlify/vue-i18n": vueI18n },
    rules: {
      "@intlify/vue-i18n/no-raw-text": [
        "warn",
        {
          attributes: {
            "/.+/": [
              "title",
              "aria-label",
              "aria-placeholder",
              "aria-roledescription",
              "aria-valuetext",
            ],
            input: ["placeholder"],
            img: ["alt"],
          },
          ignoreNodes: ["md-icon", "v-icon"],
          // Ignore:
          //   - a run of marks, digits and spacing (e.g. ":", ".,", "50%",
          //     "▲", "«", "€ 12,50") — MARK_RANGES above says which marks
          //   - a single letter
          //   - URL protocol prefixes (http://, https://, ftp://, …)
          //   - URL path/domain fragments (e.g. "/automation-updated-order", ".my24service.com/api/...")
          //   - numbers, optionally with a unit (e.g. "18 m²", "1000 EUR")
          // Words with attached punctuation ("Wanneer:", "POST:") are NOT
          // ignored — they are still flagged so they can be reviewed, and so is
          // a mark carrying words ("« Back »"): the whole text has to be marks.
          ignorePattern:
            "^([-?%*.,#:()&\\/\\d\\s" + MARK_RANGES + "]+|[A-Za-z]|\\w+://|/\\S+|\\.\\S+|\\d+(?:\\.\\d+)?(?:\\s+\\S+)?)$",
          ignoreText: [
            "EUR",
            "USD",
            "€",
            "",
            "–",
            "—",
            "×",
            "·",
            "[ x ]",
            // HTTP methods
            "POST",
            "GET",
            "PUT",
            "DELETE",
            "PATCH",
            "HEAD",
            "OPTIONS",
            // Gripp API module/rights tokens (ConnectorGrippSettings permission list)
            "company:",
            "contact:",
            "file:",
            "hour:",
            "offer:",
            "offerprojectline:",
            "project:",
            "product:",
            "task:",
            "timelineentry:",
            "read",
            "create read",
            "read update",
            "create read update",
            // Webhook code-sample labels (ConnectorGrippSettings automation table)
            "Headers:",
            "Body:",
            "User-Agent: My24Service/Gripp",
            "Content-Type: application/json",
            '{ "number": {nummer} }',
          ],
        },
      ],
    },
  },

  // Global language options and base rules for JS and Vue source files.
  // Replaces the legacy `env` / `parserOptions` / top-level `rules` blocks.
  // Note: `arrowFunctions`, `binaryLiterals`, `blockBindings` and `classes`
  // from the old `ecmaFeatures` block are all part of ES2015+ and enabled by
  // default at `ecmaVersion: 2020`, so they are omitted.
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "vue/no-v-model-argument": "off",
    },
  },

  // Feature barrels re-export their Slice's Vue components (ADR-0002 makes the
  // index module the Slice's public surface, and the router is meant to be the
  // caller). A state-only leaf module importing one therefore pulls the whole
  // component graph - and bootstrap-vue-next with it - into a module that only
  // wanted a store. That is what once deadlocked the form-harness specs, and it
  // costs module-evaluation time per spec file even when it does not hang.
  //
  // Leaf modules import the concrete module instead: `@/features/auth/store`,
  // never `@/features/auth`. Components and routers are unaffected.
  {
    files: [
      "src/stores/**/*.{js,ts}",
      "src/**/mixins/**/*.{js,ts}",
      "src/**/*Mixin.{js,ts}",
      "src/services/**/*.{js,ts}",
      "src/models/**/*.{js,ts}",
      "src/utils.js",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: FEATURE_BARRELS.map((slice) => ({
            name: `@/features/${slice}`,
            message:
              `Import '@/features/${slice}/<module>' instead of the barrel. The barrel ` +
              "re-exports components, which drags bootstrap-vue-next into this module.",
          })),
        },
      ],
    },
  },

  // A field's label is a `$trans('...')` literal and nothing else.
  //
  // The page's catalogue is built by scanning this source for those literals, so
  // a label composed while the page runs — `$trans(humanize(field))`, or a name
  // read from somewhere else — never enters the catalogue and reads English in a
  // Dutch UI. No type catches it: `FieldLabels` says a label is a thunk that
  // returns a string, and a derived name satisfies that as well as a literal
  // does. The message is the same for all four shapes because the fix is: write
  // the words out.
  {
    files: ["src/features/**/*.{ts,vue}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "VariableDeclarator[id.name=/FIELD_LABELS$/] ObjectExpression > Property[value.type!='ArrowFunctionExpression']",
          message: "A label is a thunk: () => $trans('Some label').",
        },
        {
          selector:
            "VariableDeclarator[id.name=/FIELD_LABELS$/] ObjectExpression > Property > ArrowFunctionExpression[body.type!='CallExpression']",
          message: "A label's thunk is a $trans('...') call, written out.",
        },
        {
          selector:
            "VariableDeclarator[id.name=/FIELD_LABELS$/] ObjectExpression > Property > ArrowFunctionExpression > CallExpression[callee.name!='$trans']",
          message: "A label's thunk is a $trans('...') call, written out.",
        },
        {
          selector:
            "VariableDeclarator[id.name=/FIELD_LABELS$/] ObjectExpression > Property > ArrowFunctionExpression > CallExpression[callee.name='$trans'] > .arguments:not(Literal)",
          message:
            "A label is a literal string: $trans() over anything computed is not extracted, so it would not be translated.",
        },
      ],
    },
  },

  // Test files: enable Mocha + Jest globals.
  // The old `.eslintrc.js` declared the Mocha override six times and the
  // Jest override once for the same patterns; the effective end-state was
  // simply "both", so we merge them into a single block here.
  {
    files: [
      "**/__tests__/*.{js,mjs,cjs,ts,tsx,jsx}",
      "**/tests/unit/**/*.spec.{js,mjs,cjs,ts,tsx,jsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.jest,
      },
    },
  },
];
