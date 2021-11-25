const joi = require('joi');

/**
 * Group Review Create Validate.
 * This function is used to Group Review Create Validation.
 * @param {Object} data  The data is group review create required data.
 * @return {error} error Return Response.
 */
exports.create = joi.object({
  groupId: joi.string().required(),
  userId: joi.number().required(),
  comment: joi.string().required(),
  rating: joi.number().required(),
});

/**
 * Group Review Edit Validate.
 * This function is used to Group Review Edit Validation.
 * @param {Object} data  The data is group review edit required data.
 * @return {error} error Return Response.
 */
exports.update = joi.object({
  id: joi.string().required(),
  comment: joi.string().optional(),
  rating: joi.number().optional(),
});
/**
 * Group Review Delete Validate.
 * This function is used to Group Review Delete Validation.
 * @param {Object} data  The data is group review delete required data.
 * @return {error} error Return Response.
 */
exports.delete = joi.object({
  id: joi.string().required(),
});

/**
 * Group ReviewList Validate.
 * This function is used to Group ReviewList Validation.
 * @param {Object} data  The data is group reviewList required data.
 * @return {error} error Return Response.
 */
exports.list = joi.object({
  groupId: joi.string().required(),
  userId: joi.number().required(),
});
