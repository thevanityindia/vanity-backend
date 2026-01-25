const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Cloudinary folder name (optional)
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadToCloudinary = (fileBuffer, folder = 'thevanity/products') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
                transformation: [
                    { width: 1000, height: 1000, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        public_id: result.public_id,
                        url: result.secure_url,
                        thumbnail_url: result.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        size: result.bytes
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: result.result === 'ok',
            message: result.result
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} fileBuffers - Array of file buffers
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>}
 */
const uploadMultipleToCloudinary = async (fileBuffers, folder = 'thevanity/products') => {
    const uploadPromises = fileBuffers.map(buffer => uploadToCloudinary(buffer, folder));
    return Promise.all(uploadPromises);
};

/**
 * Get optimized image URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized image URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
    const {
        width = 800,
        height = 800,
        crop = 'limit',
        quality = 'auto',
        format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
        transformation: [
            { width, height, crop },
            { quality },
            { fetch_format: format }
        ],
        secure: true
    });
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    uploadMultipleToCloudinary,
    getOptimizedUrl
};
