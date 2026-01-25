const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Verify product exists
        let product;
        const mongoose = require('mongoose');

        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findById(productId);
        }

        if (!product) {
            // Try to find by custom numeric ID
            product = await Product.findOne({ id: productId });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        let cart = await Cart.findOne({ userId: req.user._id });

        if (!cart) {
            cart = new Cart({ userId: req.user._id, items: [] });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item =>
            item.productId.toString() === product._id.toString()
        );

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.price = product.price;
        } else {
            cart.items.push({
                productId: product._id,
                quantity,
                price: product.price
            });
        }

        await cart.save();
        await cart.populate('items.productId');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:itemId', protect, async (req, res, next) => {
    try {
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const item = cart.items.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.productId');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', protect, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        // cart.items.id(req.params.itemId).remove(); // Deprecated
        cart.items.pull({ _id: req.params.itemId });
        await cart.save();
        await cart.populate('items.productId');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });

        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
