module.exports = {
    testEnvironment: "jsdom",
    setupFiles: [ 'jest-canvas-mock' ],
    testTimeout: 20000,
    moduleFileExtensions: [
      "js",
      "json",
      // tell Jest to handle `*.vue` files
      "vue"
    ],
    transform: {
      // process `*.vue` files with `vue-jest`
      ".*\\.(vue)$": "vue-jest",
      ".*\\.(js)$": "babel-jest"
    },
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
}
