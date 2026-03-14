const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    tokenNumber: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true
    },
    walletAddress: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Waiting', 'Served', 'Cancelled'],
        default: 'Waiting'
    }
}, { timestamps: true });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
