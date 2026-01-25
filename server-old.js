const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Trigger restart
const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_super_secret_key_for_jwt'; // In production, use environment variable

// Database Connection Status
let isDbConnected = false;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thevanity')
    .then(() => {
        console.log('MongoDB Connected');
        isDbConnected = true;
    })
    .catch(err => {
        console.log('MongoDB Connection Failed (Running in Demo Mode):', err.message);
        console.log('Using in-memory data for products.');
        isDbConnected = false;
    });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory store for demo purposes (Use MongoDB/SQL in production)
const otpStore = new Map();
const users = []; // Simple user store

// In-memory products array - starts empty, only shows products added via admin
const inMemoryProducts = [];

// In-memory stores for admin features
const orders = [];
const categories = [
    { id: 1, name: 'Makeup', description: 'Beauty makeup products', parentId: null, status: 'active' },
    { id: 2, name: 'Skincare', description: 'Skincare products', parentId: null, status: 'active' },
    { id: 3, name: 'Hair', description: 'Hair care products', parentId: null, status: 'active' },
    { id: 4, name: 'Fragrance', description: 'Perfumes and fragrances', parentId: null, status: 'active' }
];
const inventory = [];
const content = {
    banners: [],
    pages: [],
    campaigns: []
};
const notifications = [];
const settings = {
    general: {
        siteName: 'The Vanity India',
        siteDescription: 'Your premier destination for beauty products',
        contactEmail: 'contact@thevanityindia.com',
        supportEmail: 'support@thevanityindia.com',
        phoneNumber: '+91 98765 43210',
        address: '123 Beauty Street, Mumbai, Maharashtra 400001',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        language: 'en'
    },
    email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: 'noreply@thevanityindia.com',
        smtpPassword: '',
        fromName: 'The Vanity India',
        fromEmail: 'noreply@thevanityindia.com',
        enableEmailNotifications: true
    },
    payment: {
        razorpayKeyId: '',
        razorpayKeySecret: '',
        stripePublishableKey: '',
        stripeSecretKey: '',
        paypalClientId: '',
        paypalClientSecret: ''
    },
    shipping: {
        freeShippingThreshold: 999,
        standardShippingRate: 99,
        expressShippingRate: 199,
        internationalShippingRate: 599
    }
};

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 2. Send OTP Endpoint
console.log('Registering route: /api/auth/send-otp');
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Login OTP - The Vanity India',
        text: `Your OTP for login is: ${otp}. It expires in 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// 3. Verify OTP Endpoint
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (otpStore.get(email) === otp) {
        // Clear OTP after successful use
        otpStore.delete(email);

        // Find or create user
        let user = users.find(u => u.email === email);
        if (!user) {
            user = { id: Date.now().toString(), email, name: email.split('@')[0] };
            users.push(user);
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ success: true, token, user, message: 'Login successful' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
});

// 4. Get All Products
app.get('/api/products', async (req, res) => {
    if (!isDbConnected) {
        // Return only products added via admin interface
        return res.json(inMemoryProducts);
    }

    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// Get Single Product
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    if (!isDbConnected) {
        const product = inMemoryProducts.find(p => p.id == id);
        if (product) return res.json(product);
        return res.status(404).json({ message: 'Product not found' });
    }

    try {
        const product = await Product.findOne({ id: id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Product
app.post('/api/products', async (req, res) => {
    const { brand, name, price, image, category, subcategory, description } = req.body;

    if (!isDbConnected) {
        // Add to in-memory array
        const newProduct = {
            id: Date.now(),
            brand, name, price, image, category, subcategory, description
        };
        inMemoryProducts.push(newProduct);
        return res.json({ success: true, product: newProduct });
    }

    try {
        const newProduct = new Product({
            id: Date.now(), // Generate a unique ID
            brand,
            name,
            price,
            image,
            category,
            subcategory,
            description
        });
        await newProduct.save();
        res.json({ success: true, product: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Category Statistics
app.get('/api/products/stats/categories', async (req, res) => {
    if (!isDbConnected) {
        // Calculate stats from in-memory products
        const stats = inMemoryProducts.reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        return res.json(stats);
    }

    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = {};
        stats.forEach(stat => {
            result[stat._id || 'Uncategorized'] = stat.count;
        });
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    if (!isDbConnected) {
        const index = inMemoryProducts.findIndex(p => p.id == id);
        if (index !== -1) {
            inMemoryProducts.splice(index, 1);
            return res.json({ success: true, message: 'Product deleted' });
        }
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    try {
        await Product.deleteOne({ id: id });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Clear all products (for testing purposes)
app.delete('/api/products/clear', async (req, res) => {
    if (!isDbConnected) {
        inMemoryProducts.length = 0; // Clear in-memory array
        return res.json({ success: true, message: 'All products cleared' });
    }

    try {
        await Product.deleteMany({});
        res.json({ success: true, message: 'All products cleared from database' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============= ADMIN API ENDPOINTS =============

// Admin Authentication
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple admin authentication (use proper auth in production)
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ 
            id: 'admin', 
            email: 'admin@thevanityindia.com', 
            role: 'admin' 
        }, SECRET_KEY, { expiresIn: '8h' });
        
        res.json({ 
            success: true, 
            token, 
            user: { 
                id: 'admin', 
                email: 'admin@thevanityindia.com', 
                name: 'Admin User',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// User Management APIs
app.get('/api/admin/users', (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;
    let filteredUsers = [...users];
    
    if (search) {
        filteredUsers = filteredUsers.filter(user => 
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (status) {
        filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
        users: paginatedUsers,
        total: filteredUsers.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit)
    });
});

app.get('/api/admin/users/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
});

app.put('/api/admin/users/:id', (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    res.json({ success: true, user: users[userIndex] });
});

// Order Management APIs
app.get('/api/admin/orders', (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;
    let filteredOrders = [...orders];
    
    if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (search) {
        filteredOrders = filteredOrders.filter(order => 
            order.id.toString().includes(search) ||
            order.customerEmail.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    res.json({
        orders: paginatedOrders,
        total: filteredOrders.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredOrders.length / limit)
    });
});

app.get('/api/admin/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
});

app.put('/api/admin/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    
    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    res.json({ success: true, order: orders[orderIndex] });
});

// Analytics APIs
app.get('/api/admin/analytics/overview', (req, res) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalProducts = inMemoryProducts.length;
    
    res.json({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        revenueGrowth: 12.5, // Mock data
        orderGrowth: 8.3,
        userGrowth: 15.2,
        productGrowth: 5.7
    });
});

app.get('/api/admin/analytics/sales', (req, res) => {
    const { period = '7d' } = req.query;
    
    // Mock sales data
    const salesData = [
        { date: '2024-01-15', revenue: 15000, orders: 25 },
        { date: '2024-01-16', revenue: 18000, orders: 30 },
        { date: '2024-01-17', revenue: 22000, orders: 35 },
        { date: '2024-01-18', revenue: 19000, orders: 28 },
        { date: '2024-01-19', revenue: 25000, orders: 40 },
        { date: '2024-01-20', revenue: 21000, orders: 32 },
        { date: '2024-01-21', revenue: 27000, orders: 45 }
    ];
    
    res.json(salesData);
});

// Category Management APIs
app.get('/api/admin/categories', (req, res) => {
    res.json(categories);
});

app.post('/api/admin/categories', (req, res) => {
    const newCategory = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    res.json({ success: true, category: newCategory });
});

app.put('/api/admin/categories/:id', (req, res) => {
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);
    if (categoryIndex === -1) {
        return res.status(404).json({ message: 'Category not found' });
    }
    
    categories[categoryIndex] = { 
        ...categories[categoryIndex], 
        ...req.body, 
        updatedAt: new Date().toISOString() 
    };
    
    res.json({ success: true, category: categories[categoryIndex] });
});

app.delete('/api/admin/categories/:id', (req, res) => {
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);
    if (categoryIndex === -1) {
        return res.status(404).json({ message: 'Category not found' });
    }
    
    categories.splice(categoryIndex, 1);
    res.json({ success: true, message: 'Category deleted' });
});

// Inventory Management APIs
app.get('/api/admin/inventory', (req, res) => {
    const inventoryData = inMemoryProducts.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: `SKU-${product.id}`,
        stock: Math.floor(Math.random() * 100) + 10, // Mock stock data
        lowStockThreshold: 10,
        price: product.price,
        status: 'active'
    }));
    
    res.json(inventoryData);
});

app.put('/api/admin/inventory/:id', (req, res) => {
    const { stock, lowStockThreshold } = req.body;
    
    // In a real app, this would update the inventory in the database
    res.json({ 
        success: true, 
        message: 'Inventory updated',
        inventory: { id: req.params.id, stock, lowStockThreshold }
    });
});

// Content Management APIs
app.get('/api/admin/content/:type', (req, res) => {
    const { type } = req.params;
    if (!content[type]) {
        return res.status(404).json({ message: 'Content type not found' });
    }
    
    res.json(content[type]);
});

app.post('/api/admin/content/:type', (req, res) => {
    const { type } = req.params;
    if (!content[type]) {
        return res.status(404).json({ message: 'Content type not found' });
    }
    
    const newContent = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    content[type].push(newContent);
    res.json({ success: true, content: newContent });
});

app.put('/api/admin/content/:type/:id', (req, res) => {
    const { type, id } = req.params;
    if (!content[type]) {
        return res.status(404).json({ message: 'Content type not found' });
    }
    
    const contentIndex = content[type].findIndex(c => c.id == id);
    if (contentIndex === -1) {
        return res.status(404).json({ message: 'Content not found' });
    }
    
    content[type][contentIndex] = {
        ...content[type][contentIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    res.json({ success: true, content: content[type][contentIndex] });
});

app.delete('/api/admin/content/:type/:id', (req, res) => {
    const { type, id } = req.params;
    if (!content[type]) {
        return res.status(404).json({ message: 'Content type not found' });
    }
    
    const contentIndex = content[type].findIndex(c => c.id == id);
    if (contentIndex === -1) {
        return res.status(404).json({ message: 'Content not found' });
    }
    
    content[type].splice(contentIndex, 1);
    res.json({ success: true, message: 'Content deleted' });
});

// Settings Management APIs
app.get('/api/admin/settings', (req, res) => {
    res.json(settings);
});

app.put('/api/admin/settings/:section', (req, res) => {
    const { section } = req.params;
    if (!settings[section]) {
        return res.status(404).json({ message: 'Settings section not found' });
    }
    
    settings[section] = { ...settings[section], ...req.body };
    res.json({ success: true, settings: settings[section] });
});

// Notification APIs
app.get('/api/admin/notifications', (req, res) => {
    res.json(notifications);
});

app.post('/api/admin/notifications', (req, res) => {
    const newNotification = {
        id: Date.now(),
        ...req.body,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    notifications.push(newNotification);
    res.json({ success: true, notification: newNotification });
});

app.put('/api/admin/notifications/:id/read', (req, res) => {
    const notificationIndex = notifications.findIndex(n => n.id == req.params.id);
    if (notificationIndex === -1) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    
    notifications[notificationIndex].read = true;
    res.json({ success: true, notification: notifications[notificationIndex] });
});

app.delete('/api/admin/notifications/:id', (req, res) => {
    const notificationIndex = notifications.findIndex(n => n.id == req.params.id);
    if (notificationIndex === -1) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    
    notifications.splice(notificationIndex, 1);
    res.json({ success: true, message: 'Notification deleted' });
});

// ============= END ADMIN API ENDPOINTS =============

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Product database starts empty - add products via admin interface');
});
