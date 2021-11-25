const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const mongoose = require('mongoose');
const moment = require('moment');
const cron = require('node-cron');
const config = require('../config/index');
const Notification = require('../modules/service/notification');
const socketConfig = require('../config/socket');
const Chat = require('../models/Chat');
const HistoryIds = require('../models/HistoryIds');
const group = require('../models/Groups');
const User = require('../models/Users');
const Configuration = require('../models/Configurations');
const response = require('../modules/service/response');
const message = require('../config/message');
const socketController = require('../controller/socketController');
/**
 * Conver array into chunks
 * given callback function.
 * @param {array} items The items contains list of historyIds.
 * @param {integer} chunkSize The historyId.
 * @return {array} return array
 */
function chunk(items, chunkSize) {
  return items.reduce((arr, item, i) => {
    if (!arr.length || arr[arr.length - 1].length === chunkSize) arr.push([]);
    arr[arr.length - 1].push(item);
    return arr;
  }, []);
}
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

exports.webhook = async function(req, res) {
  const historyData = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString());
  console.log('historyData --', typeof historyData);
  const data = new HistoryIds({
    historyId: historyData.historyId,
  });
  await data.save();
  res.status(200).send('History data saved');
};
if (config.environment == 'PRODUCTION') {
  cron.schedule('*/1 * * * * ', async ()=>{
    console.log('start historyId check session ---------');
    const content = await Configuration.find({name: {'$in': ['client_id', 'project_id', 'auth_uri', 'token_uri', 'auth_provider_x509_cert_url', 'client_secret', 'redirect_uris', 'javascript_origins']}}).select({name: 1, value: 1, arr_value: 1, _id: 0});
    const contents = {};
    content.forEach((data)=>{
      contents[data.name] = data.value ? data.value : data.arr_value;
    });
    //
    const historyIdList = await HistoryIds.find({createdAt: {$gt: moment().subtract(config.minutes, 'minutes')}});
    if (historyIdList.length > 0) {
      const historyIdBatches = chunk(historyIdList, config.batchSize);
      for (const batch of historyIdBatches) {
        for (let i =0; i< batch.length; i++) {
          console.log('---------------------------------------------------------- new auth called', batch[i].historyId, '---------------------------------------------------------' );
          try {
            await authorize(contents, batch[i].historyId, listLabels);
          } catch (err) {
            console.log('error when run historyId', err);
          }
        }
      }
    }
    await HistoryIds.deleteMany({createdAt: {$lte: moment().subtract(config.minutes+1, 'minutes')}});
  });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {Object} historyId The historyId.
 * @param {function} callback The callback to call with the authorized client.
 * @param {error} res The res for sending error.
 */
async function authorize(credentials, historyId, callback, res) {
  try {
    const {client_secret, client_id, redirect_uris} = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = await Configuration.find({name: {'$in': ['access_token', 'refresh_token', 'scope', 'token_type', 'expiry_date']}}).select({name: 1, value: 1, _id: 0});
    const generateToken = {};
    token.forEach((data)=>{
      generateToken[data.name] = data.value;
    });
    if (Date.now() >= generateToken.expiry_date) {
      console.log('token expire---');
      oAuth2Client.credentials.refresh_token = generateToken.refresh_token;
      oAuth2Client.refreshAccessToken((error, generatedToken) => {
        if (error) console.log('error', error);
        Configuration.find({name: {'$in': ['access_token', 'expiry_date']}}, function(err, updateTokenResponse) {
          console.log('updateTokenResponse -------', updateTokenResponse);
          updateTokenResponse.forEach((updatingData)=>{
            Configuration.findOneAndUpdate({name: updatingData.name}, {$set: {value: generatedToken[updatingData.name]}}, {new: true}, function(err, response) {
            });
          });
        });
      });
    }
    if (token.length <= 0) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(generateToken);
    console.log('historyId in callback---', historyId);
    await callback(oAuth2Client, historyId, res);
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 * @param {error} res The res for sending error.
 * @return {Object}  json Return Response.
 */
async function getNewToken(oAuth2Client, callback, res) {
  try {
    const authUrl = await oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = await readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await rl.question('Enter the code from that page here: ', async (code) => {
      const decodeCode = unescape(code);
      const TOKEN_PATH = 'something2.txt';
      fs.writeFile(TOKEN_PATH, decodeCode, (err) => {
        if (err) return console.error(err);
      });
      await oAuth2Client.getToken(decodeCode, async (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        // update token and refreshToken to database
        await Configuration.findOneAndUpdate({name: 'access_token'}, {value: token.access_token}, {upsert: true});
        await Configuration.findOneAndUpdate({name: 'expiry_date'}, {value: Number(token.expiry_date)}, {upsert: true});
        await Configuration.findOneAndUpdate({name: 'refresh_token'}, {value: token.refresh_token}, {upsert: true});
        oAuth2Client.setCredentials(token);
        token.code = code;
        // Store the token to disk for later program executions
        const TOKEN_PATH = 'something.txt';
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
        });
        rl.close();
        callback(oAuth2Client);
      });
    });
  } catch (error) {
    console.log('error', error);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, error));
  }
}
/**
 * Lists the labels in the user's account.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {Object} historyId The historyId.
 * @param {error} res The res for sending error.
 * @return {Object}  json Return Response.
 */
async function listLabels(auth, historyId, res) {
  try {
    // return;
    const gmail = google.gmail({version: 'v1', auth});
    const response = await gmail.users.history.list({startHistoryId: historyId, userId: 'me', auth});
    console.log('---------------------------- list label called', historyId);
    if (response.data.history) {
      const uniqueMessages = {};
      response.data.history.forEach((messages) => {
        uniqueMessages[messages.messages[0].threadId] = [];
      });
      for (let i=0; i< response.data.history.length; i++ ) {
        // response.data.history.forEach(async (messages) => {
        const messages= response.data.history[i];
        if (messages.messages[0].threadId != messages.messages[0].id) {
          if (uniqueMessages[messages.messages[0].threadId].indexOf(messages.messages[0].id) == -1) {
            const findMsg = await Chat.findOne({emailMessagesId: messages.messages[0].id});
            if (!findMsg) {
              uniqueMessages[messages.messages[0].threadId].push(messages.messages[0].id);
            }
          }
        }
        // });
      }
      const keys = Object.keys(uniqueMessages);
      for (let j=0; j< keys.length; j++) {
        const key =keys[j];
        if (uniqueMessages[key].length == 0) {
          delete uniqueMessages[key];
        }
        const childResponseData = [];
        if (uniqueMessages[key] && uniqueMessages[key].length > 0) {
          const threadMessage= await printMessage(key, auth, true);
          if (threadMessage) {
            if (mongoose.Types.ObjectId.isValid(threadMessage.groupName)) {
              const groupName = await group.findOne({_id: mongoose.Types.ObjectId(threadMessage.groupName)}).select({groupName: 1});
              if (groupName) {
                const childmsgs = [];
                uniqueMessages[key].forEach(async (messages) => {
                  childmsgs.push(printMessage(messages, auth, false));
                });
                await Promise.all(childmsgs).then(async function(values) {
                  const sortedActivitie1s = values.sort((a, b) => b.timestamp - a.timestamp);
                  for ( let i =0; i< sortedActivitie1s.length; i++) {
                    const element = sortedActivitie1s[i];
                    const str = element.fromUser;
                    if (str) {
                      const emailArr = str.match('<(.*)>');
                      const user = await User.findOne({emailId: emailArr[1].trim()});
                      console.log('message from  ---', emailArr[1]);
                      if (user) {
                        childResponseData.push({
                          groupId: threadMessage.groupName,
                          userId: user.userId,
                          userEmail: emailArr[1],
                          messages: element.messages,
                          groupName: groupName.groupName,
                          messageId: element.messageId,
                        });
                      }
                    // }
                    }
                  }
                }).catch(function(err) {
                  console.log('A promise failed to resolve', err);
                });
                for (let i=0; i< childResponseData.length; i++) {
                  const ele = childResponseData[i];
                  const findMessageData = await Chat.findOne({emailMessagesId: ele.messageId});
                  console.log('message founded while call sendMessage', findMessageData);
                  if (!findMessageData) {
                    const data = await sendMesage(ele.groupId, ele.userId, ele.messages, ele.groupName, ele.messageId, historyId );
                    console.log('data----', data);
                  }
                }
              // });
              }
            } else {
              console.log('objectId not right');
            }
          } else {
            console.log('no thread message found');
          }
        } else {
          console.log('no uniques message found');
        }
      }
    } else {
      console.log('no history found');
    }
    // });
  } catch (error) {
    console.log('error', error);
  }
}
/**
 * printMessage.
 * @param {String} messageID The messageID.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {Boolean} isInbox,
 * @param {Object} res The function return response.
 * @return {Object}  json Return Response.
 */
async function printMessage(messageID, auth, isInbox) {
  try {
    const gmail = google.gmail({version: 'v1', auth});
    return await new Promise(async (resolve, reject) => {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageID,
      }).catch( (err)=>{
        console.log('handle error in response---', err.errors[0].message);
        resolve({timestamp: 0});
      });
      if (response && response.data) {
        let fromAddress = '';
        let groupName = '';
        response.data.payload.headers.forEach((data) => {
          if (data.name == 'From') {
            fromAddress = data.value;
          }
          if (data.name == 'X-Group-ID') {
            groupName = data.value;
          }
        });
        if (response.data.payload && response.data.payload.parts) {
          let message = response.data.payload.parts[1].body.size > 0 && response.data.payload.parts[1].body.data ? Buffer.from(response.data.payload.parts[1].body.data, 'base64').toString('utf-8'): '';
          if (message.indexOf('microsoft-com') > 0) {
            message = message.substring(message.indexOf('class=WordSection1'), message.length);
            message = message.replace('class=WordSection1', '');
            message = message.substring(0, message.indexOf('<div'));
            const spanCount = (message.match(/<span/g) || []).length;
            message = message.trim();
            if (spanCount > 2) {
              for (let i = 0; i < spanCount; i++) {
                message = message.replace('<o:p>', '');
              }
              message= message.replace(/&amp;/, '&');
              message = message.substring(1, message.length);
              message = message.replace(/<(\/)?o:p[^>]*>/g, '\n');
              do {
                message = message.replace('&nbsp;', '');
              } while (message.indexOf('&nbsp;')!= -1);
            } else {
              message = message.substring(0, message.indexOf('</span>'));
              message = message.replace(/<br\s*[\/]?>/gi, '\n');
              message = message.substring(1, message.length);
            }
            message = message.replace(/<[^>]*>?/gm, '');
          }
          if (message.indexOf('MsoNormalTable ') > 0) message = message.substring(0, message.indexOf('MsoNormalTable'));
          if (message.indexOf('ms-outlook-mobile-signature') > 0) message = message.substring(0, message.indexOf('ms-outlook-mobile-signature'));
          if (message.indexOf('ms-outlook-signature') > 0) message = message.substring(0, message.indexOf('ms-outlook-signature'));
          if (message.indexOf('blockquote') > 0) message = message.substring(0, message.indexOf('blockquote'));
          if (message.indexOf('gmail_signature') > 0) message = message.substring(0, message.indexOf('gmail_signature'));
          if (message.indexOf('gmail_quote') > 0) message = message.substring(0, message.indexOf('gmail_quote'));
          let replaceHtml= message.replace(/<[^>]*>?/gm, '');
          replaceHtml = replaceHtml.trim();
          replaceHtml = replaceHtml.replace('&nbsp;', '');
          replaceHtml = replaceHtml.replace('-&gt;', '');
          const result = {
            messages: replaceHtml,
            groupName: groupName,
            fromUser: fromAddress,
            timestamp: parseInt(response.data.internalDate),
            messageId: messageID,
          };
          resolve(result);
        } else {
          resolve({timestamp: 0});
        }
      }
      resolve({timestamp: 0});
    });
    // });
  } catch (error) {
    console.log('error', error);
  }
}
/**
 * Send Message
 * This function is used to send message..
 * @param {String} groupId  The GroupId is unique.
 * @param {String} senderId  The senderId into Group.
 * @param {String} message  The message.
 * @param {String} groupName  The groupName.
 * @param {String} gmailMsgId  The gmailMsgId.
 * @param {String} historyId  The gmailMsgId.
 * @return {Object} json Return Response.
 */
async function sendMesage(groupId, senderId, message, groupName, gmailMsgId, historyId) {
  try {
    await HistoryIds.deleteOne({'historyId': historyId});
    console.log('message to be store', message);
    const findMessageData = await Chat.findOne({emailMessagesId: gmailMsgId});
    if (findMessageData) return false;
    if (message.length == 0) return false;
    const groupType = await group.findOne({_id: mongoose.Types.ObjectId(groupId)}).select({type: 1, groupMembers: 1});
    const chatMessage = new Chat({
      groupId: groupId,
      senderId: senderId,
      message: message,
      groupName: groupName,
      isEmailMessage: true,
      emailMessagesId: gmailMsgId,
      readUserIds: [senderId],
      sendTo: groupType.groupMembers,
    });
    const savedMessage = await chatMessage.save();
    groupType.groupMembers.forEach(async (userId) => {
      const userData = await User.findOne({userId: userId});
      const unreadData = await socketController.getUnreadCountByUser(userId, userData.userName, groupType.type, senderId, groupType, true);
      global.globalSocket.sockets.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL, unreadData);
      const dbResult = await socketController.allUnreadGlobalCount(userId)
      const responseObj = {};
      if(dbResult.length) responseObj['data'] = dbResult;
      else {
        let userObj= [{"_id":userId,"count":0}]
        responseObj['data'] = userObj
      }
      //   responseObj['data'] = dbResult;
      //   responseObj['userId']=userId
      //   responseObj['total'] = dbResult ? dbResult.length : 0;
      global.globalSocket.sockets.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL_COUNT, responseObj);
    });

    await global.globalSocket.emit(socketConfig.REFRESH_CHAT_HISTORY_GLOBAL, {
      groupId: groupId,
      groupName: groupName,
      groupMembers: groupType.groupMembers,
      messageData: savedMessage,
      type: groupType.type,
    });
    await Notification.sendNotifications({_id: groupId, groupName: groupName}, savedMessage._id, message, senderId, groupType.type);
    return chatMessage;
  } catch (error) {
    console.log('error', error);
  }
}
