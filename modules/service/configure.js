const configuring = require('../../models/Configurations');

/**
 * configureCreate
 * This function is used to configure create.
 * @param {Object} data   The data Object.
 * @return {Object} json Return Response.
 */
exports.configureCreate = async function(data) {
  configuring.create(data, (err, createRes)=>{
    console.log('createRes', createRes);
    return createRes;
  });
};

/**
 * configureUpdate
 * This function is used to configure update.
 * @param {Object} data   The data Object.
 * @return {Object} json Return Response.
 */
exports.configureUpdate = async function(data) {
  configuring.findOneAndUpdate({name: data.name}, {$set: {value: data.value}}, {new: true}, (err, updatedRes)=> {
    console.log('updatedRes', updatedRes);
    return updatedRes;
  });
};

