const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupsSchema = new Schema(
    {
      groupName: {
        type: String,
      },
      groupMembers: {
        type: Array,
      },
      type: {
        type: String,
        enum: ['onetoone', 'quote', 'custom'],
        default: 'onetoone',
      },
      stage: {
        type: String,
        enum: ['initiated', 'quotations', 'waiting-for-approval', 'quotations-received', 'confirmed-po',
          'Qualified', 'Presentation/Demo', 'POC', 'Quote', 'Negotiation', 'Won', 'Lost', 'Deferred/Inactive'],
        default: 'initiated',
      },
      IPAddress: {
        type: String,
      },
      senderId: {
        type: String,
      },
      removedUsers: {
        type: Map,
        // of: [Date, String, String],
        required: true,
        default: new Map(),
      },
      addedUsers: {
        type: Map,
        of: [Date],
        required: true,
        default: new Map(),
      },
      status: {
        type: String,
        enum: ['open', 'close'],
        default: 'open',
      },
      dealId: {
        type: String,
      },
      companyResellerId: {
        type: String,
        default: null,
      },
      adminMembers: {
        type: Array,
      },
      vendorMembers: {
        type: Array,
      },
      isArchive: {
        type: Boolean,
        default: false,
      },
      pinBy: {
        type: Map,
        required: true,
        default: {},
      },
      isPublished: {
        type: Boolean,
        default: false
      },
    },
    {
      timestamps: true,
    },
);

const Groups = mongoose.model('Groups', groupsSchema);

module.exports = Groups;

