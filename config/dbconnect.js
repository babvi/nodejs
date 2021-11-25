const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const config = require('./config/index');

let conString = config.development_databaseURL;
if (config.environment == 'PRODUCTION') {
  conString = config.databaseURL;
}
const connect = mongoose.connect(conString, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
module.exports = connect;
