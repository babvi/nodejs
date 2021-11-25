const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configurationsSchema = new Schema(
    {
      name: {
        type: String,
      },
      value: {
        type: String,
      },
      arr_value: {
        type: Array,
      },
    }, {
      timestamps: true,
    },
);

const configurations = mongoose.model('configurations', configurationsSchema);
module.exports = configurations;

