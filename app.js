// require the express module
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/index');
const connect = require('./config/dbconnect');
require('./script/email-notify');

connect.then( (db) => {
  console.log(`Connected to MongoDB`);
}).catch((e) => {
  console.error(`Could not init db\n${e.trace}`);
});

app.use(cors());

// bodyparser middleware
app.use(bodyParser.json());

// routes
require('./routes/route')(app);

// set the express.static middleware
app.use(express.static(__dirname + '/public'));

const socketIO = require('socket.io');
const server = express()
    .use(app)
    .listen(config.port, () => console.log(`Listening Socket on ${ config.port }`));
const socket = socketIO(server);
require('./modules/sockets/socket')(socket);
global.globalSocket = socket;

