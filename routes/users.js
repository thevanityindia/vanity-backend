const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName, phone },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/users/addresses
// @desc    Add address
// @access  Private
router.post('/addresses', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        // If this is set as default, unset other defaults
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(req.body);
        await user.save();

        res.json({
            success: true,
            data: user.addresses
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/addresses/:addressId', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // If setting as default, unset others
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        Object.assign(address, req.body);
        await user.save();

        res.json({
            success: true,
            data: user.addresses
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/addresses/:addressId', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses.id(req.params.addressId).remove();
        await user.save();

        res.json({
            success: true,
            data: user.addresses
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
