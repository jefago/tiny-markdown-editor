const { PORT } = require("./src/jest/config");

module.exports = {
  server: {
    command: 'node src/jest/server.js',
    port: PORT
  }
}