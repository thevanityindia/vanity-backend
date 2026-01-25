const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// @route   GET /api/orders/my-orders
// @desc    Get user orders
// @access  Private
router.get('/my-orders', protect, async (req, res, next) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('items.productId')
            .sort('-createdAt');

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Make sure user owns this order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const {
            items,
            shippingAddress,
            billingAddress,
            paymentMethod,
            customerNotes,
            paymentStatus,
            paymentDetails
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No items in order'
            });
        }

        // Validate and get product details
        const orderItems = [];
        const mongoose = require('mongoose');

        for (const item of items) {
            let product;
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
                product = await Product.findById(item.productId);
            }

            if (!product) {
                product = await Product.findOne({ id: item.productId });
            }
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: `Product ${item.productId} not found`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const price = parseFloat(product.price);
            orderItems.push({
                productId: product._id,
                name: product.name,
                brand: product.brand,
                image: product.image,
                quantity: item.quantity,
                price: price,
                subtotal: price * item.quantity
            });
        }

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = 0; // Validate if you have logic for this
        const shippingCost = subtotal > 999 ? 0 : 50; // Example logic, adjust if needed
        const totalAmount = subtotal + tax + shippingCost;

        // Generate order number
        const orderNumber = await Order.generateOrderNumber();

        // Create order
        const order = await Order.create({
            orderNumber,
            userId: req.user._id,
            items: orderItems,
            subtotal,
            tax,
            shippingCost,
            totalAmount,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod,
            paymentStatus: paymentStatus || 'pending',
            paymentDetails,
            customerNotes,
            statusHistory: [{
                status: 'pending',
                note: paymentStatus === 'completed' ? 'Order placed and paid' : 'Order placed'
            }]
        });

        // Update stock
        for (const item of orderItems) {
            // Update Product
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });

            // Update Inventory
            await Inventory.findOneAndUpdate(
                { productId: item.productId },
                {
                    $inc: { currentStock: -item.quantity },
                    $push: {
                        movements: {
                            type: 'sale',
                            quantity: -item.quantity,
                            reason: `Order ${orderNumber}`,
                            date: new Date()
                        }
                    }
                }
            );
        }

        // Update user stats
        const user = await User.findById(req.user._id);
        user.updateOrderStats(order.totalAmount);
        await user.save();

        // Clear cart
        await Cart.findOneAndUpdate(
            { userId: req.user._id },
            { items: [] }
        );

        await order.populate('items.productId');

        // Send confirmation email (async, don't wait)
        sendOrderConfirmationEmail(order, req.user).catch(err => console.error(err));

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
