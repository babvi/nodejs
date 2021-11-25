const joi = require('joi');

/**
 * Create Device Token Validate.
 * This function is used to Create Device Token Validation.
 * @param {Object} data  The data is create device token required data.
 * @return {error} error Return Response.
 */
exports.create = joi.object({
  userId: joi.number().required(),
  deviceToken: joi.array().required(),
  deviceType: joi.string().required(),
});

/**
 * Create Device Token Validate.
 * This function is used to Create Device Token Validation.
 * @param {Object} data  The data is create device token required data.
 * @return {error} error Return Response.
 */
exports.update = joi.object({
  userId: joi.number().required(),
  deviceToken: joi.array().required(),
  deviceType: joi.string().required(),
});

/**
 * Create Device Token Add To Topic.
 * This function is used to Create Device Token Validation.
 * @param {Object} data  The data is create device token required data.
 * @return {error} error Return Response.
 */
exports.topicAdd = joi.object({
  userId: joi.number().required(),
  deviceToken: joi.array().required(),
});

/**
 * Create Device Token Remove From Topic.
 * This function is used to Create Device Token Validation.
 * @param {Object} data  The data is create device token required data.
 * @return {error} error Return Response.
 */
exports.topicRemove = joi.object({
  userId: joi.number().required(),
  deviceToken: joi.array().required(),
});
