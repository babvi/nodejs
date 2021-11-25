const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema(
    {
      message: {
        type: String,
      },
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Groups',
      },
      groupName: {
        type: String,
      },
      senderId: {
        type: String,
      },
      fileName: {
        type: String,
      },
      isFile: {
        type: Boolean,
      },
      fileType: {
        type: String,
      },
      filePath: {
        type: String,
      },
      readUserIds: {
        type: [String],
      },
      metadata: {
        type: Map,
        default: new Map(),
      },
      type: {
        type: String,
      },
      emailNotified: {
        type: Boolean,
        default: false,
      },
      isBroadcast: {
        type: Boolean,
        default: false,
      },
      addedMemberId: {
        type: String,
      },
      isEmailMessage: {
        type: Boolean,
        default: false,
      },
      emailMessagesId: {
        type: String,
      },
      fileUrl: {
        type: String,
      },
      sendTo: {
        type: [String],
      },
      quoteMessage: {
        type: mongoose.Schema.Types.Mixed
      },
    },
    {
      timestamps: true,
    },
);
chatSchema.virtual('test').
    get(function() {
      return this._test;
    }).
    set(function(v) {
      this._test = v;
    });

const Chat = mongoose.model('Messages', chatSchema);

module.exports = Chat;
