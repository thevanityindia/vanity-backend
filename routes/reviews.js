const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   PUT /api/reviews/:productId
// @desc    Create or update a product review
// @access  Private
router.put('/:productId', protect, async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.productId;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check if user already reviewed
        const alreadyReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
            alreadyReviewed.createdAt = Date.now();
        } else {
            const review = {
                user: req.user._id,
                name: `${req.user.firstName} ${req.user.lastName}`,
                rating: Number(rating),
                comment: comment
            };
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        // Calculate Average Rating
        product.averageRating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Review added/updated successfully',
            data: product.reviews
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/reviews/:productId/:reviewId
// @desc    Delete a product review
// @access  Private
router.delete('/:productId/:reviewId', protect, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Verify ownership (unless admin)
        const review = product.reviews.find(r => r._id.toString() === req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const reviews = product.reviews.filter(
            r => r._id.toString() !== req.params.reviewId
        );

        const numOfReviews = reviews.length;
        const averageRating = reviews.length > 0
            ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
            : 0;

        await Product.findByIdAndUpdate(
            req.params.productId,
            {
                reviews,
                averageRating,
                numOfReviews
            },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false
            }
        );

        res.status(200).json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
