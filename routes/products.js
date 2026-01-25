const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products with filtering
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const {
            category,
            brand,
            search,
            minPrice,
            maxPrice,
            limit,
            exclude,
            isPublic = 'true',
            sort = '-createdAt',
            page = 1
        } = req.query;

        // Build query
        let query = {};

        // Public filter (only show public products to non-admin users)
        if (!req.user || req.user.role !== 'admin') {
            query.$or = [
                { isPublic: true },
                { isPublic: { $exists: false } }
            ];
        } else if (isPublic !== 'all') {
            query.isPublic = isPublic === 'true';
        }

        // Category filter
        if (category) {
            query.category = new RegExp(category, 'i');
        }

        // Brand filter
        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') },
                { category: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Exclude specific product
        if (exclude) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(exclude)) {
                query._id = { $ne: exclude };
            } else {
                query.id = { $ne: exclude };
            }
        }

        // Execute query
        let productsQuery = Product.find(query);

        // Sort
        productsQuery = productsQuery.sort(sort);

        // Limit
        if (limit) {
            productsQuery = productsQuery.limit(parseInt(limit));
        } else {
            // Pagination
            const pageSize = 20;
            const skip = (parseInt(page) - 1) * pageSize;
            productsQuery = productsQuery.skip(skip).limit(pageSize);
        }

        const products = await productsQuery;

        // Get total count for pagination
        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            count: products.length,
            total,
            page: parseInt(page),
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        let product;
        const mongoose = require('mongoose');

        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            product = await Product.findById(req.params.id);
        }

        if (!product) {
            // Try to find by custom numeric ID
            product = await Product.findOne({ id: req.params.id });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check if product is public (allow if missing/undefined for legacy compatibility)
        if (product.isPublic === false) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
