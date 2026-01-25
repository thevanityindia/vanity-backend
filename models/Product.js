const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true, default: () => Math.floor(Math.random() * 100000000) }, // Auto-generate ID if missing
    brand: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    images: [{
        imageUrl: { type: String, required: true },
        publicId: { type: String }
    }],
    category: { type: String, required: true }, // Now required for better organization
    subcategory: { type: String }, // Optional subcategory
    description: { type: String },
    stock: { type: Number, required: true, default: 0, min: 0 }
});

module.exports = mongoose.model('Product', productSchema);
