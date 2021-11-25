const fs = require('fs');
const nodemailer = require('nodemailer');
const config = require('../../config/index');
const users = require('../../models/Users');
/**
 * checkEmail function validate email  with regex
 * This function is used to AuthToken.
 * @param {string} email  The data is create device token required data.
 * @return {Boolean} return boolean.
 */
function checkEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const smtpTransport = nodemailer.createTransport('smtps://'+encodeURIComponent(config.email.fromEmail)+':'+encodeURIComponent(config.email.password) + '@'+config.email.host+':'+config.email.port+'');
module.exports = {
  sendEmail: function(userName, msg, orderId, emailsArr) {
    if (emailsArr.length) {
      let emailTemplate = fs.readFileSync( __dirname+'/../templates/msg.html', 'utf8');
      emailTemplate = emailTemplate.replace('##MESSAGE##', msg);
      emailTemplate = emailTemplate.replace('##USER##', userName);
      const mail = {
        from: config.email.fromName+' <'+config.email.fromEmail+'>',
        to: emailsArr,
        subject: 'New msg from '+userName+ ' with reference deal id #'+orderId,
        text: '',
        html: emailTemplate,
      };
      // Check Email is true Or False
      if (config.environment == 'PRODUCTION') {
        if (config.sendEmail === 'true') {
          smtpTransport.sendMail(mail, function(error, response) {
            if (error) {
              console.log(error);
            } else {
              console.log('Message sent');
            }
            smtpTransport.close();
          });
        }
      }
    }
  },
  sendChatEmail: async function(data) {
    if (checkEmail(data.to)) {
      let emailTemplate = fs.readFileSync( __dirname+'/../../templates/msg.html', 'utf8');
      const userData = await users.findOne({userId: data.userId}).select({'userType': 1});
      emailTemplate = emailTemplate.replace('##MESSAGE##', data.message);
      emailTemplate = emailTemplate.replace('##USER##', data.senderUsername);
      if (userData.userType == 'vendor') {
        let baseURL= config.baseUrl;
        baseURL= `${baseURL}&group_id=${data.groupId}`;
        emailTemplate= emailTemplate.replace('##URL##', baseURL);
      } else {
        let ResellerURL= config.resellerUrl;
        ResellerURL= `${ResellerURL}?group_id=${data.groupId}`;
        emailTemplate= emailTemplate.replace('##URL##', ResellerURL);
      }
      const mail = {
        from: config.email.fromName+' <'+config.email.fromEmail+'>',
        to: data.to,
        subject: data.subject,
        text: data.userName,
        html: emailTemplate,
        headers: {
          'x-group-id': data.groupId.toString(),
          'x-my-sender-id': data.senderId,
        },
      };
      if (config.environment == 'PRODUCTION') {
        if (config.sendEmail === 'true') {
          const data = await smtpTransport.sendMail(mail);
          if (data) {
            console.log('Message sent');
            return true;
          } else {
            console.log('error---');
            return false;
          }
        }
        smtpTransport.close();
      }
    }
  },
};
