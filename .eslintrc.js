module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly",
    "uni": true
  },
  parser: "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 2018,
  },
  "rules": {
    semi: ['error', 'never'], // 结尾不用写分号
    "indent": ["error", 2]
  }
}
