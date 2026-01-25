const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        unique: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
