const aws = require('../modules/service/aws');
const Chats = require('../models/Chat');
const message = require('../config/message');
const response = require('../modules/service/response');
const Groups = require('../models/Groups');

/**
 * File Download.
 * This function is used to File Download.
 * @param {Object} req   The req is data Object coming from frontend.
 * @param {Ojbect} res   The res is the Object which is return.
 * @param {String} req.body.groupName.  The Group Name is Unique.
 * @param {String} req.body.id.  The id is the file.
 * @return {String} Url Return Response.
 */
exports.fileDownload = async function(req, res) {
  try {
    let where = {};
    if (req.body.id) {
      where = {_id: req.body.id};
    } else if (req.body.groupName && req.body.fileName) {
      where = {$and: [{groupName: req.body.groupName}, {fileName: req.body.fileName}]};
    }
    if (Object.keys(where).length > 0) {
      Chats.findOne(where, async (err, fileKey)=> {
      if (fileKey && fileKey.fileName) {
        if (fileKey.type === 'quote') {
          const grpObj = await Groups.findOne({_id: fileKey.groupId});
          if (grpObj) {
            aws.fileDownloding(fileKey.fileName, grpObj.dealId).then((fileUrl)=> {
              if (fileUrl) return res.json(response.success(200, message.serverResponseMessage.File_Download_Sucess, {fileUrl: fileUrl}));
            });
          }
        } else {
        aws.fileDownloding(fileKey.fileName, fileKey.groupName).then((fileUrl)=> {
          if (fileUrl) return res.json(response.success(200, message.serverResponseMessage.File_Download_Sucess, {fileUrl: fileUrl}));
        });
      }
    } else return res.json(response.failure(204, message.serverResponseMessage.File_Download_PassedData));
    });
    } else return res.json(response.failure(204, message.serverResponseMessage.File_Download_PassingData));
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};

exports.webfileDownload = async function(req, res) {
  try {
    let where = {};
    if (req.body.id) {
      where = {_id: req.body.id};
    } else if (req.body.groupName && req.body.fileName) {
      where = {$and: [{groupName: req.body.groupName}, {fileName: req.body.fileName}]};
    }
    if (Object.keys(where).length > 0) {
      Chats.findOne(where, async (err, fileKey)=> {
      if (fileKey && fileKey.fileName) {
        if (fileKey.type === 'quote') {
          const grpObj = await Groups.findOne({_id: fileKey.groupId});
          if (grpObj) {
            aws.webfileDownloding(fileKey.fileName, grpObj.dealId).then((fileUrl)=> {
              if (fileUrl) return res.json(response.success(200, message.serverResponseMessage.File_Download_Sucess, {fileUrl: fileUrl}));
            });
          }
        } else {
        aws.webfileDownloding(fileKey.fileName, fileKey.groupName).then((fileUrl)=> {
          if (fileUrl) return res.json(response.success(200, message.serverResponseMessage.File_Download_Sucess, {fileUrl: fileUrl}));
        });
      }
    } else return res.json(response.failure(204, message.serverResponseMessage.File_Download_PassedData));
    });
    } else return res.json(response.failure(204, message.serverResponseMessage.File_Download_PassingData));
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
};
