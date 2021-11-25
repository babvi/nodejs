const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserDeviceTokenSchema = new Schema({
  userId: {
    type: Number,
  },
  deviceToken: {
    type: Array,
  },
  deviceType: {
    type: String,
  },
}, {
  timestamps: true,
},
);

const DeviceToken = mongoose.model('DeviceToken', UserDeviceTokenSchema);

module.exports = DeviceToken;

