const joi = require('joi');

/**
 * Chat List
 * This function is used to get messages list.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.chatList = joi.object({
  uniqueId: joi.string().required(),
  userId: joi.number().required(),
  perPage: joi.number().optional(),
  page: joi.number().optional(),
  keepdate: joi.boolean().optional(),
});

/**
 * Chat List
 * This function is used to chat list.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.groupList = joi.object({
  userId: joi.string().required(),
  type: joi.string().required(),
  groupName: joi.string().optional(),
  perPage: joi.number().optional(),
  page: joi.number().optional(),
  skipobject: joi.boolean().optional(),
  companyResellerId: joi.string().optional().allow(''),
});


/**
 * Users List
 * This function is used to list users.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.userList = joi.object({
  userId: joi.number().required(),
  userName: joi.string().optional(),
  perPage: joi.number().optional(),
  page: joi.number().optional(),
  companyResellerId: joi.string().optional().allow(''),
});

/**
 * file download
 * This function is used to download file.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.file = joi.object({
  id: joi.string().optional(),
  groupName: joi.string().optional(),
  fileName: joi.string().optional(),
});

/**
 * Brodcast
 * This function is used to brodcast message.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.brodcast = joi.object({
  groupId: joi.string().required(),
  memberId: joi.string().optional(),
  message: joi.string().required(),
  senderId: joi.string().required(),
  fileUrl: joi.string().optional(),
  fileName: joi.string().optional(),
});

/**
 * Send Message
 * This function is used to validate send message data.
 */
exports.sendMessage = joi.object({
  groupId: joi.string().required(),
  senderId: joi.number().required(),
  message: joi.string().required(),
  groupName: joi.string().required(),
});
/**
 * unreadCount
 * This function is used to get unreadCount of deals
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.unreadCount = joi.object({
  userId: joi.number().required(),
});

