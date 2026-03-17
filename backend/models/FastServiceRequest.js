const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offererUniqueId: { type: String, required: true },
    offererName: { type: String, required: true },
    offererTokenNumber: { type: Number, required: true },
    demandedPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined'],
        default: 'Pending'
    }
}, { timestamps: true });

const fastServiceRequestSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    requesterUniqueId: {
        type: String,
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterTokenNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'Completed', 'Cancelled'],
        default: 'Open'
    },
    offers: [offerSchema]
}, { timestamps: true });

module.exports = mongoose.model('FastServiceRequest', fastServiceRequestSchema);
