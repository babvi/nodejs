const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupReviewSchema = new Schema({
  groupId: {type: mongoose.Schema.Types.ObjectId, required: true},
  userId: {type: String, required: true},
  comment: {type: String, required: true},
  rating: {type: Number, required: true},
}, {
  timestamps: true,
},
);

const GroupsReviews = mongoose.model('Reviews', groupReviewSchema);

module.exports = GroupsReviews;

