// eslint.i18n.config.js
import baseConfig from "./eslint.config.js";
import vueI18n from "@intlify/eslint-plugin-vue-i18n";

// Re-use the main config but wipe out all rules.
const stripped = baseConfig.map((block) => ({ ...block, rules: {} }));

export default [
  ...stripped,
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
          ignorePattern: "[-?%*.,#:()&\\/\\d]+|^[A-Za-z]$",
          ignoreText: ["EUR", "USD", "€", "", "–", "—", "×", "·", "[ x ]"],
        },
      ],
    },
  },
];
