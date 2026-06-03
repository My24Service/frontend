// eslint.i18n.config.js
import baseConfig from "./eslint.config.js";

// Extract only the @intlify/vue-i18n/no-raw-text rule from the base config,
// stripping all other rules so this config can be used solely for i18n linting.
const stripped = baseConfig.map((block) => {
  const { rules, ...rest } = block;
  const noRawText = rules?.["@intlify/vue-i18n/no-raw-text"];
  return {
    ...rest,
    ...(noRawText ? { rules: { "@intlify/vue-i18n/no-raw-text": noRawText } } : {}),
  };
});

export default stripped;