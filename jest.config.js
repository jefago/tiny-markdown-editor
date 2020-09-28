const { PORT } = require('./src/jest/config');

module.exports = {
  preset: "jest-puppeteer",
  globals: {
    PATH: `http://localhost:${PORT}/blank.html`
  },
  setupFiles: [
    "./src/jest/test-helpers.js"
  ],
  setupFilesAfterEnv: [
    "./src/jest/setup.js"
  ]
}