const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    fastServiceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FastServiceRequest',
        required: true
    },
    // Payer (the one who requested fast service)
    payerUniqueId: { type: String, required: true },
    payerName: { type: String, required: true },
    payerTokenBefore: { type: Number, required: true },
    payerTokenAfter: { type: Number, required: true },
    // Receiver (the one who offered their position)
    receiverUniqueId: { type: String, required: true },
    receiverName: { type: String, required: true },
    receiverTokenBefore: { type: Number, required: true },
    receiverTokenAfter: { type: Number, required: true },
    // Amounts
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },      // 5%
    receiverAmount: { type: Number, required: true },    // 95%
    platformFeePercent: { type: Number, default: 5 },
    status: {
        type: String,
        enum: ['Completed', 'Refunded'],
        default: 'Completed'
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
