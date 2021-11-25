const joi = require('joi');

/**
 * Update AuthToken Using Code
 * This function is used to AuthToken.
 * @param {Object} data  The data is create device token required data.
 * @return {error} error Return Response.
 */
exports.check = joi.object({
  code: joi.string().required(),
});
