const deviceToken = require('../models/UserDevice');
const message = require('../config/message');
const Group = require('../models/Groups');
const Notification = require('../modules/service/notification');
const response = require('../modules/service/response');

/**
 * Create Device Token
 * This function is used to Create Device Token.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The userId.
 * @param {String} req.body.deviceToken  The device token will be generator uniqe for each device.
 * @param {String} req.body.deviceType  The device type is user browsing device.
 * @return {Object} json Return Response.
 */
exports.createDeviceToken = async function(req, res) {
  try {
    deviceToken.findOne({userId: req.body.userId, deviceToken: req.body.deviceToken, deviceType: req.body.deviceType}, (err, deviceTokenCheckingRes)=>{
      if (!deviceTokenCheckingRes) {
        deviceToken.create(req.body, (error, deviceTokenAddResponse) => {
          return res.json(response.success(200, message.serverResponseMessage.Device_Token_Generated, deviceTokenAddResponse));
        });
      } else return res.json(response.failure(204, message.serverResponseMessage.Device_Token_Existed));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * Update Device Token
 * This function is used to Update Device Token.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The userId.
 * @param {String} req.body.deviceToken  The deviceToken is updated device token.
 * @param {String} req.body.deviceType  The device type is updated user browsing device type.
 * @return {Object} json Return Response.
 */
exports.updateDeviceToken = async function(req, res) {
  try {
    deviceToken.findOneAndUpdate({userId: req.body.userId, deviceType: req.body.deviceType}, {$set: {deviceToken: req.body.deviceToken}}, {new: true}, (error, deviceTokenUpdatedRes) => {
      if (deviceTokenUpdatedRes) {
        return res.json(response.success(200, message.serverResponseMessage.Device_Token_Updated, deviceTokenUpdatedRes));
      } else return res.json(response.failure(204, message.serverResponseMessage.Device_Token_PassedData));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};
/**
 * Add Device Token
 * This function is used to Add Device Token to all fcm topic by user token.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The userId.
 * @param {String} req.body.deviceToken  The Device Token.
 */
exports.addDeviceTokenByTopic = async function(req, res) {
  try {
    if (req.body.userId && req.body.deviceToken) {
      const group = await Group.find({'groupMembers': {$in: [req.body.userId]}});
      group.forEach(async (element) => {
        await Notification.subscribeToTopic(req.body.deviceToken, element._id);
      });
      return res.json(response.success(200, message.serverResponseMessage.Device_Token_Added_Sucess_ResponseMessage));
    } else return res.json(response.failure(204, message.serverResponseMessage.Device_Token_SendingData_ErrorMessage));
  } catch (error) {
    return error;
  }
};
/**
 * Remove Device Token
 * This function is used to Remove Device Token from all fcm topic.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The userId.
 * @param {String} req.body.deviceToken  The Device Token.
 */
exports.removeDeviceTokenByTopic = async function(req, res) {
  try {
    if (req.body.userId && req.body.deviceToken) {
      const group = await Group.find({'groupMembers': {$in: [req.body.userId]}});
      group.forEach(async (element) => {
        await Notification.unsubscribeToTopic(req.body.deviceToken, element._id);
      });
      return res.json(response.success(200, message.serverResponseMessage.Device_Token_Removed_Sucess_ResponseMessage));
    } else return res.json(response.failure(204, message.serverResponseMessage.Device_Token_SendingData_ErrorMessage));
  } catch (error) {
    return error;
  }
};
