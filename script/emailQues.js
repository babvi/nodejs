const mongoose = require('mongoose')
const EmailQue = require('../models/EmailQue');
const Groups = require('../models/Groups');
const Users = require('../models/Users');
const Email = require('../modules/service/email');

/**
 * Send Email From Email Ques List
 */
async function sendEmailFromEmailQues() {
  try {
    const emailsList = await EmailQue.find({}).lean();
    for (let i = 0; i < emailsList.length; i++) {
      const emailObject = emailsList[i];
      const getSenderData = await Users.findOne({userId: emailObject.senderId}).select({'emailId': 1, 'userName': 1});
      const userData = await Users.findOne({userId: emailObject.userId}).select({'emailId': 1, 'userName': 1});
      const groupData = await Groups.findOne({_id : mongoose.Types.ObjectId(emailObject.groupId)});
      if (emailObject.isTriedToSend) {
        continue;
      } else {
        emailsList[i].subject = groupData.type== 'onetoone' ? `App - New Unread Message from ${getSenderData.userName}`: `App - New Unread Message regarding ${groupData.groupName}`;
        if (userData) {
        // TODO Need to set it from user collection once developed
          emailObject['to'] = userData.emailId;
          emailObject['userName'] = userData.userName;
        } else {
          await EmailQue.updateOne({_id: emailObject._id}, {sendingLog: 'userId not found', isTriedToSend: true});
        }
        emailsList[i].senderUsername = getSenderData.userName;
        const sendMail = await Email.sendChatEmail(emailsList[i]);
        if (sendMail) {
          await EmailQue.findOne({_id: emailObject._id}).deleteOne();
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}
exports.sendEmailFromEmailQues = sendEmailFromEmailQues;

