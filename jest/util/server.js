const express = require('express');
const path = require('path');
const { PORT } = require("./config");

let server;
let serverStarted = false;

const startServer = () => {
  if (serverStarted && server) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const app = express();
    app.use('/', express.static(path.resolve(__dirname, '..', '..', 'dist')));
    server = app.listen(PORT, () => {
      console.log(`Serving TinyMDE files at http://localhost:${PORT}/`);
      serverStarted = true;
      resolve();
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use, assuming server is already running`);
        serverStarted = true;
        server = null; // Don't hold reference to server we don't control
        resolve();
      } else {
        reject(error);
      }
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