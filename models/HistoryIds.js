const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historyIdSchema = new Schema(
    {
      historyId: {type: String, default: null},
    },
    {
      timestamps: true,
    },
);

const HistoryIds = mongoose.model('HistoryIds', historyIdSchema);

module.exports = HistoryIds;
