const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    productName: String,
    sku: {
        type: String,
        required: true,
        unique: true
    },
    category: String,
    currentStock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    availableStock: {
        type: Number,
        default: 0
    },
    reorderLevel: {
        type: Number,
        default: 10
    },
    maxStock: {
        type: Number,
        default: 1000
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0
    },
    totalValue: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
        default: 'in_stock'
    },
    supplier: String,
    location: String,
    movements: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['sale', 'restock', 'adjustment', 'return', 'damage'],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        reason: String,
        notes: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    lastRestockDate: Date,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate available stock and total value before saving
inventorySchema.pre('save', function () {
    this.availableStock = this.currentStock - this.reservedStock;
    this.totalValue = this.currentStock * this.unitCost;

    // Update status based on stock levels
    if (this.currentStock === 0) {
        this.status = 'out_of_stock';
    } else if (this.currentStock <= this.reorderLevel) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }

    this.lastUpdated = new Date();
});

// Method to adjust stock
inventorySchema.methods.adjustStock = function (quantity, type, reason, userId) {
    this.movements.push({
        type,
        quantity,
        reason,
        performedBy: userId
    });

    this.currentStock += quantity;

    if (type === 'restock') {
        this.lastRestockDate = new Date();
    }
};

module.exports = mongoose.model('Inventory', inventorySchema);
