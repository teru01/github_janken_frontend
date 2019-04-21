const express = require('express');
const serve_static = require("serve-static")
const path = require('path');
const app = express();
app.use(serve_static(path.join(__dirname, 'dist')));
const port = process.env.PORT || 80;
app.listen(port);
