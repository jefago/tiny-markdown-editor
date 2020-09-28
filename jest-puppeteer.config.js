const { PORT } = require('./jest/util/config');

module.exports = {
  server: {
    command: 'node jest/util/server.js',
    port: PORT
  }
}