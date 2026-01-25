const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @route   GET /api/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        let wishlist = await Wishlist.findOne({ userId: req.user._id })
            .populate('items.productId');

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId: req.user._id, items: [] });
        }

        res.json({
            success: true,
            data: wishlist
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { productId } = req.body;

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

        // Use the resolved MongoDB _id
        const productObjId = product._id;

        let wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.user._id, items: [] });
        }

        // Check if product already in wishlist
        const exists = wishlist.items.some(item =>
            item.productId.toString() === productObjId.toString()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                error: 'Product already in wishlist'
            });
        }

        wishlist.items.push({ productId: productObjId });
        await wishlist.save();
        await wishlist.populate('items.productId');

        res.json({
            success: true,
            data: wishlist
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/:productId', protect, async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                error: 'Wishlist not found'
            });
        }

        wishlist.items = wishlist.items.filter(item =>
            item.productId.toString() !== req.params.productId
        );

        await wishlist.save();
        await wishlist.populate('items.productId');

        res.json({
            success: true,
            data: wishlist
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
