const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    uploadToCloudinary,
    deleteFromCloudinary,
    uploadMultipleToCloudinary
} = require('../config/cloudinary');

// @route   POST /api/upload/image
// @desc    Upload single image to Cloudinary
// @access  Private/Admin
router.post('/image', protect, authorize('admin'), upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                public_id: result.public_id,
                url: result.url,
                thumbnail_url: result.thumbnail_url,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        next(error);
    }
});

// @route   POST /api/upload/images
// @desc    Upload multiple images to Cloudinary
// @access  Private/Admin
router.post('/images', protect, authorize('admin'), upload.array('images', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No image files provided'
            });
        }

        // Upload all images to Cloudinary
        const fileBuffers = req.files.map(file => file.buffer);
        const results = await uploadMultipleToCloudinary(fileBuffers);

        const uploadedImages = results.map(result => ({
            public_id: result.public_id,
            url: result.url,
            thumbnail_url: result.thumbnail_url,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size
        }));

        res.json({
            success: true,
            message: `${uploadedImages.length} images uploaded successfully`,
            data: uploadedImages
        });
    } catch (error) {
        console.error('Upload error:', error);
        next(error);
    }
});

// @route   DELETE /api/upload/image
// @desc    Delete image from Cloudinary
// @access  Private/Admin
router.delete('/image', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { public_id } = req.body;

        if (!public_id) {
            return res.status(400).json({
                success: false,
                error: 'public_id is required'
            });
        }

        const result = await deleteFromCloudinary(public_id);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: 'Failed to delete image'
            });
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        next(error);
    }
});

// @route   POST /api/upload/product-images
// @desc    Upload product images (main + gallery)
// @access  Private/Admin
router.post('/product-images', protect, authorize('admin'), upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
]), async (req, res, next) => {
    try {
        const uploadedImages = {
            mainImage: null,
            galleryImages: []
        };

        // Upload main image
        if (req.files.mainImage && req.files.mainImage[0]) {
            const mainResult = await uploadToCloudinary(req.files.mainImage[0].buffer);
            uploadedImages.mainImage = {
                public_id: mainResult.public_id,
                url: mainResult.url,
                thumbnail_url: mainResult.thumbnail_url
            };
        }

        // Upload gallery images
        if (req.files.galleryImages && req.files.galleryImages.length > 0) {
            const galleryBuffers = req.files.galleryImages.map(file => file.buffer);
            const galleryResults = await uploadMultipleToCloudinary(galleryBuffers);

            uploadedImages.galleryImages = galleryResults.map(result => ({
                public_id: result.public_id,
                url: result.url,
                thumbnail_url: result.thumbnail_url
            }));
        }

        res.json({
            success: true,
            message: 'Product images uploaded successfully',
            data: uploadedImages
        });
    } catch (error) {
        console.error('Upload error:', error);
        next(error);
    }
});

module.exports = router;
