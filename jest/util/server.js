const express = require('express');
const path = require('path');
const { PORT } = require("./config");

const app = express();
app.use('/', express.static(path.resolve(__dirname, '..', '..', 'dist')));
app.listen(PORT, () => {
  console.log(`Serving TinyMDE files at http://localhost:${PORT}/`);
});