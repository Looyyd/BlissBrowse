/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/tests/unit/**/*.test.js",
    "**/tests/unit/**/*.test.ts",
    "**/tests/unit/**/*.spec.js",
    "**/tests/unit/**/*.spec.ts"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

};