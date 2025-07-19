const { stopServer } = require('./server');
const fs = require('fs');
const path = require('path');

module.exports = async function() {
  // Stop the server
  await stopServer();
  
  // Remove the marker file
  const markerFile = path.join(__dirname, '.server-running');
  if (fs.existsSync(markerFile)) {
    fs.unlinkSync(markerFile);
  }
};