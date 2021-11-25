/**
 * Sucess
 * This function is used to return Sucess message with status code.
 * @param {Number} code  The code is the status code which is return.
 * @param {String} message  The message is return message.
 * @param {Object} data  The data is returning object data.
 * @return {Object} json Return Response.
 */
exports.success = function(code, message, data) {
  const SucessResponse = {
    message: message,
    status: 'Success',
    code: code,
    data: data,
  };
  return SucessResponse;
};

/**
 * Failure
 * This function is used to return failure message with status code.
 * @param {Number} code  The code is the status code which is return.
 * @param {String} message  The message is return message.
 * @param {Object} data  The data is returning object data.
 * @return {Object} json Return Response.
 */
exports.failure = function(code, message, data) {
  const FailureResponse = {
    message: message,
    status: 'Failure',
    code: code,
    data: data,
  };
  return FailureResponse;
};


