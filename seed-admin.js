require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thevanity');
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@thevanity.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin user
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@thevanity.com',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            emailVerified: true,
            phoneVerified: false
        });

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: admin123');
        console.log('👑 Role:', admin.role);
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
};

createAdminUser();
