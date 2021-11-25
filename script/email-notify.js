const cron = require('node-cron');
const Chat = require('../models/Chat');
require('../models/Groups');
const EmailQue = require('../models/EmailQue');
const sendEmail = require('./emailQues');
require('../modules/service/email');
const moment = require('moment');
require('fs');
const config = require('../config/index');
const users = require('../models/Users');
if (config.environment == 'PRODUCTION') {
  // cron.schedule('0 0 */5 * * *', function() {
  cron.schedule('*/10 * * * *', function() {
    messageEmailNotify()
        .then(async () => {
          await sendEmail.sendEmailFromEmailQues();
        })
        .catch((e) => {
          console.error(e);
        });
  });
}

/**
 * Auto Message Email Notify
 */
async function messageEmailNotify() {
  const chats = await Chat.aggregate([
    {
      '$match': {
        'emailNotified': false,
        'createdAt': {
          $lte: new Date(moment().subtract(config.emailMinutes, 'minutes').toISOString()),
          $gt: new Date(moment().subtract(config.emailMinutes, 'minutes').subtract(10, 'minutes').toISOString()),
        },
      },
    }, {
      '$group': {
        '_id': '$groupId',
        'readUserIds': {
          '$last': '$readUserIds',
        },
        'groupId': {
          '$last': '$groupId',
        },
        'message': {
          '$last': '$message',
        },
        'messageId': {
          '$last': '$_id',
        },
        'sendTo': {
          '$last': '$sendTo',
        },
        'senderId': {
          '$last': '$senderId',
        },
        'createdAt': {
          '$last': '$createdAt',
        },
      }
    },{
      $lookup:{
        from: 'groups',
        localField: 'groupId',
        foreignField: '_id',
        as: 'groupId'
      },
    },{
      '$unwind':
        {
          path: '$groupId',
          preserveNullAndEmptyArrays: false
        }
    }
  ]);
  // console.log('chatsData', chatsData);
  // const chats = await Chat.find({
  //   createdAt: {$lte: moment().subtract(config.emailMinutes, 'minutes'), $gt: moment().subtract(config.emailMinutes, 'minutes').subtract(10, 'minutes')},
  //   emailNotified: false,
  // }).populate('groupId')
  //     .sort({createdAt: -1});
  //   console.log('chats with find----', chats);
  for (let index = 0; index < chats.length; index++) {
    const element = chats[index];
    const isSenderIdExist = await users.findOne({'userId': element.senderId});
    if (isSenderIdExist) {
      const readUserArray = element.readUserIds;
      const sendTo = element.sendTo;
      for (let k = 0; k < element.groupId.groupMembers.length; k++) {
        if ((readUserArray.indexOf(element.groupId.groupMembers[k]) == -1) &&
        (sendTo.indexOf(element.groupId.groupMembers[k]) > -1)) {
          await emailQueCreate(element, element.groupId.groupMembers[k]);
          await updateEmailNotifyStatus(element.id);
        }
      }
      if (JSON.stringify(readUserArray.sort()) === JSON.stringify(element.groupId.groupMembers.sort())) {
        console.log('here ', element.id);
        await updateEmailNotifyStatus(element.id);
      }
    }
  }
}


/**
 * Update Email Notify Status
 * @param {Object} id
 */
async function updateEmailNotifyStatus(id) {
  await Chat.findOneAndUpdate({
    _id: id,
  },
  {
    $set: {
      emailNotified: true,
    },
  });
  return;
}

/**
 * Send Push Notifications
 * This function used to send notification to respective device/topic
 * @param {Object} chatObj
 * @param {Object} toUserId
 */
async function emailQueCreate(chatObj, toUserId) {
  const emailMessage = new EmailQue({
    userId: toUserId,
    groupId: chatObj.groupId,
    message: chatObj.message,
    messageId: chatObj._id,
    senderId: chatObj.senderId,
  });
  emailMessage.save();
  return emailMessage;
}
