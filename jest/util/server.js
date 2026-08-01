const express = require('express');
const path = require('path');
const { PORT, HOST } = require("./config");

let server;
let serverStarted = false;

const startServer = () => {
  if (serverStarted && server) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const app = express();
    app.use('/', express.static(path.resolve(__dirname, '..', '..', 'dist')));
    // Bind to loopback explicitly. Without a host, Node listens on every
    // interface, which needlessly exposes the test server to the network for
    // the length of the run - on a shared or self-hosted CI runner, to anything
    // that can reach it.
    //
    // Deliberately no callback argument here: express's app.listen() wraps a
    // trailing callback in once() and *also* registers it as the server's error
    // handler, so a failed bind would invoke it as though the listen had
    // succeeded. Listening for the events directly keeps the two apart.
    server = app.listen(PORT, HOST);

    server.on('listening', () => {
      console.log(`Serving TinyMDE files at http://${HOST}:${PORT}/`);
      serverStarted = true;
      resolve();
    });

    server.on('error', (error) => {
      if (error.code !== 'EADDRINUSE') {
        reject(error);
        return;
      }
      // Never reuse someone else's server. This used to assume a busy port
      // meant our own server was already up, which would run the whole suite
      // against whatever happened to be listening and report the results as
      // ours. A second worktree is the likely case, and its server serves a
      // different dist/ - so the suite would pass or fail on the wrong build.
      reject(new Error(
        `Port ${PORT} is already in use, so the test server could not start. ` +
        `Another test run (possibly in a different worktree) is the likely cause; ` +
        `its server would be serving a different dist/. ` +
        `Stop whatever is listening on ${HOST}:${PORT}, or change PORT in jest/util/config.js.`
      ));
    });
  });
};

const stopServer = () => {
  if (!serverStarted || !server) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    server.close(() => {
      console.log('Test server stopped');
      serverStarted = false;
      server = null;
      resolve();
    });
  });
};

// Global server instance to prevent multiple starts
let globalServer;

const ensureServerStarted = () => {
  if (!globalServer) {
    globalServer = startServer();
  }
  return globalServer;
};

const ensureServerStopped = () => {
  if (globalServer) {
    const stopPromise = stopServer();
    globalServer = null;
    return stopPromise;
  }
  return Promise.resolve();
};

module.exports = { startServer, stopServer, ensureServerStarted, ensureServerStopped };