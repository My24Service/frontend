module.exports = {
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWithSourceString('process')
          },
        },
      }
    },
  ],
  presets: [
    "@babel/preset-env"
  ],
};
