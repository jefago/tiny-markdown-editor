const { PORT } = require('./jest/util/config');

module.exports = {
  preset: "jest-puppeteer",
  globals: {
  },
  setupFiles: [
    "./jest/util/test-helpers.js"
  ],
  setupFilesAfterEnv: [
    "./jest/util//setup.js"
  ]
}