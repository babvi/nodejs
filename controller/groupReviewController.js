const groupReview = require('../models/Reviews');
const groupCreate = require('../models/Groups');
const message = require('../config/message');
const response = require('../modules/service/response');

/**
 * Group Review Create
 * This function is used to Create Group Review.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The groupId is Unique.
 * @param {String} req.body.userId  The userId is Creator of Group Review.
 * @param {String} req.body.comment  The Comment is Group Review Comment.
 * @param {Number} req.body.rating  The Rating is Group Review Rating.
 * @return {Object} json Return Response.
 */
exports.groupReviewCreate = async function(req, res) {
  try {
    groupCreate.findById(req.body.groupId, (err, Grprespoonse)=>{
      if (Grprespoonse) {
        groupReview.create(req.body, (error, groupReviewCreatedRes) => {
          if (groupReviewCreatedRes) return res.json(response.success(200, message.serverResponseMessage.Group_Review_Created, groupReviewCreatedRes));
        });
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Review_Creation_PassedData));
    });
  } catch (error) {
    return error;
  }
};

/**
 * Group Review Edit
 * This function is used to Edit Group Review.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.id  The GroupId is Unique.
 * @param {String} req.body.rating  The userId is Creator of Group Review.
 * @param {String} req.body.comment  The Comment is Updating Group Review Comment.
 * @param {Number} req.body.Rating  The Rating is Group Review Rating.
 * @return {Object} json Return Response.
 */
exports.groupReviewEdit = async function(req, res) {
  try {
    groupReview.findOneAndUpdate({_id: req.body.id}, {$set: {comment: req.body.comment, rating: req.body.rating}}, {new: true}, function(error, groupReviewEditRes) {
      if (groupReviewEditRes) {
        return res.json(response.success(200, message.serverResponseMessage.Group_Review_Updated, groupReviewEditRes));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Review_Edit_PassedData));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};


/**
 * Group Review Delete
 * This function is used to Delete Group Review.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.GroupId  The GroupId is Unique.
 * @param {String} req.body.UserId  The userId is Creator of Group Review.
 * @param {String} req.body.Comment  The Comment is getting exact Group Review Comment.
 * @return {Object} json Return Response.
 */
exports.groupReviewDelete = async function(req, res) {
  try {
    groupReview.findOneAndDelete({_id: req.body.id}, (error, groupReviewDeleteRes)=>{
      if (groupReviewDeleteRes) {
        return res.json(response.success(200, message.serverResponseMessage.Group_Review_Deleted, groupReviewDeleteRes));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Review_Delete_PassedData));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

/**
 * Group Reviews List.
 * This function is used to get Group Reviews List by userId.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupId  The groupId is Unique.
 * @param {String} req.body.userId  The userId is Creator of Group Review.
 * @return {Object} json Return Response.
 */
exports.GroupReviewLists = async function(req, res) {
  try {
    console.log({groupId: req.body.groupId, UserId: req.body.userId});
    groupReview.find({groupId: req.body.groupId, UserId: req.body.userId}, (err, GroupReviewLists)=>{
      if (GroupReviewLists.length > 1) {
        return res.json(response.success(200, message.serverResponseMessage.Group_Review_List_Fetched, GroupReviewLists));
      } else return res.json(response.failure(204, message.serverResponseMessage.Group_Review_List_PassedData));
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

