const express = require('express');
const router = express.Router();
const razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

const instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret'
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay Order
// @access  Private
router.post('/create-order', protect, async (req, res, next) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: Math.round(amount * 100), // razorpay expects amount in paise
            currency,
            receipt
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({
                success: false,
                error: 'Could not create Razorpay order'
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

// @route   POST /api/payments/verify
// @desc    Verify Razorpay Payment
// @access  Private
router.post('/verify', protect, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_secret')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                error: "Invalid signature sent!"
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
