const fs = require('fs');
const path = require('path');
const ss = require('socket.io-stream');
const socketConfig = require('../../config/socket');
const socketController = require('../../controller/socketController');
const socketUsers = {};

module.exports = function(socket) {
  /* socket connection establishing */
  socket.on(socketConfig.CONNECTION, (socket) => {
    // Initialise the connection
    const groupName = socket.handshake.query.groupName;
    socketController.connection(socket, socketUsers, groupName);

    // JOIN Soecific Group Connection
    socket.on(socketConfig.JOIN, async function(data) {
      socketController.join(data, socket);
    });

    // Upload file to the server
    ss(socket).on(socketConfig.FILE_UPLOAD, function(stream, data) {
      const filename = path.basename(data.name);
      stream.pipe(fs.createWriteStream('resources/attachments/'+filename));
    });

    // Notify file upload
    socket.on(socketConfig.FILE_MESSAGE, async function(data) {
      await socketController.fileNotify(socket, data, groupName, socketUsers);
    });

    // Notify chat message to the socket users
    socket.on(socketConfig.CHAT_MESSAGE, async function(msg, senderId, metadata, type, groupName, userName, fileUrl, quoteMsgId) {
      await socketController.chatMessage(socket, msg, senderId, metadata, type, groupName, socketUsers, userName, fileUrl, quoteMsgId);
    });

    // Notify user typing
    socket.on(socketConfig.TYPING, (data) => {
      socket.broadcast.in(groupName).emit(socketConfig.NOTIFY_TYPING, {user: data.user, message: socketConfig.TYPING_MESSAGE, senderId: data.senderId, type: data.type, senderName: data.senderName});
      socketController.notifyTypingAllGroup(groupName, socket, data, socketUsers, socketConfig.NOTIFY_TYPING_GLOBAL);
    });

    // Notify user stop typing
    socket.on(socketConfig.STOP_TYPING, (data) => {
      socket.broadcast.in(groupName).emit(socketConfig.NOTIFY_STOP_TYPING);
      socketController.notifyTypingAllGroup(groupName, socket, data, socketUsers, socketConfig.NOTIFY_STOP_TYPING_GLOBAL);
    });

    // Socket disconnect emit
    socket.on(socketConfig.DISCONNECT, async function() {
      await socketController.disconnect(socket, socketUsers);
      // delete socketUsers[socket.handshake.query.senderId];
    });
  });
};
