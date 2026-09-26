// eslint.i18n.config.js
import tseslint from "typescript-eslint";
import baseConfig from "./eslint.config.js";

// Extract the i18n rules from the base config, stripping the rest so this config
// can be used solely for i18n linting: the raw-text rule for templates, and the
// label rule that keeps a field's label a `$trans('...')` literal. Labels live in
// .ts modules, which is why `lint:i18n` also lints `src/features/**/*.ts`.
const I18N_RULES = [
  "@intlify/vue-i18n/no-raw-text",
  "no-restricted-syntax",
];

const stripped = baseConfig.map((block) => {
  const { rules, ...rest } = block;
  const kept = Object.fromEntries(
    Object.entries(rules ?? {}).filter(([name]) => I18N_RULES.includes(name)),
  );
  return {
    ...rest,
    ...(Object.keys(kept).length > 0 ? { rules: kept } : {}),
  };
});

// Neither rule needs type information, so every file gets a plain parse:
// the base config's eslint-plugin-typed-vue would otherwise build a program
// per SFC for nothing.
export default [
  ...stripped,
  // The base config's `ignores` is scoped to its own blocks, not these two.
  { ignores: ["src/api/**"] },
  {
    files: ["**/*.vue"],
    processor: "vue/vue",
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  { files: ["**/*.{ts,mts,cts}"], languageOptions: { parser: tseslint.parser } },
];