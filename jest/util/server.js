const express = require('express');
const http = require('http');
const path = require('path');
const { PORT, HOST } = require("./config");

let server;
let serverStarted = false;

/**
 * Checks whether whatever is already listening on PORT is a TinyMDE test
 * server, by asking it for a file we know we serve and looking for a marker in
 * the response. A status code alone isn't enough - plenty of servers answer 200
 * to anything. Resolves false for anything unrecognized, including a non-HTTP
 * listener.
 */
const isOurServer = () => new Promise((resolve) => {
  const request = http.get(
    { host: HOST, port: PORT, path: '/blank.html', timeout: 2000 },
    (response) => {
      if (response.statusCode !== 200) {
        response.resume(); // Drain, so the socket can close.
        resolve(false);
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(body.includes('tiny-mde.js')));
      response.on('error', () => resolve(false));
    }
  );
  request.on('error', () => resolve(false));
  request.on('timeout', () => {
    request.destroy();
    resolve(false);
  });
});

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

    server.on('error', async (error) => {
      if (error.code !== 'EADDRINUSE') {
        reject(error);
        return;
      }
      // A second test run against the same checkout can share a server, so a
      // busy port isn't necessarily a problem - but only once we've confirmed
      // it's ours. Silently assuming would mean testing against whatever else
      // happens to be on this port, and reporting the results as if they were
      // ours.
      if (await isOurServer()) {
        console.log(`Port ${PORT} is already serving the TinyMDE test files, reusing it`);
        serverStarted = true;
        server = null; // Don't hold a reference to a server we don't control.
        resolve();
        return;
      }
      reject(new Error(
        `Port ${PORT} is in use by something that is not the TinyMDE test server. ` +
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