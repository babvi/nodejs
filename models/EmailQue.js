const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailQueSchema = new Schema(
    {
      userId: {
        type: String,
      },
      message: {
        type: String,
      },
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Groups',
      },
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Messages',
      },
      senderId: {
        type: String,
      },
      sendingLog: {
        type: String,
      },
      isTriedToSend: {
        type: Boolean, default: false,
      },
    },
    {
      timestamps: true,
    },
);

const EmailQue = mongoose.model('EmailQue', emailQueSchema);

module.exports = EmailQue;
