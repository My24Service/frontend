import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import vue from "eslint-plugin-vue";
import globals from "globals";

export default [
  // Vue 3 essential rule set (replaces the legacy `extends: ['plugin:vue/essential']`)
  // This also sets the parser for *.vue files and sourceType: 'module'.
  ...vue.configs["flat/essential"],

  // Untranslated bare text in Vue templates / attributes
  {
    files: ["**/*.vue"],
    plugins: { "@intlify/vue-i18n": vueI18n },
    rules: {
      "@intlify/vue-i18n/no-raw-text": [
        "error",
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
          ignorePattern: "^([-?%*.,#:()&\\/\\d]+|[A-Za-z])$",
          ignoreText: ["EUR", "USD", "€", "", "–", "—", "×", "·", "[ x ]"],
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
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      ecmaVersion: 2020,
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
