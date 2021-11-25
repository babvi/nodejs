const AWS = require('aws-sdk');
const fs = require('fs');
const indexing = require('../../config/index');
const ID = indexing.aws.key;
const SECRET = indexing.aws.secret;
const BUCKET_NAME = indexing.s3.bucket;
const REGION = indexing.aws.region;

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
  region: REGION,
});

/* UPLOADING FILE INTO S3 BUCKET */
exports.fileUpload = async function(fileName, groupName) {
  try {
    if (fileName!= null) {
      return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(process.env.PWD+'/resources/attachments/'+fileName);
        const params = {
          Bucket: BUCKET_NAME,
          Key: groupName+'/'+fileName,
          Body: fileContent,
          ACL: 'public-read',
        };
        s3.upload(params, function(err, data) {
          if (err) {
            throw err;
          }
          const path = process.env.PWD+'/resources/attachments/'+fileName;
          fs.unlink(path, (err) => {
            if (err) return err;
          });
          resolve(data);
        });
      });
    }
  } catch (error) {
    return error;
  }
};

/* FILE DOWNLOAD FROM AWS S3 BUCKET */
exports.fileDownloding = function(fileKey, groupName, res) {
  try {
    if (fileKey != null) {
      return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
          accessKeyId: ID,
          secretAccessKey: SECRET,
          region: REGION,
        });
        const options = {
          Bucket: BUCKET_NAME,
          Key: groupName+'/'+fileKey,
        };
        s3.getSignedUrl('getObject', options, (error, resUrl)=> {
          if (error) {
            throw error;
          }
          resolve(resUrl);
        });
      });
    }
  } catch (error) {
    return error;
  }
};

/* FILE DOWNLOAD FROM AWS S3 BUCKET */
exports.webfileDownloding = function(fileKey, groupName, res) {
  try {
    if (fileKey != null) {
      return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
          accessKeyId: ID,
          secretAccessKey: SECRET,
          region: REGION,
        });
        const options = {
          Bucket: BUCKET_NAME,
          Key: groupName+'/'+fileKey,
        };
        s3.getObject(options, function(err, data) {
          if (err) {
            throw err;
          } else {
            var json = new Buffer(data.Body).toString("base64");
            resolve(json);
          }
        });
      });
    }
  } catch (error) {
    return error;
  }
};

