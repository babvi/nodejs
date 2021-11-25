const Broadcast = require('../modules/service/broadcast');
const message = require('../config/message');
// const socket = require('../config/socket');
const response = require('../modules/service/response');
/* Send Broadcast Message API */
exports.sendBroadCastMessage = async function(req, res) {
  try {
    if (req.body.groupId, req.body.message, req.body.senderId) {
      const broadcast = await Broadcast.autoMessageBroadcastToMembers(req.body.groupId, req.body.message, req.body.senderId, 0, req.body.fileUrl, req.body.fileName);
      console.log('broadcast:', broadcast);
      return res.json(response.success(200, message.serverResponseMessage.Broadcast_message_send));
    } else return res.json(response.failure(204, message.serverResponseMessage.Broadcast_Message_PassingData));
  } catch (error) {
    console.log('Error', error);
    return error;
  }
};
