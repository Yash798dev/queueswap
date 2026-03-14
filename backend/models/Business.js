const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Restaurant', 'Hospital'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    qrCode: {
        type: String // Stores base64 data URL
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    queue: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
