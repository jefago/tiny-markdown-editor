module.exports = {
  testEnvironment: 'node',
  globalSetup: './jest/util/jest-global-setup.js',
  globalTeardown: './jest/util/jest-global-teardown.js',
  globals: {
  },
  setupFiles: [
    "./jest/util/test-helpers.js"
  ],
  setupFilesAfterEnv: [
    "./jest/util//setup.js"
  ]
}