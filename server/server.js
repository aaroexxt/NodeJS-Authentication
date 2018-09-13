//npm modules
const express = require('express');

// create the server
const app = express();

// create the homepage route at '/'
app.get('/', (req, res) => {
  console.log(req)
  res.send('You hit the home page without restarting the server automatically\n')
})

// tell the server what port to listen on
app.listen(3000, () => {
  console.log('Listening on localhost:3000')
})