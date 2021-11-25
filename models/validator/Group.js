const joi = require('joi');

/**
 * Group Creation Validate.
 * This function is used to Group Create Validation.
 * @param {Object} data   The data is group creation required data.
 * @return {error} error Return Response.
 */
exports.create = joi.object({
  groupName: joi.string().required(),
  groupMembers: joi.array().items(joi.string()).required(),
  senderId: joi.number().required(),
  type: joi.string().required(),
  deviceToken: joi.array().items(joi.string().min(1)),
  dealId: joi.string().optional(),
  companyResellerId: joi.string().optional(),
  adminMembers: joi.array().items(joi.string()).optional(),
  vendorMembers: joi.array().items(joi.string()).optional(),
});

/**
 * Adding Group Members Validate.
 * This function is used to validate Adding Group Members.
 * @param {Object} data   The data is Group Add Members required data.
 * @return {error} error Return Response.
 */
exports.membersAdd = joi.object({
  groupId: joi.string().required(),
  memberId: joi.string().required(),
  loggedInUserId: joi.string().required(),
  deviceToken: joi.array().required(),
  isAdmin: joi.boolean().optional(),
});

/**
 * Removing Group Members Validate.
 * This function is used to validate Removing Group Members.
 * @param {Object} data   The data is Group remove Members required data.
 * @return {error} error Return Response.
 */
exports.membersRemove = joi.object({
  groupId: joi.string().required(),
  memberId: joi.string().required(),
  loggedInUserId: joi.string().required(),
  deviceToken: joi.array().required(),
});

/**
 * Group stage Validate.
 * This function is used to validate Group Stage.
 * @param {Object} data   The data is Group stage required data.
 * @return {error} error Return Response.
 */
exports.groupStage = joi.object({
  groupId: joi.string().required(),
  stage: joi.string().required().valid('initiated', 'quotations', 'waiting-for-approval', 'quotations-received', 'confirmed-po',
      'Qualified', 'Presentation/Demo', 'POC', 'Quote', 'Negotiation', 'Won', 'Lost', 'Deferred/Inactive'),
});

/**
 * Group stage Validate.
 * This function is used to validate Group Stage.
 * @param {Object} data   The data is Group stage required data.
 * @return {error} error Return Response.
 */
exports.update = joi.object({
  groupId: joi.string().required(),
  type: joi.string().optional(),
  stage: joi.string().optional().valid('initiated', 'quotations', 'waiting-for-approval', 'quotations-received', 'confirmed-po',
      'Qualified', 'Presentation/Demo', 'POC', 'Quote', 'Negotiation', 'Won', 'Lost', 'Deferred/Inactive'),
  groupName: joi.string().optional(),
  status: joi.string().optional(),
  dealId: joi.string().optional(),
  adminMembers: joi.array().optional(),
  vendorMembers: joi.array().optional(),
  loggedInUserId: joi.string().required(),
  isPublished: joi.boolean().optional(),
});

/**
 * Group Details Validate.
 * This function is used to validate Group Stage.
 * @param {Object} data   The data is Group stage required data.
 * @return {error} error Return Response.
 */
exports.details = joi.object({
  id: joi.string().required(),
});

/**
 * Pin group
 * This function is used Pin a Group.
 * @param {Object} data   The data is Group Add Members required data.
 * @return {error} error Return Response.
 */
exports.pinAdd = joi.object({
  groupId: joi.string().required(),
  userId: joi.string().required(),
});

/**
 * Unpin group
 * This function is used Unpin a Group.
 * @param {Object} data   The data is Group Add Members required data.
 * @return {error} error Return Response.
 */
exports.pinRemove = joi.object({
  groupId: joi.string().required(),
  userId: joi.string().required(),
});

/**
 * Group Archive Update
 * This function is used Unpin a Group.
 * @param {Object} data   The data is Group Add Members required data.
 * @return {error} error Return Response.
 */
exports.archiveDeal = joi.object({
  groupId: joi.string().required(),
  isArchive: joi.boolean().required(),
});
