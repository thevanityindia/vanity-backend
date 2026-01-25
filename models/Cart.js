const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: Number,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    subtotal: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update subtotal before saving
// Update subtotal before saving
cartSchema.pre('save', async function () {
    if (this.items) {
        this.subtotal = this.items.reduce((sum, item) => {
            return sum + ((item.price || 0) * (item.quantity || 0));
        }, 0);
    }
    this.lastUpdated = new Date();
});

module.exports = mongoose.model('Cart', cartSchema);
