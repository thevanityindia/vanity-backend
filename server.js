require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

const morgan = require('morgan');
const logger = require('./utils/logger');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging
app.use(morgan('combined', { stream: logger.stream }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thevanity')
    .then(() => logger.info('✅ MongoDB Connected'))
    .catch(err => {
        logger.error(`❌ MongoDB Connection Error: ${err.message}`);
        logger.warn('⚠️  Server will run with limited functionality');
    });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'The Vanity API is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 API Base URL: http://localhost:${PORT}/api`);
    // Server Ready
    logger.info(`📚 Documentation: See API_DOCUMENTATION.md`);
});

module.exports = app;
