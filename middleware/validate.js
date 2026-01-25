const { validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg
        }));

        return res.status(400).json({
            success: false,
            errors: errorMessages,
            message: errorMessages[0].message // Return first error as main message
        });
    }

    next();
};

module.exports = validate;
