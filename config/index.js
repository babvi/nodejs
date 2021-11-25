const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT,
  databaseURL: process.env.MONGODB_URI,
  development_databaseURL: process.env.DEVELOPMENT_URI,
  localStorageURL: process.env.STORAGE_URL,
  baseUrl: process.env.BASEURL,
  nodeappUrl:process.env.APP_USER_URL,
  resellerUrl:process.env.RESELLER_USER_URL,
  email: {
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.EMAIL_PORT,
  },
  aws: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },
  s3: {
    bucket: process.env.S3_BUCKET,
    folder: process.env.S3_FOLDER,
  },
  firebaseKey: process.env.FIREBASE_KEY,
  emailMinutes: process.env.EMAIL_MINUTES ?  process.env.EMAIL_MINUTES : 30,
  hours: process.env.HOURS,
  minutes: process.env.MINUTES ? process.env.MINUTES : 15,
  batchSize: process.env.BATCH ? process.env.BATCH : 5,
  notificationTitle: process.env.NOTIFICATION_TITLE,
  sendNotification: process.env.SEND_NOTIFICATION,
  sendEmail: process.env.SEND_EMAIL,
  environment: process.env.ENVIRONMENT,
  secret: process.env.SECRET,
  parseEmail: process.env.FROM_EMAIL,
  pinAllowed: process.env.PIN_ALLOWED ? process.env.PIN_ALLOWED: 3,
};
