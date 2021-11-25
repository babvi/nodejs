const joi = require('joi');

/**
 * User Create Validate.
 * This function is used to User Create Validation.
 * @param {Object} data  The data is user create required data.
 * @return {error} error Return Response.
 */
exports.create = joi.object({
  userId: joi.number().required(),
  userName: joi.string().required(),
  profileImage: joi.string().required(),
  userType: joi.string().required(),
  companyResellerId: joi.string().optional().allow(''),
  country: joi.array().items(joi.string().min(1)),
  gender: joi.string().required(),
  language: joi.array().items(joi.string().min(1)),
  designation: joi.string().optional().allow(''),
  emailId: joi.string().email({tlds: {allow: false}}),
  deviceToken: joi.array().optional(),
  deviceType: joi.string().optional(),
  department: joi.string().required(),
});

/**
 * User Update Validate.
 * This function is used to User Update Validation.
 * @param {Object} data  The data is user update required data.
 * @return {error} error Return Response.
 */
exports.update = joi.object({
  userId: joi.number().required(),
  userName: joi.string().optional(),
  profileImage: joi.string().optional(),
  userType: joi.string().required(),
  companyResellerId: joi.string().optional().allow(''),
  country: joi.array().items(joi.string().min(1)),
  gender: joi.string().optional(),
  language: joi.array().items(joi.string().min(1)),
  designation: joi.string().optional().allow(''),
  emailId: joi.string().required(),
  deviceToken: joi.array().optional(),
  deviceType: joi.string().optional(),
  department: joi.string().required(),
  vendorCompanyId: joi.string().optional(),
});

/**
 * User Delete Validate.
 * This function is used to User Delete Validation.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.delete = joi.object({
  userId: joi.number().required(),
});

/**
 * User Delete Validate.
 * This function is used to User Delete Validation.
 * @param {Object} data  The data is user delete required data.
 * @return {error} error Return Response.
 */
exports.all = joi.object({
  search: joi.string().optional(),
  userId: joi.string().required(),
  searchType: joi.string().optional(),
  perPage: joi.number().optional(),
  page: joi.number().optional(),
  userName: joi.string().optional(),
  companyResellerId: joi.string().optional().allow(''),
  searchParameter: joi.string().optional().allow(''),
  filterParameter: joi.string().optional().allow(''),
  groupId: joi.string().optional(),
});
