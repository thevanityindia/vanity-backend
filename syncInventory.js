const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thevanity');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Product = require('./models/Product');
const Inventory = require('./models/Inventory');

const syncInventory = async () => {
    await connectDB();

    console.log('Syncing inventory...');
    const products = await Product.find();
    let syncedCount = 0;

    for (const product of products) {
        const exists = await Inventory.findOne({ productId: product._id });
        if (!exists) {
            await Inventory.create({
                productId: product._id,
                productName: product.name,
                sku: product.sku || `SKU-${product._id.toString().slice(-8).toUpperCase()}`,
                category: product.category,
                currentStock: product.stock || 0,
                unitCost: (parseFloat(product.price) || 0) * 0.6,
                status: (product.stock || 0) > 0 ? 'in_stock' : 'out_of_stock'
            });
            console.log(`Synced: ${product.name}`);
            syncedCount++;
        }
    }

    console.log(`Synced ${syncedCount} products to inventory`);
    process.exit();
};

syncInventory();
