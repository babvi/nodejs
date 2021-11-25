const Groups = require('../models/Groups');
const Chats = require('../models/Chat');
const moment = require('moment');
const message = require('../config/message');
const {getUser} = require('./chatController');
const response = require('../modules/service/response');
const User = require('../models/Users');
RegExp.escape = function(s) {
  return s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

exports.groupList = async function(req, res, next) {
  try {
    if (!req.body.userId) {
      return res.json(response.failure(204, message.serverResponseMessage.Group_Review_List_PassingData));
    }
    let perPage = 10;
    const page = Math.max(0, req.body.page);
    if (req.body.perPage) {
      perPage = req.body.perPage;
    }
    const pagination = {skip: perPage * page, limit: perPage};
    const whereArr = {type: req.body.type,
      $and: [
        {$or: [{groupMembers: {$in: [req.body.userId]}}, {['removedUsers.'+req.body.userId]: {$exists: true}}]},
      ]};
    if (req.body.groupName) {
      whereArr['groupName'] = {$regex: new RegExp(RegExp.escape(req.body.groupName), 'i')};
    }
    whereArr['isArchive']= false;
    if (req.body.companyResellerId) {
      whereArr['companyResellerId'] = {$in: [req.body.companyResellerId, null]};
    }
    const userDetails  = await User.findOne({userId: req.body.userId});
    userDetails.userType == 'vendor' ?  whereArr['isPublished'] = true : null; 
    const groupIds = await Groups.find({groupMembers: {$in: [req.body.userId]}}).distinct('groupName');
    const whereArrChat = {groupName: {$in: groupIds}, readUserIds: {$nin: [req.body.userId]}, senderId: {$nin: [req.body.userId]}, sendTo: {$in: [req.body.userId]}};
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
          'message': 1,
          'groupId': 1,
          'createdAt': 1,
        },
      },
      {
        '$group': {
          '_id': '$groupName',
          'message': {'$first': '$message'},
          'count': {'$sum': 1},
        },
      },
    ]);
    const arrData = {};
    const result = dbResult.reduce((out, item) => {
      arrData[item._id] = {count: item.count, message: item.message};
      return arrData;
    }, {});
    const sortKey = {['pinBy.'+req.body.userId]: -1, updatedAt: -1};
    Groups.countDocuments(whereArr, async function(err, count) {
      Groups.find(whereArr, {}, pagination).sort(sortKey).then(async (groups) => {
        const results = [];
        const usersObj = await getUser(groups);
        for (let i = 0; i < groups.length; i++) {
          let userlistdata = {};
          for (const groupMem of groups[i].groupMembers) {
            if (usersObj[groupMem]) {
              userlistdata[groupMem] = usersObj[groupMem];
            }
          }
          if (req.body.skipobject && req.body.skipobject == true) {
            userlistdata = Object.values(userlistdata);
          }
          let unreadCunt=0;
          let msg = '';
          const removeduser = Object.keys(JSON.parse(JSON.stringify(groups[i].removedUsers)));
          if (result[groups[i].groupName]) {
            unreadCunt = result[groups[i].groupName].count;
            if (!removeduser.includes(req.body.userId)) {
              msg = result[groups[i].groupName].message;
            }
          } else {
            if (!removeduser.includes(req.body.userId)) {
              const chat = await Chats.findOne({groupName: groups[i].groupName}).sort({'createdAt': -1});
              msg = chat?chat.message:'';
            }
          }
          const element = {
            'id': groups[i]._id,
            'unread': unreadCunt,
            'groupMembers': groups[i].groupMembers,
            'type': groups[i].type,
            'updatedAt': groups[i].updatedAt,
            'groupName': groups[i].groupName,
            'senderId': groups[i].senderId,
            'stage': groups[i].stage,
            'message': msg,
            'users': userlistdata,
            'dealId': groups[i].dealId,
            'isPinGroup': groups[i].pinBy ? groups[i].pinBy.get(req.body.userId.toString()) ? true : false : false,
            'status': groups[i].status,
            'adminMembers': groups[i].adminMembers,
          };
          results.push(element);
        }
        const responseObj = {};
        responseObj['data'] = results;
        responseObj['totalpage'] = Math.ceil(count/perPage);
        responseObj['perpage'] = perPage;
        responseObj['total'] = count;
        return res.json(response.success(200, message.serverResponseMessage.Group_list, responseObj));
      });
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

exports.chatList = async function(req, res, next) {
  try {
    const uniqueId = req.query.uniqueId;
    const userId = req.query.userId;
    const page = Math.max(0, req.query.page);
    let perPage = 20;
    if (req.query.perPage) perPage = parseInt(req.query.perPage);
    const whereArr = {groupName: uniqueId};
    whereArr['sendTo']= {$in: [userId]};
    Chats.countDocuments(whereArr, function(err, count) {
      Chats.find(whereArr, {}, {skip: perPage * page, limit: perPage})
          .sort({
            createdAt: -1,
          }).then((chat) => {
            let results = {};
            if (!req.query.keepdate) {
              for (let i = (chat.length-1); i >= 0; i--) {
                const dateKey = moment(chat[i].createdAt).format('MMMM DD YYYY');
                if (!results[dateKey]) {
                  results[dateKey] = [];
                }
                results[dateKey].push(chat[i]);
              }
            } else {
              results = chat;
            }
            const responseObj = {};
            responseObj['data'] = results;
            responseObj['totalpage'] = Math.ceil(count/perPage);
            responseObj['perpage'] = perPage;
            responseObj['total'] = count;
            return res.json(response.success(200, message.serverResponseMessage.Group_chat_list, responseObj));
          });
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

exports.userList = async function(req, res, next) {
  try {
    if (!req.body.userId) {
      return res.json(response.failure(204, message.serverResponseMessage.Group_Review_List_PassingData));
    }
    let perPage = 10;
    const page = Math.max(0, req.body.page);
    if (req.body.perPage) perPage = req.body.perPage;
    const pagination = {skip: perPage * page, limit: perPage};
    const whereArr = {type: 'onetoone', groupMembers: {$in: [req.body.userId]}};
    const userSearchWhere = {groupMembers: {$in: [req.body.userId]}};
    const groupIdsUser = [];
    if (req.body.companyResellerId) whereArr['companyResellerId'] = {$in: [req.body.companyResellerId, null]};
    if (req.body.userName) {
      const userObj = await User.find({userId: {$nin: [req.body.userId]}, userName: {$regex: new RegExp(RegExp.escape(req.body.userName), 'i')}});
      for (const key in userObj) {
        if (Object.prototype.hasOwnProperty.call(userObj, key)) {
          const groupFind = await Groups.find({$and: [{groupMembers: {$all: [req.body.userId, userObj[key].userId]}}, {type: 'onetoone'}]});
          if (groupFind) {
            groupFind.map((u) => {
              groupIdsUser.push(u.groupName);
            });
          }
        }
      }
      userSearchWhere['groupName'] = {$in: groupIdsUser};
      whereArr['groupName'] = {$in: groupIdsUser};
    }
    const groupIds = await Groups.find(userSearchWhere).distinct('groupName');
    const whereArrChat = {groupName: {$in: groupIds}, readUserIds: {$nin: [req.body.userId]}, senderId: {$nin: [req.body.userId]}};
    const dbResult = await Chats.aggregate([
      {'$match': whereArrChat},
      {'$sort': {'updatedAt': -1}},
      {
        '$project': {
          'groupName': 1,
          'message': 1,
        },
      },
      {
        '$group': {
          '_id': '$groupName',
          'message': {'$first': '$message'},
          'count': {$sum: 1},
        },
      },
    ]);
    const arrData = {};
    const result = dbResult.reduce((out, item) => {
      arrData[item._id] = {count: item.count, message: item.message};
      return arrData;
    }, {});
    Groups.countDocuments(whereArr, async function(err, count) {
      const sortKey = {['pinBy.'+req.body.userId]: -1, updatedAt: -1};
      Groups.find(whereArr, {}, pagination).sort(sortKey).then(async (groups) => {
        const results = [];
        const user = await getUser(groups);
        for (let i = 0; i < groups.length; i++) {
          const userlistdata = {};
          for (const groupMem of groups[i].groupMembers) {
            if (user[groupMem]) {
              userlistdata[groupMem] = user[groupMem];
            }
          }
          let unreadCunt=0;
          let msg = '';
          if (result[groups[i].groupName]) {
            unreadCunt = result[groups[i].groupName].count;
            msg = result[groups[i].groupName].message;
          } else {
            const chat = await Chats.findOne({groupName: groups[i].groupName}).sort({'createdAt': -1});
            msg = chat?chat.message:'';
          }
          const array = JSON.parse(JSON.stringify(groups[i].groupMembers));
          const index = array.indexOf(req.body.userId);
          if (index > -1) array.splice(index, 1);
          const oppUser = user[array[0]] || {};
          const element = {
            'unread': unreadCunt,
            'groupMembers': groups[i].groupMembers,
            'type': groups[i].type,
            'groupId': groups[i]._id,
            'groupName': groups[i].groupName,
            'senderId': groups[i].senderId,
            'stage': groups[i].stage,
            'message': msg,
            'userName': oppUser.userName || '-',
            'userId': array[0],
            'users': userlistdata,
            'isPinGroup': groups[i].pinBy ? groups[i].pinBy.get(req.body.userId.toString()) ? true : false : false,
            'userType': user[req.body.userId].userType || '---',
            'companyResellerId': user[req.body.userId].companyResellerId || '---',
            'oppositeuserUserType': oppUser.userType || '---',
            'profileImage': oppUser.profileImage || '-',
            'language': user[req.body.userId].language ? user[req.body.userId].language : '--',
            'country': user[req.body.userId].country ? user[req.body.userId].country : '--',
            'designation': user[req.body.userId].designation ? user[req.body.userId].designation : '--',
            'updatedAt': groups[i].updatedAt,
          };
          results.push(element);
        }
        const responseObj = {};
        responseObj['data'] = results;
        responseObj['totalpage'] = Math.ceil(count/perPage);
        responseObj['perpage'] = perPage;
        responseObj['total'] = count;
        return res.json(response.success(200, message.serverResponseMessage.Group_list, responseObj));
      });
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};
