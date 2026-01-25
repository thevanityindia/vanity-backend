const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'active'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    addresses: [{
        type: {
            type: String,
            enum: ['shipping', 'billing'],
            default: 'shipping'
        },
        firstName: String,
        lastName: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        postalCode: String,
        country: {
            type: String,
            default: 'India'
        },
        phone: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    averageOrderValue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Method to calculate average order value
userSchema.methods.updateOrderStats = function (orderTotal) {
    this.totalOrders += 1;
    this.totalSpent += orderTotal;
    this.averageOrderValue = this.totalSpent / this.totalOrders;
};

module.exports = mongoose.model('User', userSchema);
