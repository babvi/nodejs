/**
 * Socket Group Logs
 * This function used to print logs for group
 * @param {Object} socket  The socket.
 * @param {String} groupName  The group name.
 */
exports.groupLogs = function(socket, groupName) {
  const key = 'User Connected For Group - '+groupName;
  const log = {};
  log[key] = socket.handshake.query.senderId;
  console.table(log);
};

/**
 * Socket Message Log.
 * This function used to print message who sending.
 * @param {String} groupName  The group name.
 * @param {String} senderId   The senderId.
 * @param {String} msg     The user sending Message.
 */
exports.messageLog = function(groupName, senderId, msg) {
  const log = {};
  log.subject = 'Message';
  log.GroupName = groupName;
  log.SenderId = senderId;
  log.message = msg;
  console.table(log);
};

/**
 * Socket FileUpload Log.
 * This function used to print file upload url.
 * @param {String} groupName  The group name.
 * @param {String} senderId   The senderId.
 * @param {String} filename     The filename
 */
exports.fileUploadLog = function(groupName, senderId, filename) {
  const log = {};
  log.subject = 'File Upload',
  log.GroupName = groupName;
  log.SenderId = senderId;
  log.filename = filename;
  console.table(log);
};

/**
 * Socket Online Users Log.
 * This function used to print Online Users.
 * @param {String} groupName  The group name.
 * @param {String} senderId   The senderId.
 */
exports.onlineUsersLog = function(groupName, senderId) {
  const log = {};
  log.subject = 'Online Users',
  log.GroupName = groupName;
  log.SenderId = senderId;
  console.table(log);
};

/**
 * Socket Disconnected User.
 * This function used to print Disconnected user with groupname.
 * @param {String} groupName  The group name.
 * @param {String} user   The user.
 */
exports.disconnectLog = function(groupName, user) {
  const log = {};
  log.subject = 'User Disconnected',
  log.groupName = groupName;
  log.user = user;
  console.table(log);
};

