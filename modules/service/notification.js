const FCM = require('fcm-node');
const config = require('../../config/index');
const fcm = new FCM(config.firebaseKey);
const User = require('../../models/Users');

/**
 * Send Push Notifications
 * @param {String} group Group
 * @param {String} id ID
 * @param {String} msg Message
 * @param {String} senderId senderId
 * @param {string} msgType onetoone / quote
 */
exports.sendNotifications = async function(group, id, msg, senderId, msgType) {
  const sender = await User.findOne({userId: senderId}).select({userName: 1, profileImage: 1});
  let notificationMsg = group.groupName;
  if (msgType === 'onetoone') {
    notificationMsg = sender.userName;
  }

  const message = {
    to: '/topics/'+group._id,
    data: {
      groupId: group._id,
      groupName: group.groupName,
      senderName: sender.userName,
      senderImage: sender.profileImage,
      rec_type: msgType, // (onetoone/quote)
      id: id,
      senderId: senderId,
    },
    notification: {
      title: notificationMsg,
      body: msg,
    },
  };
  if (config.environment == 'PRODUCTION') {
    if (config.sendNotification === 'true') {
      fcm.send(message, (err, response) => {
        if (err) {
          console.log('Push Notification Sending Error :: ', err);
        }
        console.log('Notification Send Successfully :: ', response);
      });
    }
  }
},


/**
 * Subscribe To FCM Topic
 * This function used to subscribe specific topic of FCM
 * @param {Array} tokens  The tokens array.
 * @param {String} topic  The FCM topic.
 */
exports.subscribeToTopic = async function(tokens, topic) {
  if (!tokens) {
    return false;
  }
  fcm.subscribeToTopic(tokens, topic, (err, res) => {
    if (err) {
      console.log('Subscribe To Topic Error :: ', err);
    }
    console.log('Subscribe To Topic Successfully :: ', res);
  });
};

/**
 * Unsubscribe To FCM Topic
 * This function used to unsubscribe specific topic of FCM
 * @param {Array} tokens  The tokens array.
 * @param {String} topic  The FCM topic.
 */
exports.unsubscribeToTopic = async function(tokens, topic) {
  if (!tokens) {
    return false;
  }
  fcm.unsubscribeToTopic(tokens, topic, (err, res) => {
    if (err) {
      console.log('Unsubscribe To Topic Error :: ', err);
    }
    console.log('Unsubscribe To Topic Successfully :: ', res);
  });
};
