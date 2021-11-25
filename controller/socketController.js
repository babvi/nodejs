const path = require('path');
const Chat = require('../models/Chat');
const Groups = require('../models/Groups');
const Users = require('../models/Users');
const logs = require('../modules/service/logs');
const socketConfig = require('../config/socket');
const Broadcast = require('../modules/service/broadcast');
const Notification = require('../modules/service/notification');
const aws = require('../modules/service/aws');
const moment = require('moment');
const users = {};

exports.connection = async function(socket, socketUsers, groupName) {
  socket.join(socket.handshake.query.senderId);
  socketUsers[socket.handshake.query.senderId] = true;
  socket.emit(socketConfig.ALL_ONLINE_NOTIFY_GLOBAL, {users: socketUsers});
  socket.broadcast.emit(socketConfig.NOTIFY_ONLINE_USER, {users: socketUsers});
  logs.groupLogs(socket, groupName);
};

exports.join = async function(data, socket) {
  const groupName = data.groupName;
  if (data.senderId) {
    users[data.senderId+'_'+groupName] = groupName;
  } else {
    users[groupName] = groupName;
  }
  let clientInfo = {};
  clientInfo = data;
  clientInfo['IPAddress'] = socket.request.connection.remoteAddress;

  /* save chat group to the database */
  let grpObj = await Groups.findOne({groupName: groupName});

  const array = grpObj ? Object.keys(JSON.parse(JSON.stringify(grpObj.removedUsers))) : 0;
  let index=1;
  if (data.type =='onetoone') {
    const grupMembers = data.groupName.split('-');
    const firstMemberData = await Users.findOne({userId: grupMembers[0]});
    const secondMemberData = await Users.findOne({userId: grupMembers[1]});
    if (firstMemberData && secondMemberData) {
      index= 1;
    } else {
      index= 0;
    }
  }
  let isRemoved = false;
  if (array.length > 0) {
    isRemoved = array.includes(data.senderId.toString());
    if (isRemoved == false) socket.join(groupName);
  } else {
    socket.join(groupName);
  }
  if (!grpObj) {
    const groupArr = new Groups(clientInfo);
    grpObj= await groupArr.save();
    if (data.deviceTokens) {
      await Notification.subscribeToTopic(data.deviceTokens, groupArr._id);
    }
    if (data.type == 'quote') {
      const msg = await Broadcast.autoMessageBroadcastToMembers(groupArr._id, 'DEALGENERATE', data.senderId);
      socket.emit(socketConfig.RECEIVED, msg);
    }
  } else if (!grpObj.groupMembers.includes(data.senderId) && isRemoved == false && data.type=='onetoone') {
    grpObj.groupMembers.push(data.senderId.toString());
    grpObj.save();
  }
  if (index == 1) {
    if (data.senderId % 1 === 0) {
      data.senderId = data.senderId.toString();
    }
    const changes = {
      $push: {readUserIds: data.senderId},
    };
    // await Chat.updateMany({groupName: groupName, readUserIds: {$nin: [data.senderId]}}, changes);
    await Chat.updateMany({groupName: groupName, readUserIds: {$nin: [data.senderId]}, sendTo: {$in: [data.senderId]}}, changes);
    socket.broadcast.in(groupName).emit(socketConfig.NOTIFY_USER_READ, {userId: data.senderId});
    const newUnreadData = {};
    newUnreadData['groupName'] = data.groupName;
    data.groupMembers ? data.groupMembers.length > 0 ? newUnreadData['groupMembers'] = data.groupMembers : '' : '';
    newUnreadData['senderId'] = data.senderId;
    newUnreadData['type'] = data.type;
    socket.broadcast.in(groupName).emit(socketConfig.NEW_CHAT_CONNECT, newUnreadData);
  }
};

exports.chatMessage = async function(socket, msg, senderId, metadata, type, groupName, socketUsers, userName, fileUrl, quoteMsgId) {
  Groups.findOne({groupName: groupName}).sort({createdAt: -1}).then(async (group) => {
    const onlineUsers = this.getOnlineUsers(groupName, senderId);
    onlineUsers.push(senderId);
    group.updatedAt = moment.utc(new Date());
    group.save();
    msg = this.sanitize(msg);
    if (msg != '') {
      const readUserIds = [];
      onlineUsers.forEach(async (ids) => {
        if (group.groupMembers.includes(ids)) {
          readUserIds.push(ids);
        }
      });

      const messageData = {};
      messageData['groupId'] = group._id,
      messageData['message'] = msg,
      messageData['groupName'] = groupName,
      messageData['senderId'] = senderId,
      messageData['type'] = type,
      // metadata: metadata,
      // messageData['readUserIds'] = onlineUsers;
      messageData['readUserIds'] = readUserIds;
      messageData['userName'] = userName;
      messageData['fileUrl'] = fileUrl;
      messageData['isFile'] = false;
      messageData['sendTo']= group.groupMembers;
      if (quoteMsgId) {
        await Chat.findById(quoteMsgId, async function(err, chatDetails) {
          const quoteChatDetail = JSON.parse(JSON.stringify(chatDetails));
          if (quoteChatDetail) {
            const quoteMessageData = {};
            quoteMessageData['messageId'] = quoteMsgId;
            quoteMessageData['senderId'] = quoteChatDetail.senderId;
            quoteMessageData['createdAt'] = quoteChatDetail.createdAt;
            quoteMessageData['updatedAt'] = quoteChatDetail.updatedAt;
            quoteMessageData['message'] = quoteChatDetail.message;
            quoteMessageData['type'] = quoteChatDetail.type;
            messageData['quoteMessage'] = quoteMessageData;
          }
        });
      }
      const chatMessage = new Chat(messageData);

      messageData['createdAt'] = group.updatedAt;
      messageData['emailNotified'] = chatMessage.emailNotified;
      messageData['isBroadcast'] = chatMessage.isBroadcast;
      messageData['isEmailMessage'] = chatMessage.isEmailMessage;
      messageData['updatedAt'] = group.updatedAt;
      messageData['__v'] = group.__v;
      messageData['_id'] = chatMessage._id;
      if (type == 'quote' || type == 'custom' || (type=='onetoone' && group.groupMembers.includes(senderId))) {
        const chatMessageObj = await chatMessage.save();
        await Notification.sendNotifications(group, chatMessageObj._id, msg, senderId, type);
        socket.broadcast.in(groupName).emit(socketConfig.RECEIVED, messageData);
        socket.emit(socketConfig.RECEIVED, chatMessageObj);
        this.notifyUnreadAllGroup(group, senderId, socketUsers, onlineUsers, socket, msg, userName, type);
        logs.messageLog(groupName, senderId, msg);
      }
    }
  });
};

exports.fileNotify = async function(socket, data, groupName, socketUsers) {
  const filename = path.basename(data.name) ? path.basename(data.name) : null ;
  Groups.findOne({groupName: groupName}).sort({createdAt: -1}).then((group) => {
    group.updatedAt = moment.utc(new Date());
    group.save();
    /* Check users online */
    const onlineUsers = this.getOnlineUsers(groupName, data.senderId);
    onlineUsers.push(data.senderId);
    const msg = data.message || 'File Attached';

    const readUserIds = [];
    onlineUsers.forEach(async (ids) => {
      if (group.groupMembers.includes(ids)) {
        readUserIds.push(ids);
      }
    });

    const chatMessage = new Chat({
      groupId: group._id,
      message: msg,
      fileType: path.extname(filename),
      isFile: true,
      filePath: 'temp/',
      fileName: filename,
      groupName: groupName,
      sendTo: group.groupMembers,
      senderId: data.senderId,
      type: data.type,
      // metadata: data.metadata,
      readUserIds: readUserIds,
    });
    if (data.type == 'quote' || data.type == 'custom' || (data.type=='onetoone' && group.groupMembers.includes(data.senderId))) {
      chatMessage.save();
      chatMessage._doc.userName=data.userName;
      const platform = data.plateform;
      if (platform === 'web') {
        if (data.type === 'quote') {
          logs.fileUploadLog(group.dealId, data.senderId, filename);
          aws.fileUpload(chatMessage.fileName, group.dealId).then((finalRes)=>{});
        } else {
          logs.fileUploadLog(groupName, data.senderId, filename);
          aws.fileUpload(chatMessage.fileName, groupName).then((finalRes)=>{});
        }
      }
      socket.broadcast.in(groupName).emit(socketConfig.RECEIVED, chatMessage);
      socket.emit(socketConfig.RECEIVED, chatMessage);
      this.notifyUnreadAllGroup(group, data.senderId, socketUsers, onlineUsers, socket, msg, data.userName, data.type);
    }
  });
};

exports.getUnreadCountByUser = async function(userId, userName, type, senderId, group, broadcast=false) {
  const groupIds = await Groups.find({_id: group._id, groupMembers: {$in: [userId]}}).distinct('groupName');
  let where = {};
  if (broadcast) {
    where = {groupName: {$in: groupIds}, readUserIds: {$nin: [userId]}, sendTo: {$in: [userId]}};
  } else {
    where = {groupName: {$in: groupIds}, readUserIds: {$nin: [userId]}, senderId: {$nin: [userId]}, sendTo: {$in: [userId]}};
  }
  const dbResult = await Chat.aggregate([
    {
      '$match': where,
    },
    {
      '$sort': {'updatedAt': -1},
    },
    {
      '$project': {
        'groupName': 1,
        'message': 1,
        'updatedAt': 1,
        'groupId': 1,
        'isFile': 1,
      },
    },
    {
      '$group': {
        '_id': '$groupName',
        'groupName': {'$first': '$groupName'},
        'groupId': {'$first': '$groupId'},
        'message': {'$first': '$message'},
        'updatedAt': {'$first': '$updatedAt'},
        'userName': {'$first': userName},
        'senderId': {'$first': senderId},
        'type': {'$first': type},
        'count': {$sum: 1},
        'isFile': {'$first': '$isFile'},
      },
    },
  ]);
  return dbResult;
};

exports.getOnlineUsers = function(groupName, senderId) {
  let onlineUsers = [];
  const onlineUsersIds = [];
  if (Object.values(users).includes(groupName)) {
    onlineUsers = Object.keys(users).filter((k) => users[k] === groupName);
    /* const index = onlineUsers.indexOf(senderId);
        if (index > -1) {
            onlineUsers.splice(index, 1);
        }*/
    logs.onlineUsersLog(groupName, senderId);
  }

  /* New Code for the mobile and web seperator */
  onlineUsers.forEach(async (userId) => {
    const id = userId.split('_');
    if (senderId != id[0]) {
      onlineUsersIds.push(id[0]);
    }
  });
  console.log(onlineUsersIds);
  return onlineUsersIds;
};

exports.notifyUnreadAllGroup = function(group, senderId, socketUsers, onlineUsers, socket, msg, userName = '', type = '') {
  const groupMembersArr = JSON.parse(JSON.stringify(group.groupMembers));
  const index = groupMembersArr.indexOf(senderId);
  if (index > -1) {
    groupMembersArr.splice(index, 1);
  }
  groupMembersArr.forEach(async (userId) => {
    if (Object.keys(socketUsers).includes(userId) && !onlineUsers.includes(userId)) {
      const unreadData = await this.getUnreadCountByUser(userId, userName, type, senderId, group);
      socket.broadcast.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL, unreadData);
      const dbResult = await this.allUnreadGlobalCount(userId);
      const responseObj = {};
      if(dbResult.length) responseObj['data'] = dbResult;
      else {
        let userObj= [{"_id":userId,"count":0}];
        responseObj['data'] = userObj;
      }
      // responseObj['userId']=userId
      // responseObj['total'] = dbResult ? dbResult.length : 0;
      socket.broadcast.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL_COUNT, responseObj);
    }
  });
};

exports.notifyTypingAllGroup = function(groupName, socket, data, socketUsers, emitName) {
  Groups.findOne({groupName: groupName}).sort({createdAt: -1}).then((group) => {
    if (!group) return;
    const index = group.groupMembers.indexOf(data.senderId);
    if (index > -1) {
      group.groupMembers.splice(index, 1);
    }
    group.groupMembers.forEach(async (userId) => {
      if (Object.keys(socketUsers).includes(userId)) {
        const message = {
          groupId: group._id,
          groupName: groupName,
          user: data.user,
          message: socketConfig.TYPING_MESSAGE,
          senderId: data.senderId,
          type: data.type,
        };
        socket.broadcast.in(userId).emit(emitName, message);
      }
    });
  });
};

exports.allUnreadGlobalCount = async (userId) =>{
  const groupIds = await Groups.find({groupMembers: {$in: [userId]}}).distinct('groupName');
    const whereArrChat = {groupName: {$in: groupIds}, readUserIds: {$nin: [userId]}, senderId: {$nin: [userId]}, sendTo: {$in: [userId]}};
    return await Chat.aggregate([
      {
        '$match': whereArrChat,
      },
      {
        '$sort': {'updatedAt': -1},
      },
      {
        '$project': {
          'groupName': 1,
          'groupId': 1,
          'createdAt': 1,
        },
      },
      {
        $addFields: { 'userId': userId }
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'groupData',
        },
      }, {
        $unwind: {
          path: '$groupData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        '$group': {
          '_id': '$userId',
          'count': {$sum: 1},
        },
      },
    ]);
}

exports.disconnect = async function(socket, socketUsers) {
  if (socket.handshake.query.senderId) {
    delete users[socket.handshake.query.senderId + '_' + socket.handshake.query.groupName];

    const userData = [];
    Object.keys(users).forEach(function(key) {
      const id = key.split('_');
      userData.push(id[0]);
    });
    if (!userData.includes(socket.handshake.query.senderId)) {
      delete socketUsers[socket.handshake.query.senderId];
    }
  } else {
    delete users[socket.handshake.query.groupName];
  }
  /* remove saved socket from users object */
  delete users[socket.handshake.query.senderId + '_' + socket.handshake.query.groupName];
  socket.broadcast.emit(socketConfig.NOTIFY_ONLINE_USER, {users: socketUsers});
  logs.disconnectLog(socket.handshake.query.groupName, socket.handshake.query.senderId);
};


exports.sanitize = function(string) {
  const replaceText= string.replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<\/style>/gm, '')
      .replace(/<style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<\/script>/gm, '')
      .replace(/<script\/>/gm, '')
      .replace(/<script>/gm, '')
      .replace(/<html>/gm, '')
      .replace(/<\/html>/gm, '')
      .replace(/<p.*>/gi, '')
      .replace(/<\/p>/gm, '')
      .replace(/<a.*href="(.*?)".*>/gi, '')
      .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '')
      .replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, '')
      .replace(/([\r\n]+ +)+/gm, '')
      .replace(/&nbsp;/gi, '');
  return replaceText;
  // const reg = /[&<>"'/]/ig;
  // return string.replace(reg, (match)=>(''));
};
