const {google} = require('googleapis');
const Configuration = require('../models/Configurations');
const response = require('../modules/service/response');
const message = require('../config/message');
const cron = require('node-cron');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

exports.generateAuthUrl = async (req, res)=> {
  try {
    const credentials=[];
    const credentialsData = await Configuration.find({name: {'$in': ['client_secret', 'client_id', 'redirect_uris']}}).select({name: 1, value: 1, arr_value: 1, _id: 0});
    credentialsData.forEach((data)=>{
      credentials[data.name] = data.value ? data.value : data.arr_value;
    });
    // eslint-disable-next-line camelcase
    const {client_secret, client_id, redirect_uris} = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const authUrl = await oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
    res.json(response.success(200, message.serverResponseMessage.Webhook_auth_url, authUrl));
  } catch (err) {
    console.log('err', err);
    return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, err));
  }
};
exports.generateAuthToken = async (req, res)=>{
  const decodeCode = unescape(req.query.code);
  const credentials=[];
  const credentialsData = await Configuration.find({name: {'$in': ['client_secret', 'client_id', 'redirect_uris']}}).select({name: 1, value: 1, arr_value: 1, _id: 0});
  credentialsData.forEach((data)=>{
    credentials[data.name] = data.value ? data.value : data.arr_value;
  });
  // eslint-disable-next-line camelcase
  const {client_secret, client_id, redirect_uris} = credentials;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oAuth2Client.getToken(decodeCode, async (err, token) => {
    if (err) return res.json(response.failure(204, message.serverResponseMessage.Catch_Error, err));
    // update token and refreshToken to database
    await Configuration.findOneAndUpdate({name: 'access_token'}, {value: token.access_token}, {upsert: true});
    await Configuration.findOneAndUpdate({name: 'expiry_date'}, {value: Number(token.expiry_date)}, {upsert: true});
    await Configuration.findOneAndUpdate({name: 'refresh_token'}, {value: token.refresh_token}, {upsert: true});
    res.json(response.success(200, message.serverResponseMessage.Webhook_token_updated, {}));
  });
};
/**
 * generate watch request
 * This function is used to send message..
 * @return {Boolean} return boolean value
 */
async function watchRequest() {
  const getData = await Configuration.find({name: {$in: ['project_id', 'topicName', 'client_id', 'client_secret', 'redirect_uris', 'access_token', 'refresh_token', 'scope', 'token_type', 'expiry_date']}});
  const dbData = {};
  getData.forEach((data)=>{
    dbData[data.name] = data.value ? data.value : data.arr_value;
  });
  const oAuth2Client = new google.auth.OAuth2(dbData['client_id'], dbData['client_secret'], dbData['redirect_uris'][0]);
  delete dbData['redirect_uris'];
  oAuth2Client.setCredentials({access_token: dbData['access_token'], expiry_date: dbData['expiry_date'], refresh_token: dbData['refresh_token']});
  const gmail = google.gmail({version: 'v1', oAuth2Client});
  const options = {
    userId: 'me',
    auth: oAuth2Client,
    resource: {
      labelIds: ['INBOX'],
      topicName: `projects/${dbData['project_id']}/topics/${dbData['topicName']}`,
    },
  };
  gmail.users.watch(options, function(err, res) {
    if (err) {
      console.log('err000', err);
      return;
    }
    console.log(res);
  });
}

cron.schedule('00 00 12 * * 0-6', function() {
  console.log('running cron once a day');
  watchRequest();
});
