const grpcontroller = require('../controller/groupController');
const chatListController = require('../controller/chatListController');
const grpReviewController = require('../controller/groupReviewController');
const DeviceTokenController = require('../controller/deviceTokenController');
const s3Bucket = require('../controller/fileController');
const userController = require('../controller/usersController');
const BroadCastController = require('../controller/broadCastController');
const authController = require('../controller/authController');
const chatController = require('../controller/chatController');
const middleware = require('../modules/service/middleware');
const groupValidation = require('../models/validator/Group');
const reviewValidation = require('../models/validator/GroupReview');
const tokenValidation = require('../models/validator/DeviceToken');
const userValidation = require('../models/validator/Users');
const messageValidation = require('../models/validator/Messages');
const webhookValidation = require('../models/validator/Webhook');

const webhookController = require('../controller/webhookController');
const {jwt} = require('../modules/service/auth');
module.exports = (app)=>{
  // Check health
  app.get('/health', (request, response) => {
    return response.json({message: 'Health is ok'});
  });

  // Groups
  app.post('/group/create', jwt, middleware(groupValidation.create), grpcontroller.groupCreation);
  app.put('/group/update', jwt, middleware(groupValidation.update), grpcontroller.groupUpdate);
  app.get('/group/details/:id', jwt, middleware(groupValidation.details), grpcontroller.groupDetails);
  app.put('/group/members/add', jwt, middleware(groupValidation.membersAdd), grpcontroller.addingGroupMembers);
  app.put('/group/members/remove', jwt, middleware(groupValidation.membersRemove), grpcontroller.removeGroupMembers);
  app.put('/group/pin/add', jwt, middleware(groupValidation.pinAdd), grpcontroller.addGroupIntoPin);
  app.put('/group/pin/remove', jwt, middleware(groupValidation.pinRemove), grpcontroller.removeGroupFromPin);
  app.post('/group/updateArchive', jwt, middleware(groupValidation.archiveDeal), grpcontroller.GroupArchiveUpdate);

  // Reviews
  app.post('/review/create', jwt, middleware(reviewValidation.create), grpReviewController.groupReviewCreate);
  app.post('/review/list', jwt, middleware(reviewValidation.list), grpReviewController.GroupReviewLists);
  app.put('/review/update', jwt, middleware(reviewValidation.update), grpReviewController.groupReviewEdit);
  app.delete('/review/delete', jwt, middleware(reviewValidation.delete), grpReviewController.groupReviewDelete);

  // Device token
  app.post('/device-token/create', jwt, middleware(tokenValidation.create), DeviceTokenController.createDeviceToken);
  app.put('/device-token/update', jwt, middleware(tokenValidation.update), DeviceTokenController.updateDeviceToken);
  app.post('/device-token/topic/add', jwt, middleware(tokenValidation.topicAdd), DeviceTokenController.addDeviceTokenByTopic);
  app.post('/device-token/topic/remove', jwt, middleware(tokenValidation.topicRemove), DeviceTokenController.removeDeviceTokenByTopic);

  // Users
  app.post('/user/create', jwt, middleware(userValidation.create), userController.userCreate);
  app.put('/user/update', jwt, middleware(userValidation.update), userController.userUpdate);
  app.delete('/user/delete', jwt, middleware(userValidation.delete), userController.userDelete);
  app.post('/user/all', jwt, middleware(userValidation.all), userController.usersList);
  app.post('/vendor/all', jwt, middleware(userValidation.all), userController.vendorUserList);

  // Messages
  app.get('/chat/list', jwt, middleware(messageValidation.chatList), chatListController.chatList);
  app.post('/chat/unreadCount', jwt, middleware(messageValidation.unreadCount), chatController.unreadCountList);
  app.post('/group/list', jwt, middleware(messageValidation.groupList), chatListController.groupList);
  app.post('/users/list', jwt, middleware(messageValidation.userList), chatListController.userList);
  app.post('/downloadfile', jwt, middleware(messageValidation.file), s3Bucket.fileDownload);
  app.post('/downloadWebfile', jwt, middleware(messageValidation.file), s3Bucket.webfileDownload);
  app.post('/broadcast/message', jwt, middleware(messageValidation.brodcast), BroadCastController.sendBroadCastMessage);

  // no authenticate apis
  app.post('/webhook', webhookController.webhook);
  app.post('/generateAuthUrl', authController.generateAuthUrl);
  app.get('/checkCode', middleware(webhookValidation.check), authController.generateAuthToken);
};

