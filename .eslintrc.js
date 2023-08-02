module.exports = {
  root: true,

  "env": {
    "es6": true,
    "browser": true
  },

  "parser": "vue-eslint-parser",

  "parserOptions": {
    "parser": "@babel/eslint-parser",
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "arrowFunctions": true,
      "binaryLiterals": true,
      "blockBindings": true,
      "classes": true
    }
  },

  "extends": [
    'plugin:vue/essential',
  ],

  "rules": {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },

  "overrides": [
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "mocha": true
      }
    },
    {
      "files": [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      "env": {
        "jest": true
      }
    }
  ]
};
