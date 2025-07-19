const { startServer } = require('./server');
const fs = require('fs');
const path = require('path');

module.exports = async function() {
  // Start the server
  await startServer();
  
  // Create a marker file to indicate server is running
  const markerFile = path.join(__dirname, '.server-running');
  fs.writeFileSync(markerFile, '');
};