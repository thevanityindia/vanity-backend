const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const validate = require('../middleware/validate');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
], async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key_for_jwt',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Your account has been suspended. Please contact support.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        user.loginCount += 1;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key_for_jwt',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for admin user
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: 'admin'
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        user.loginCount += 1;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key_for_jwt',
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
// @access  Public
router.post('/send-otp', [
    body('email').trim().toLowerCase().isEmail().withMessage('Please enter a valid email'),
    validate
], async (req, res, next) => {
    try {
        const { email } = req.body;

        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (upsert)
        await OTP.findOneAndUpdate(
            { email: email.toLowerCase() },
            { otp, createdAt: Date.now() }, // Update createdAt to reset expiration
            { upsert: true, new: true }
        );

        // Send Email
        const message = `Your confirmation code for The Vanity India is ${otp}. This code is valid for 5 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">The Vanity India</h2>
                <p>Please use the verification code below to sign in:</p>
                <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                <p>If you didn't request this, you can ignore this email.</p>
                <p>This code expires in 5 minutes.</p>
            </div>
        `;

        await sendEmail({
            email,
            subject: 'The Vanity India - Your Verification Code',
            message,
            html
        });

        console.log(`Sending OTP to ${email}`);

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error("OTP Error:", error);
        next(error);
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register
// @access  Public
router.post('/verify-otp', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('otp').notEmpty().withMessage('OTP is required'),
    validate
], async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Verify OTP from DB
        const otpRecord = await OTP.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                error: 'OTP expired or not found'
            });
        }

        if (otpRecord.otp !== otp && otp !== '123456') { // Keeping master OTP for demo/admin testing if needed
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP'
            });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Find or Create User
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create a new user with placeholder data
            const randomPassword = Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await User.create({
                email: email.toLowerCase(),
                firstName: 'Guest',
                lastName: 'User',
                password: hashedPassword,
                role: 'user',
                isVerified: true
            });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key_for_jwt',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
