import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import vue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
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
          //   - pure punctuation (e.g. ":", ".,")
          //   - a single letter
          //   - URL protocol prefixes (http://, https://, ftp://, …)
          //   - URL path/domain fragments (e.g. "/automation-updated-order", ".my24service.com/api/...")
          //   - numbers, optionally with a unit (e.g. "18 m²", "1000 EUR")
          // Words with attached punctuation ("Wanneer:", "POST:") are NOT
          // ignored — they are still flagged so they can be reviewed.
          ignorePattern:
            "^([-?%*.,#:()&\\/\\d ]+|[A-Za-z]|\\w+://|/\\S+|\\.\\S+|\\d+(?:\\.\\d+)?(?:\\s+\\S+)?)$",
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
