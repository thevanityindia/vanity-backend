const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET /api/blogs
// @desc    Get all published blogs
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { isPublished: true };

        const blogs = await Blog.find(query)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments(query);

        res.json({
            success: true,
            data: blogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/blogs/:slug
// @desc    Get single blog by slug
// @access  Public
router.get('/:slug', async (req, res, next) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog post not found'
            });
        }

        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
});

// === Admin Routes ===

// @route   POST /api/blogs
// @desc    Create a blog post
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const blog = await Blog.create(req.body);
        res.status(201).json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog post
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        await blog.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/blogs/admin/all
// @desc    Get all blogs (including unpublished) for admin
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res, next) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
