const userCreate = require('../models/Users');
const Groups = require('../models/Groups');
const message = require('../config/message');
const response = require('../modules/service/response');
RegExp.escape = function(s) {
  return s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * User Create
 * This function used to create user
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The Unique UserId.
 * @param {String} req.body.userName  The User Name.
 * @param {String} req.body.profileImage  The User profile Image.
 * @param {Array} req.body.country  The User Country.
 * @param {Array} req.body.language  The User Language.
 * @param {String} req.body.gender  The User Gender.
 * @param {String} req.body.desigination  The User Desigination.
 * @param {String} req.body.userType  The User Type
 * @param {Number} req.body.companyResellerId the User Company Reseller Id
 * @param {String} req.body.department The User Department
 * @return {Object} json Return Response.
 */
exports.userCreate = async function(req, res) {
  try {
    const userChecking = await userCreate.find({userId: req.body.userId});
    if (userChecking.length < 1) {
      await userCreate.create(req.body, function(err, userCreateResponse) {
        return res.json(response.success(200, message.serverResponseMessage.User_Created, userCreateResponse));
      });
    } else return res.json(response.failure(204, message.serverResponseMessage.User_Creation_PassedData, userChecking));
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * User Update
 * This function used to Update User.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The Unique UserId.
 * @param {String} req.body.userName  The User Name.
 * @param {String} req.body.profileImage  The User profile Image.
 * @param {Array} req.body.country  The User Country.
 * @param {String} req.body.gender  The User Gender.
 * @param {Array} req.body.language  The User Language.
 * @param {String} req.body.designation  The User Language.
 * @param {String} req.body.userType  The User Type
 * @param {Number} req.body.companyResellerId the User Company Reseller Id
 * @param {String} req.body.department The User Department
 * @return {Object} json Return Response.
 */
exports.userUpdate = async function(req, res) {
  try {
    const userChecking = await userCreate.find({userId: req.body.userId});
    if (userChecking.length > 0) {
      userCreate.findOneAndUpdate({_id: userChecking[0]._id}, {$set: req.body}, {new: true}, function(err, userUpdateResponse) {
        return res.json(response.success(200, message.serverResponseMessage.User_Updated_Sucess, userUpdateResponse));
      });
    } else return res.json(response.failure(204, message.serverResponseMessage.User_Update_PassedData));
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * User Delete
 * This function used to Delete User.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.userId  The Unique UserId.
 * @return {Object}  json Return Response
 */
exports.userDelete = async function(req, res) {
  try {
    userCreate.findOneAndDelete({userId: req.body.userId}, function(err, userDeletedResponse) {
      if (userDeletedResponse) {
        return res.json(response.success(200, message.serverResponseMessage.User_Deleted_Sucess, userDeletedResponse));
      } else return res.json(response.failure(204, message.serverResponseMessage.User_Delete_PassedData));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * User List
 * This function used to get the users list.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @return {Object}  json Return Response.
 */
exports.usersList = async function(req, res) {
  try {
    let perPage = 10;
    const page = Math.max(0, req.body.page);
    if (req.body.perPage) {
      perPage = req.body.perPage;
    }
    const pagination = {skip: perPage * page, limit: perPage};
    const searchType = req.body.searchType ? req.body.searchType : false;
    const filterParameter = req.body.filterParameter ? req.body.filterParameter : false;
    const searchParameter = req.body.searchParameter ? req.body.searchParameter : false;
    const userName = req.body.userName ? req.body.userName : false;
    let whereArr={};
    const getUserType = await userCreate.findOne({userId: req.body.userId});
    const groupData = await Groups.findOne({_id: req.body.groupId});
    if (searchType=='deal') {
      whereArr = searchInDeal(filterParameter, searchParameter, userName, getUserType.userType, req.body.companyResellerId, groupData.isPublished ? groupData.vendorMembers : []);
    } else {
      whereArr = searchInGlobal(filterParameter, searchParameter, userName, getUserType.userType, req.body.companyResellerId);
    }
    userCreate.countDocuments(whereArr, async function(err, count) {
      const data = await userCreate.find(whereArr, {}, pagination).sort({updatedAt: -1});
      const responseObj = {};
      responseObj['data'] = data;
      responseObj['totalpage'] = Math.ceil(count/perPage);
      responseObj['perpage'] = perPage;
      responseObj['total'] = count;
      return res.json(response.success(200, message.serverResponseMessage.Group_list, responseObj));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};
/**
 * search in Global
 * This function used to get the users list.
 * @param {string} filterParameter   The filterParameter is data String coming from frontend.
 * @param {string} searchParameter   The searchParameter is data String coming from frontend.
 * @param {string} userName   The userName is data String coming from frontend.
 * @param {string} userType   The userType is data String coming from frontend.
 * @param {string} companyResellerId   The companyResellerIds is data String coming from frontend.
 * @return {Object} andArray json Return Response.
 */
function searchInGlobal(filterParameter, searchParameter, userName, userType, companyResellerId ) {
  const condition = {};
  const vendorCondition = {userType: {$ne: 'vendor'}};
  let andArray = {$and: [{ }]};
  userType=='vendor' ? null : condition['companyResellerId']= {$in: [companyResellerId]};
  if (filterParameter && searchParameter) {
    condition['userType']= filterParameter;
      userName != '' ? condition[searchParameter]= {$regex: new RegExp(RegExp.escape(userName), 'i')}:null;
      andArray= {$and: [condition]};
  } else if (filterParameter) {
    condition['userType']= filterParameter;
    condition['userName']=userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null;
      !userName ? delete condition['userName'] : condition['userName'];
      andArray= {$and: [condition]};
  } else if (searchParameter) {
    const andCondition = userType=='bv' ?
        [{[searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null}] :
        [{[searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null},
          {'companyResellerId': {$in: [companyResellerId]}}];
    andArray = {$or: [
      {$and:
          [{
            [searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null}
          ]},
      {
        $and: andCondition,
      }]};
  }
  if (userType=='vendor') {
    return {$and: [andArray]};
  } else {
    return {$and: [andArray, vendorCondition]};
  }
}
/**
 * search in deal
 * This function used to get the users list.
* @param {string} filterParameter   The filterParameter is data String coming from frontend.
 * @param {string} searchParameter   The searchParameter is data String coming from frontend.
 * @param {string} userName   The userName is data String coming from frontend.
 * @param {string} userType   The userType is data String coming from frontend.
 * @param {string} companyResellerId   The companyResellerIds is data String coming from frontend.
 * @param {string} vendorIds The vendorIds is data where vendors that are added in deal
 * @return {Object}  json Return Response.
 */
function searchInDeal(filterParameter, searchParameter, userName, userType, companyResellerId, vendorIds) {
  const condition = {};
  let andArray = {};
  condition['companyResellerId']= {$in: [companyResellerId]};
  if (filterParameter && searchParameter) {
    filterParameter == 'vendor' ? delete condition['companyResellerId'] : condition['companyResellerId'];
    condition['userType']= filterParameter;
    filterParameter == 'vendor'? condition['userId']={$in: vendorIds} : null;
    condition[searchParameter]= userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null;
    andArray= {$and: [condition]};
  } else if (searchParameter) {
    andArray = {$or: [
      {$and:
        [{
          [searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null},
        ]},
      {
        $and: [{[searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null},
          {
            'companyResellerId': {$in: [companyResellerId]},
          }],
      }, {
        $and: [{[searchParameter]: userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null},
          {
            userType: 'vendor',
          },
          {
            'userId': {$in: vendorIds},
          }],
      }]};
  } else if (filterParameter) {
    condition['userType']= filterParameter;
    condition['userName']=userName != '' ? {$regex: new RegExp(RegExp.escape(userName), 'i')}:null;
    !userName ? delete condition['userName'] : condition['userName'];
    filterParameter== 'vendor' ? delete condition['companyResellerId'] :condition['companyResellerId'];
    filterParameter == 'vendor'? condition['userId']={$in: vendorIds} : null;
    andArray= {$and: [condition]};
  }
  return andArray;
}

exports.vendorUserList= async (req, res, next) =>{
  try {
    let {userName, perPage, page, userId, searchParameter, filterParameter}= req.body;
    page = Math.max(0, page);
    if (!perPage) {
      perPage = 10;
    }
    const pagination = {skip: perPage * page, limit: perPage};
    let whereArr={};
    const userData = await userCreate.findOne({userId: userId}, 'companyResellerId');
    whereArr={'$or': [{'companyResellerId': userData.companyResellerId, 'userType': 'vendor'}]};
    if (userName && searchParameter) whereArr[searchParameter]= {$regex: new RegExp(RegExp.escape(userName), 'i')};
    if (userName && !searchParameter) whereArr['userName']= {$regex: new RegExp(RegExp.escape(userName), 'i')};
    if (filterParameter) whereArr['userType']=filterParameter;
    console.log('whereArr', JSON.stringify(whereArr));
    userCreate.countDocuments(whereArr, async function(err, count) {
      const data = await userCreate.find(whereArr, {}, pagination).sort({updatedAt: -1});
      const responseObj = {};
      responseObj['data'] = data;
      responseObj['totalpage'] = Math.ceil(count/perPage);
      responseObj['perpage'] = perPage;
      responseObj['total'] = count;
      return res.json(response.success(200, message.serverResponseMessage.Group_list, responseObj));
    });
  } catch (err) {
    console.log('error', err);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, err));
  }
// return true;
};
