const connect = require('../dbconnect');
// const Chat = require('../models/Chat');
// const mongoose = require('mongoose');
const group = require('../models/Groups');
connect.then((db) => {
  console.log(`Connected to MongoDB`);
}).catch((e) => {
  console.error(`Could not init db\n${e.trace}`);
});
/**
* update groupMember as a sendTo in previous message
 * This function is used to AuthToken.
 * @param {string} email  The data is create device token required data.
 * @return {Boolean} return boolean.
 */
async function sendToAdd() {
  const updateData = await group.updateMany({ }, {isArchive: false}, {timestamps: false});
  console.log('updateData====', updateData);
  // const groupList = await group.find();
  // groupList.forEach(async (element) => {
  //   await Chat.updateMany({groupId: mongoose.Types.ObjectId(element._id)}, {'sendTo': element.groupMembers});
  // });
}
sendToAdd();
