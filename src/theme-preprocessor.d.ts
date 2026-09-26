// vite-plugin-theme-preprocessor ships no type declarations. A shorthand
// module declaration cannot live beside the import it describes (that reads
// as an augmentation of an untyped module, which TS2665 forbids), so the
// contract lives in this declaration file and theme.ts imports it plainly.
declare module 'vite-plugin-theme-preprocessor/dist/browser-utils' {
  export function toggleTheme(options: { scopeName: string }): void
}
