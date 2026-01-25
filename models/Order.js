const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        brand: String,
        image: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    shippingAddress: {
        firstName: String,
        lastName: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    billingAddress: {
        firstName: String,
        lastName: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'upi', 'netbanking', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDetails: {
        transactionId: String,
        paymentGateway: String,
        paidAt: Date
    },
    trackingNumber: String,
    trackingUrl: String,
    notes: String,
    customerNotes: String,
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Pre-save middleware to calculate subtotals
orderSchema.pre('save', async function () {
    // Calculate item subtotals
    this.items.forEach(item => {
        item.subtotal = item.price * item.quantity;
    });

    // Calculate order subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate total amount
    this.totalAmount = this.subtotal + this.tax + this.shippingCost - this.discount;


});

// Generate order number
orderSchema.statics.generateOrderNumber = async function () {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const count = await this.countDocuments();
    const orderNum = String(count + 1).padStart(5, '0');

    return `ORD-${year}${month}${day}-${orderNum}`;
};

module.exports = mongoose.model('Order', orderSchema);
