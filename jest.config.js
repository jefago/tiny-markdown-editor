const { PORT } = require('./jest/util/config');

module.exports = {
  preset: "jest-puppeteer",
  globals: {
    PATH: `http://localhost:${PORT}/blank.html`
  },
  setupFiles: [
    "./jest/util/test-helpers.js"
  ],
  setupFilesAfterEnv: [
    "./jest/util//setup.js"
  ]
}