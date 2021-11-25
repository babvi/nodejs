const groupmsgs = require('../models/Chat');
const message = require('../config/message');
const response = require('../modules/service/response');

/**
 * Group Message Create
 * This function is used to Create Group Message
 * @param {Object} data .
 * @param {object} res The return response object.
 * @return {Object} json Return Response.
 */
exports.groupmsgcreate = function(data, res) {
  try {
    return new Promise((resolve, reject) => {
      const grpmsg = {
        message: data.message,
        userid: data.userid,
        groupId: data.groupid,
      };
      groupmsgs.GroupChat.create(grpmsg, (err, groupchatmsgres) => {
        resolve(groupchatmsgres);
      });
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

