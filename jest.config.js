const { PORT } = require('./jest/util/config');

module.exports = {
  testEnvironment: 'node',
  globals: {
  },
  setupFiles: [
    "./jest/util/test-helpers.js"
  ],
  setupFilesAfterEnv: [
    "./jest/util//setup.js"
  ]
}