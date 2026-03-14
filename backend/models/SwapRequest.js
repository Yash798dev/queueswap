const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    requesterUniqueId: {
        type: String,
        required: true
    },
    requesterTokenNumber: {
        type: Number,
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined', 'Cancelled'],
        default: 'Pending'
    },
    acceptedByUniqueId: {
        type: String,
        default: null
    },
    acceptedByTokenNumber: {
        type: Number,
        default: null
    },
    acceptedByName: {
        type: String,
        default: null
    },
    // Blockchain fields
    onChainOfferId: {
        type: Number,
        default: null
    },
    priceOffered: {
        type: String, // POL in wei (big number as string)
        default: null
    },
    txHash: {
        type: String,
        default: null
    },
    blockchainStatus: {
        type: String,
        enum: ['None', 'OnChain', 'Completed'],
        default: 'None'
    },
    requesterWallet: {
        type: String,
        default: null
    },
    accepterWallet: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
