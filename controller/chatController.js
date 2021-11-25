const Groups = require('../models/Groups');
const Chats = require('../models/Chat');
const message = require('../config/message');
const response = require('../modules/service/response');
const User = require('../models/Users');
/**
 * Get User
 * This function is used to Get user.
 * @param {Array} groups
 * @return {Object} json Return Response.
 */
exports.getUser = async (groups) =>{
  try {
    let temp = [];
    for (let i = 0; i < groups.length; i++) {
      temp = temp.concat(groups[i].groupMembers);
    }
    const user =await User.find({userId: {$in: temp}}).select({userId: 1, profileImage: 1, userName: 1, _id: 0, designation: 1, language: 1, country: 1, deviceToken: 1, deviceType: 1, userType: 1, companyResellerId: 1});
    const obj = {};
    user.map((u) => {
      obj[u.userId] = u;
    });
    return obj;
  } catch (error) {
    console.log('error', error);
    return error;
  }
};

exports.unreadCountList = async function(req, res, next) {
  try {
    if (!req.body.userId) {
      return res.json(response.failure(204, message.serverResponseMessage.Group_Review_List_PassingData));
    }
    const groupIds = await Groups.find({groupMembers: {$in: [req.body.userId]}, isArchive: false}).distinct('groupName');
    const whereArrChat = {groupName: {$in: groupIds}, readUserIds: {$nin: [req.body.userId]}, senderId: {$nin: [req.body.userId]}, sendTo: {$in: [req.body.userId]}};
    //  ------- Old Total Count COde for Individual Group---------
    // const dbResult = await Chats.aggregate([
    //   {
    //     '$match': whereArrChat,
    //   },
    //   {
    //     '$sort': {'updatedAt': -1},
    //   },
    //   {
    //     '$project': {
    //       'groupName': 1,
    //       'groupId': 1,
    //       'createdAt': 1,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'groups',
    //       localField: 'groupId',
    //       foreignField: '_id',
    //       as: 'groupData',
    //     },
    //   }, {
    //     $unwind: {
    //       path: '$groupData',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     '$group': {
    //       '_id': '$groupName',
    //       'dealId': {'$first': '$groupData.dealId'},
    //     },
    //   },
    // ]);

    const dbResult = await Chats.aggregate([
      {
        '$match': whereArrChat,
      },
      {
        '$sort': {'updatedAt': -1},
      },
      {
        '$project': {
          'groupName': 1,
          'groupId': 1,
          'createdAt': 1,
        },
      },
      {
        $addFields: {'userId': req.body.userId},
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'groupData',
        },
      }, {
        $unwind: {
          path: '$groupData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        '$group': {
          '_id': '$userId',
          'count': {$sum: 1},
        },
      },
    ]);
    const responseObj = {};
    // responseObj['data'] = dbResult;
    if (dbResult.length) responseObj['data'] = dbResult;
    else {
      const userObj= [{'_id': req.body.userId, 'count': 0}];
      responseObj['data'] = userObj;
    }
    return res.json(response.success(200, message.serverResponseMessage.Group_unread_count, responseObj));
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

