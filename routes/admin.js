const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { sendOrderStatusUpdateEmail } = require('../utils/emailService');
const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// @route   POST /api/admin/inventory/sync
// @desc    Sync all products to inventory
// @access  Private/Admin
router.post('/inventory/sync', async (req, res, next) => {
    try {
        console.log('Starting Inventory Sync...');
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
                    unitCost: (product.price || 0) * 0.6,
                    status: (product.stock || 0) > 0 ? 'in_stock' : 'out_of_stock'
                });
                syncedCount++;
            }
        }

        console.log(`Synced ${syncedCount} products`);

        res.json({
            success: true,
            message: `Synced ${syncedCount} products to inventory`
        });
    } catch (error) {
        next(error);
    }
});

// ==================== USERS MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort('-createdAt');

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: users
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// ==================== PRODUCTS MANAGEMENT ====================

// @route   GET /api/admin/products
// @desc    Get all products (admin view)
// @access  Private/Admin
router.get('/products', async (req, res, next) => {
    try {
        const { search, category, isPublic, page = 1, limit = 20 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') }
            ];
        }

        if (category) {
            query.category = new RegExp(category, 'i');
        }

        if (isPublic !== undefined) {
            if (isPublic === 'true') {
                query.$or = [{ isPublic: true }, { isPublic: { $exists: false } }];
            } else {
                query.isPublic = false;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort('-createdAt');

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            count: products.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/admin/products/import-excel
// @desc    Bulk import products from Excel
// @access  Private/Admin
router.post('/products/import-excel', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (!data.length) {
            return res.status(400).json({ success: false, error: 'Empty file' });
        }

        let count = 0;
        const errors = [];

        for (const row of data) {
            try {
                // Basic validation
                if (!row.Name || !row.Price || !row.Category) {
                    continue; // Skip invalid rows
                }

                const productData = {
                    name: row.Name,
                    price: Number(row.Price),
                    originalPrice: Number(row['Original Price'] || row.OriginalPrice || row.Price),
                    description: row.Description || '',
                    category: row.Category,
                    subcategory: row.Subcategory || '',
                    stock: row.Stock || 0,
                    sku: row.SKU || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    brand: row.Brand || '',
                    shade: row.Shade || '',
                    extraInfo: row['Extra Info'] || row.ExtraInfo || '',
                    isPublic: true,
                    images: row.Image ? [{ imageUrl: row.Image }] : []
                };

                const product = await Product.create(productData);

                // Sync Inventory
                await Inventory.create({
                    productId: product._id,
                    currentStock: product.stock,
                    lowStockThreshold: 5,
                    sku: product.sku
                });

                count++;
            } catch (err) {
                console.error("Row error:", err);
                errors.push(err.message);
            }
        }

        res.json({
            success: true,
            count,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/admin/products
// @desc    Create product
// @access  Private/Admin
router.post('/products', async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        // Create inventory entry
        await Inventory.create({
            productId: product._id,
            productName: product.name,
            sku: req.body.sku || `SKU-${product._id.toString().slice(-8).toUpperCase()}`,
            category: product.category,
            currentStock: req.body.stock || 0,
            unitCost: (req.body.price || 0) * 0.6 // Assume 40% margin
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Update inventory if exists
        await Inventory.findOneAndUpdate(
            { productId: product._id },
            {
                category: product.category,
                currentStock: req.body.stock !== undefined ? req.body.stock : undefined,
                productName: req.body.name || product.name
            }
        );

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Delete inventory entry
        await Inventory.findOneAndDelete({ productId: product._id });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== INVENTORY MANAGEMENT ====================

// @route   GET /api/admin/inventory/low-stock
// @desc    Get low stock inventory items
// @access  Private/Admin
router.get('/inventory/low-stock', async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;
        const lowStockItems = await Inventory.find({
            status: { $in: ['low_stock', 'out_of_stock'] }
        })
            .populate('productId', 'name')
            .sort('currentStock')
            .limit(parseInt(limit));

        // Format for dashboard
        const formatted = lowStockItems.map(item => ({
            id: item._id,
            name: item.productName || item.productId?.name || 'Unknown',
            stock: item.currentStock,
            reorderLevel: item.reorderLevel || 10,
            sku: item.sku
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/inventory
// @desc    Get all inventory
// @access  Private/Admin
router.get('/inventory', async (req, res, next) => {
    try {
        const { status, search } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { productName: new RegExp(search, 'i') },
                { sku: new RegExp(search, 'i') }
            ];
        }

        const inventory = await Inventory.find(query)
            .populate('productId')
            .sort('-lastUpdated');

        res.json({
            success: true,
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/inventory/:id
// @desc    Update inventory
// @access  Private/Admin
router.put('/inventory/:id', async (req, res, next) => {
    try {
        const { currentStock, reorderLevel, type, reason } = req.body;

        const inventory = await Inventory.findById(req.params.id);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }

        if (type && reason) {
            const adjustment = currentStock - inventory.currentStock;
            inventory.adjustStock(adjustment, type, reason, req.user._id);
        }

        if (currentStock !== undefined) inventory.currentStock = currentStock;
        if (reorderLevel !== undefined) inventory.reorderLevel = reorderLevel;

        await inventory.save();

        // Sync with Product
        await Product.findByIdAndUpdate(inventory.productId, {
            stock: inventory.currentStock
        });

        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
});

// ==================== CATEGORIES MANAGEMENT ====================

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Private/Admin
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await Category.find()
            .populate('children')
            .sort('sortOrder');

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/admin/categories
// @desc    Create category
// @access  Private/Admin
router.post('/categories', async (req, res, next) => {
    try {
        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/categories/:id', async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/categories/:id', async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== ORDERS MANAGEMENT ====================

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', async (req, res, next) => {
    try {
        const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderNumber: new RegExp(search, 'i') }
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('userId', 'firstName lastName email')
            .populate('items.productId')
            .skip(skip)
            .limit(parseInt(limit))
            .sort('-createdAt');

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', async (req, res, next) => {
    try {
        const { status, trackingNumber, note } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        order.status = status;
        if (trackingNumber) order.trackingNumber = trackingNumber;

        order.statusHistory.push({
            status,
            note: note || `Order status updated to ${status}`
        });

        await order.save();

        // Send status update email
        const populatedOrder = await order.populate('userId');
        if (populatedOrder.userId && populatedOrder.userId.email) {
            sendOrderStatusUpdateEmail(populatedOrder, populatedOrder.userId).catch(err => console.error(err));
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

// ==================== NOTIFICATIONS ====================

// @route   GET /api/admin/notifications
// @desc    Get all notifications
// @access  Private/Admin
router.get('/notifications', async (req, res, next) => {
    try {
        const { type, read } = req.query;

        let query = {};

        if (type) query.type = type;
        if (read !== undefined) query.read = read === 'true';

        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .limit(50);

        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/notifications/:id/read
// @desc    Mark notification as read
// @access  Private/Admin
router.put('/notifications/:id/read', async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
});

const Settings = require('../models/Settings');

// ==================== ANALYTICS ====================

// @route   GET /api/admin/analytics/overview
// @desc    Get analytics overview
// @access  Private/Admin
router.get('/analytics/overview', async (req, res, next) => {
    try {
        // Calculate totals
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProducts = await Product.countDocuments();

        // Calculate recent orders (last 5)
        const recentOrders = await Order.find()
            .populate('userId', 'firstName lastName')
            .sort('-createdAt')
            .limit(5);

        // Calculate top products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    sales: { $sum: '$items.quantity' },
                    revenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalOrders,
                totalUsers,
                totalProducts,
                recentOrders,
                topProducts
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/analytics/sales
// @desc    Get sales analytics
// @access  Private/Admin
router.get('/analytics/sales', async (req, res, next) => {
    try {
        const { period = '7d' } = req.query;
        let startDate = new Date();

        if (period === '7d') startDate.setDate(startDate.getDate() - 7);
        if (period === '30d') startDate.setDate(startDate.getDate() - 30);
        if (period === '90d') startDate.setDate(startDate.getDate() - 90);

        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: salesData
        });
    } catch (error) {
        next(error);
    }
});

// ==================== SETTINGS ====================

// @route   GET /api/admin/settings
// @desc    Get all settings
// @access  Private/Admin
router.get('/settings', async (req, res, next) => {
    try {
        const settings = await Settings.find();
        const settingsMap = {};

        settings.forEach(item => {
            settingsMap[item.section] = item.data;
        });

        res.json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/settings/:section
// @desc    Update settings section
// @access  Private/Admin
router.put('/settings/:section', async (req, res, next) => {
    try {
        const { section } = req.params;
        const data = req.body;

        const settings = await Settings.findOneAndUpdate(
            { section },
            {
                data,
                updatedBy: req.user._id
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
});



module.exports = router;
