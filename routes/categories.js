const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const { active } = req.query;

        let query = {};
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const categories = await Category.find(query)
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

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id).populate('children');

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

module.exports = router;
