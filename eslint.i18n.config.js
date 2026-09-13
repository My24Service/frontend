// eslint.i18n.config.js
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

export default stripped;