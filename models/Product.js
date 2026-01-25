const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true, default: () => Math.floor(Math.random() * 100000000) },
    brand: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Selling price
    originalPrice: { type: Number }, // Display price (MRP)
    images: [{
        imageUrl: { type: String, required: true },
        publicId: { type: String }
    }],
    category: { type: String, required: true },
    subcategory: { type: String },
    description: { type: String },
    shade: { type: String }, // For displaying shade info on cards
    extraInfo: { type: String }, // For any extra highlights (e.g., "Award Winning")
    stock: { type: Number, required: true, default: 0, min: 0 },

    // Rating and Reviews
    averageRating: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true }, // User's name
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
