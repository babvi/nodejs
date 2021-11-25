const Chat = require('../../models/Chat');
const Groups = require('../../models/Groups');
const User = require('../../models/Users');
const Broadcast = require('../../config/broadcast');
const socket = require('../../config/socket');
const socketController = require('../../controller/socketController');
module.exports = {
  autoMessageBroadcastToMembers: async function(groupId, message, senderId, memberId, fileUrl, fileName) {
    const group = await Groups.findOne({_id: groupId}).lean();
    if (!group) {
      console.log('Group not found!');
    }
    if (message=='USER_REMOVE') {
      group.groupMembers.push(memberId);
    }
    if (Broadcast[message]) {
      console.log('Broadcast message', Broadcast[message]);
      message = Broadcast[message];
    }
    User.find({userId: memberId}, async function(err, resp) {
      if (group) {
        const chatMessage = new Chat({
          groupId: groupId,
          message: resp.length > 0 ? message.replace('##USERNAME##', resp[0].userName) : message,
          groupName: group.groupName,
          senderId: senderId,
          type: group.type,
          isBroadcast: true,
          sendTo: group.groupMembers,
          fileUrl: fileUrl || null,
          fileName: fileName,
          readUserIds:[senderId]
        });
        const data = await chatMessage.save();
        group.groupMembers.forEach(async (userId) => {
          const userData = await User.findOne({userId: userId});
          const unreadData = await socketController.getUnreadCountByUser(userId, userData.userName, group.type, senderId, group, true);
          global.globalSocket.sockets.in(userId).emit(socket.NOTIFY_UNREAD_GLOBAL, unreadData);
          const dbResult = await socketController.allUnreadGlobalCount(userId)
          const responseObj = {};
          responseObj['data'] = dbResult;
          if(dbResult.length) responseObj['data'] = dbResult;
          else {
            let userObj= [{"_id":userId,"count":0}]
            responseObj['data'] = userObj
          }
          // responseObj['userId']=userId
          // responseObj['total'] = dbResult ? dbResult.length : 0;
          global.globalSocket.sockets.in(userId).emit(socket.NOTIFY_UNREAD_GLOBAL_COUNT, responseObj);
        });
        await global.globalSocket.emit(socket.REFRESH_GLOBAL_GROUP_MEMBER, {
          groupId: groupId,
          senderId: senderId,
          groupName: group.groupName,
          memberId: memberId,
          message: resp.length > 0 ? message.replace('##USERNAME##', resp[0].userName) : message,
          fileName: fileName,
          fileUrl: fileUrl,
          _id: data._id,
          msgObj: data,
        });

        // Disabled as discussed with Vivek [28th June'21]
        // await Notification.sendNotifications(groupId, chatMessage._id, chatMessage, senderId);
        return data;
      }
    });
  },
};

