const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
      userId: {
        type: String,
      },
      userName: {
        type: String,
      },
      designation: {
        type: String,
      },
      department: {
        type: String,
      },
      profileImage: {
        type: String,
      },
      country: {
        type: Array,
      },
      language: {
        type: Array,
      },
      gender: {
        type: String,
      },
      emailId: {
        type: String,
      },
      deviceToken: {
        type: Array,
      },
      deviceType: {
        type: String,
        enum: ['android', 'ios'],
        default: 'android',
      },
      userType: {
        type: String,
      },
      companyResellerId: {
        type: String,
      },
      // vendorCompanyId: {
      //   type: String,
      // },
    }, {
      timestamps: true,
    },
);

const users = mongoose.model('users', userSchema);
module.exports = users;

