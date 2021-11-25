const groupCreate = require('../models/Groups');
const message = require('../config/message');
const Broadcast = require('../modules/service/broadcast');
const Notification = require('../modules/service/notification');
const moment = require('moment');
const response = require('../modules/service/response');
const socketConfig = require('../config/socket');
const User = require('../models/Users');
const {pinAllowed}= require('../config/index');
const Chats = require('../models/Chat');
const socket = require('../config/socket');
/**
 * Group Create
 * This function is used to Group Create.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupName  The Group Name is Unique.
 * @param {Array} req.body.groupMembers  The Group Members is adding members into Group at the time of GROUP Creation.
 * @param {String} req.body.senderId  The senderId.
 * @param {String} req.body.userType  The User Type
 * @param {Number} req.body.companyResellerId the User Company Reseller Id
 * @return {Object} json Return Response.
 */
exports.groupCreation = async function(req, res) {
  try {
    groupCreate.findOne({dealId: req.body.dealId}, (err, groupRes)=>{
      if (groupRes && req.body.type != 'custom' ) return res.json(response.failure(204, message.serverResponseMessage.Group_Creation_DEAL_ErrorMessage));
      if (!groupRes || req.body.type == 'custom') {
        req.body.IPAddress = req.connection.remoteAddress;
        const deviceToken = req.body.deviceToken;
        delete req.body.deviceToken;
        if (req.body.adminMembers) {
          for (const member of req.body.adminMembers) {
            if (!req.body.groupMembers.includes(member)) {
              return res.json(response.failure(204, message.serverResponseMessage.Group_Creation_AdminMember));
            }
          }
        }
        groupCreate.create(req.body, (error, grpCreateRes)=>{
          for (const members of req.body.groupMembers) {
            grpCreateRes.addedUsers.set(members.toString(), [moment.utc(new Date())]);
          }
          grpCreateRes.save();
          if (grpCreateRes.type == 'quote' || grpCreateRes.type == 'custom') {
            global.globalSocket.emit(socketConfig.NEW_GROUP_CREATE, grpCreateRes);
          }
          Notification.subscribeToTopic(deviceToken, grpCreateRes._id);
          // Broadcast.autoMessageBroadcastToMembers(grpCreateRes._id, 'DEALGENERATE', req.body.senderId);
          if (grpCreateRes) return res.json(response.success(200, message.serverResponseMessage.Group_Creation_Sucess_ResponseMessage, grpCreateRes));
        });
      }
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};


/**
 * Group Members Adding
 * This function is used to Group Members Adding.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {Array} req.body.memberId  The memberId into Group.
 * @param {String} req.body.loggedInUserId  The loggedInUserId.
 * @return {Object} json Return Response.
 */
exports.addingGroupMembers = async function(req, res) {
  try {
    const loggedInUserId = await User.findOne({userId: req.body.loggedInUserId}, 'userType');
    const addMemberId = await User.findOne({userId: req.body.memberId}, 'userType');
    if (loggedInUserId.userType=='reseller' && addMemberId.userType=='vendor') {
      return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Vendor_Member));
    }
    groupCreate.findById(req.body.groupId, (err, grpRes)=>{
      if (grpRes) {
        if (grpRes.type== 'quote' || grpRes.type=='custom') {
          groupCreate.findOneAndUpdate({$and: [{_id: grpRes._id}, {groupMembers: {$nin: [req.body.memberId]}}]}, {$push: {groupMembers: req.body.memberId}}, {new: true}, async function(error, AddNewMembersIntoGrp) {
            if (AddNewMembersIntoGrp && AddNewMembersIntoGrp.groupMembers.length > grpRes.groupMembers.length) {
              AddNewMembersIntoGrp.removedUsers.set(req.body.memberId.toString(), undefined, {strict: false});
              const values = Object.keys(JSON.parse(JSON.stringify(AddNewMembersIntoGrp.addedUsers)));
              if (!values.includes(req.body.memberId)) {
                AddNewMembersIntoGrp.addedUsers.set(req.body.memberId.toString(), [moment.utc(new Date())]);
              }
              if (req.body.isAdmin) {
                // check admin member is vendor or not
                const userData = await User.findOne({userId: req.body.memberId});
                if (userData && userData.userType !='vendor' ) {
                  const isAdminMember = AddNewMembersIntoGrp.adminMembers.indexOf(req.body.memberId);
                  if (isAdminMember == -1) {
                    await AddNewMembersIntoGrp.adminMembers.push(req.body.memberId);
                  }
                }
              }
              AddNewMembersIntoGrp.save();
              Notification.subscribeToTopic(req.body.deviceToken, req.body.groupId);
              Broadcast.autoMessageBroadcastToMembers(grpRes._id, 'USER_CREATE', req.body.loggedInUserId, req.body.memberId);
              global.globalSocket.emit(socketConfig.ADDED_USER, AddNewMembersIntoGrp);
              return res.json(response.success(200, message.serverResponseMessage.Group_Adding_Members_Added, AddNewMembersIntoGrp));
            } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_SelectedMembers));
          });
        } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_Type));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_Groupid));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * Group Members Removing
 * This function is used to Group Members Removing.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {Array} req.body.memberId  The memberId from Group.
 * @param {String} req.body.loggedInUserId  The loggedInUserId.
 * @return {Object} json Return Response.   moment.utc(
 */
exports.removeGroupMembers = async function(req, res) {
  try {
    const loggedInUserId = await User.findOne({userId: req.body.loggedInUserId}, 'userType');
    const addMemberId = await User.findOne({userId: req.body.memberId}, 'userType');
    if (loggedInUserId.userType=='reseller' && addMemberId.userType=='vendor') {
      return res.json(response.failure(204, message.serverResponseMessage.Group_Removed_Vendor_Member));
    }
    groupCreate.findById(req.body.groupId, (err, grpRes)=>{
      if (grpRes) {
        groupCreate.findOneAndUpdate({$and: [{_id: grpRes._id}, {groupMembers: {$in: [req.body.memberId]}}]}, {$pull: {groupMembers: req.body.memberId}}, {new: true}, function(error, RemMembersFromGrp) {
          if (RemMembersFromGrp && grpRes.groupMembers.length > RemMembersFromGrp.groupMembers.length) {
            User.findOne({userId: req.body.memberId}, function(err, user) {
              RemMembersFromGrp.updatedAt = moment.utc(new Date());
              // RemMembersFromGrp.addedUsers.set(req.body.memberId.toString(), undefined, {strict: false});
              RemMembersFromGrp.removedUsers.set(req.body.memberId.toString(), [new Date(), user.userName, user.profileImage]);
              RemMembersFromGrp.save();
              Notification.unsubscribeToTopic(req.body.deviceToken, req.body.groupId);
              Broadcast.autoMessageBroadcastToMembers(grpRes._id, 'USER_REMOVE', req.body.loggedInUserId, req.body.memberId);
              global.globalSocket.emit(socketConfig.REMOVED_USER, RemMembersFromGrp);
              return res.json(response.success(200, message.serverResponseMessage.Group_Removed_Members_Removed, RemMembersFromGrp));
            });
          } else return res.json(response.failure(204, message.serverResponseMessage.Group_Removed_Members_SelectedMembers));
        });
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Removed_Members_Groupid));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * GroupStage
 * This function is used to update Group Stage.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {String} req.body.stage  The stage is updating GroupStage.
 * @return {Object} json Return Response.
 */
exports.groupstages = async function(req, res) {
  try {
    groupCreate.findById(req.body.groupId, (err, grpRes) => {
      if (grpRes) {
        if (grpRes.stage != 'confirmed-po') {
          groupCreate.findOneAndUpdate({_id: grpRes._id}, {$set: {stage: req.body.stage}}, {new: true}, function(error, groupstageUpdatedResponse) {
            if (groupstageUpdatedResponse) return res.json(response.success(200, message.serverResponseMessage.Group_Stage_Updated, groupstageUpdatedResponse));
          });
        } else return res.json(response.failure(204, message.serverResponseMessage.Group_Stage_Updated_Already));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Stage_Groupid));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * Group Update
 * This function is used to update Group.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {String} req.body.type  The type is either onetoone or quote.
 * @param {String} req.body.stage  The stage is updating GroupStage.
 * @param {String} req.body.groupName  The Group Name is Unique
 * @param {string} req.body.status The Status is Either Open or Close.
 * @return {Object} json Return Response.
 */
exports.groupUpdate = async function(req, res) {
  try {
    groupCreate.findById(req.body.groupId, async (err, GroupFindRes)=>{
      if (GroupFindRes) {
        if (req.body.adminMembers) {
          for (const member of req.body.adminMembers) {
            if (!GroupFindRes.groupMembers.includes(member)) {
              return res.json(response.failure(204, message.serverResponseMessage.Group_Update_AdminMember));
            }
          }
          if (GroupFindRes.adminMembers.length > 0) {
            req.body.adminMembers.push(...GroupFindRes.adminMembers);
            req.body.adminMembers = [...new Set(req.body.adminMembers)];
          }
        }
        const removeMembers = [];
        if (req.body.vendorMembers) {
          const vendorData = await User.find({userId: {$in: GroupFindRes.groupMembers}, userType: 'vendor'});
          const newMembers = [];
          vendorData.forEach( (element)=>{
            req.body.vendorMembers.includes(element.userId) ? newMembers.push(element.userId) : removeMembers.push(element.userId);
          });

          removeMembers.forEach((element)=> {
            const removeVendorData= vendorData.find((vendor) => vendor.userId === element);
            GroupFindRes.removedUsers.set(element.toString(), [new Date(), removeVendorData.userName, removeVendorData.profileImage]);
            GroupFindRes.save();
          });
        }
        const updatedData = {
          ...req.body,
          $pullAll: {groupMembers: removeMembers},
        };
        if (removeMembers.length >0) {
          removeMembers.forEach((element)=> {
            Broadcast.autoMessageBroadcastToMembers(GroupFindRes._id, 'USER_REMOVE', req.body.loggedInUserId, element);
            global.globalSocket.emit(socketConfig.REMOVED_USER, GroupFindRes);
          });
        }
        groupCreate.findOneAndUpdate({_id: GroupFindRes._id}, updatedData, {new: true}, async function(err, GroupUpdateRes) {
          if (GroupFindRes.groupName != req.body.groupName) {
            await Chats.updateMany({groupId: GroupFindRes._id}, {groupName: req.body.groupName});
            GroupUpdateRes._doc.oldGruopName=GroupFindRes.groupName;
            await global.globalSocket.emit(socket.UPDATE_DEAL_NAME, GroupUpdateRes);
          }
          return res.json(response.success(200, message.serverResponseMessage.Group_Update_Updated, GroupUpdateRes));
        });
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Update_Groupid));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};


/**
 * Group Details
 * This function is used to fetch Group Details.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupid  The GroupId is unique.
 * @return {Object} json Return Response.
 */
exports.groupDetails = async function(req, res) {
  try {
    groupCreate.findById(req.params.id, async function(err, groupDetails) {
      if (!groupDetails) return res.json(response.failure(204, message.serverResponseMessage.Group_Details_Groupid));
      const groupDetail = JSON.parse(JSON.stringify(groupDetails));
      if (groupDetail) {
        groupDetail.users= {};
        const user = await User.find({userId: {$in: groupDetails.groupMembers}});
        user.forEach((element) => {
          groupDetail.users[element.userId]= element;
        });
        groupDetail['userDetails'] = user;
        return res.json(response.success(200, message.serverResponseMessage.Group_Details_Data, groupDetail));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Details_Groupid));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};
/**
 * Group Pin Add
 * This function is used Pin Group for user.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {String} req.body.userId  The userId is unique.
 * @return {Object} json Return Response.
 */
exports.addGroupIntoPin= async (req, res)=>{
  groupCreate.findById(req.body.groupId, async (err, finUserIdInGroup)=>{
    if (finUserIdInGroup) {
      const string = 'pinBy.'+req.body.userId.toString();
      const query={};
      query[string]={$exists: true};
      query['type']= finUserIdInGroup.type;
      const findTotalPinGroup = await groupCreate.countDocuments(query);
      if (findTotalPinGroup >= pinAllowed) return res.json(response.failure(204, message.serverResponseMessage.Group_Pin_Limit_reached));
      if (finUserIdInGroup.pinBy.get(req.body.userId.toString())) {
        return res.json(response.failure(204, message.serverResponseMessage.Group_Pin_Already_Added));
      } else {
        finUserIdInGroup.pinBy.set(req.body.userId.toString(), 'true', {strict: false});
        finUserIdInGroup.save({timestamps: false});
        return res.json(response.success(200, message.serverResponseMessage.Group_Pin_Added, {}));
      }
    } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_Groupid));
  });
};

/**
 * Group Pin remove
 * This function is used Unpin Group for user.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {String} req.body.userId  The userId is unique.
 * @return {Object} json Return Response.
 */
exports.removeGroupFromPin= async (req, res)=>{
  groupCreate.findById(req.body.groupId, async (err, finUserIdInGroup)=>{
    if (finUserIdInGroup) {
      if (!finUserIdInGroup.pinBy.get(req.body.userId.toString())) {
        return res.json(response.failure(204, message.serverResponseMessage.Group_Pin_Already_Remove));
      } else {
        finUserIdInGroup.pinBy.set(req.body.userId.toString(), undefined, {strict: false});
        finUserIdInGroup.save({timestamps: false});
        return res.json(response.success(200, message.serverResponseMessage.Group_Pin_Remove, {}));
      }
    } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_Groupid));
  });
};

/**
 * Group Archive
 * This function is used Unpin Group for user.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The GroupId is unique.
 * @param {String} req.body.isArchive  The GroupId is unique.
 * @return {Object} json Return Response.
 */
exports.GroupArchiveUpdate= async (req, res)=>{
  groupCreate.findById(req.body.groupId, async (err, groupData)=>{
    if (groupData) {
      const updateArchiveData = await groupCreate.findOneAndUpdate({_id: groupData._id},
          {isArchive: req.body.isArchive}, {new: true, timestamps: false});
      updateArchiveData.isArchive ? global.globalSocket.emit(socketConfig.GROUP_ARCHIVE_UPDATE, updateArchiveData) : null;
      return res.json(response.success(200, message.serverResponseMessage.Group_Archive_Update, updateArchiveData));
    } else return res.json(response.failure(204, message.serverResponseMessage.Group_Adding_Members_Groupid));
  });
};
