# The Vanity - Backend API

Backend server for The Vanity E-commerce Platform built with Node.js, Express, and MongoDB.

## 📚 Documentation

This backend includes comprehensive API documentation:

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API documentation with detailed endpoint descriptions, request/response examples, and data models
2. **[openapi.yaml](./openapi.yaml)** - OpenAPI 3.0 specification for API integration and testing tools
3. **[API_ROUTES.md](./API_ROUTES.md)** - Quick reference guide for all API routes with examples

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/thevanity
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📁 Project Structure

```
backend/
├── models/              # Mongoose models
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Category.js
│   └── Inventory.js
├── routes/              # API routes
│   ├── auth.js
│   ├── products.js
│   ├── users.js
│   ├── orders.js
│   ├── cart.js
│   ├── wishlist.js
│   └── admin/
│       ├── users.js
│       ├── products.js
│       ├── orders.js
│       ├── inventory.js
│       ├── categories.js
│       └── notifications.js
├── middleware/          # Custom middleware
│   ├── auth.js         # JWT authentication
│   ├── admin.js        # Admin authorization
│   └── errorHandler.js # Error handling
├── controllers/         # Route controllers
├── utils/              # Utility functions
├── config/             # Configuration files
├── server.js           # Main server file
├── .env                # Environment variables
├── API_DOCUMENTATION.md
├── openapi.yaml
└── API_ROUTES.md
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Quick Reference

#### Public Endpoints
- `GET /products` - Get all products
- `GET /products/:id` - Get single product
- `GET /categories` - Get all categories
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user

#### User Endpoints (Authentication Required)
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /orders/my-orders` - Get user orders
- `POST /orders` - Create order
- `GET /cart` - Get cart
- `POST /cart` - Add to cart
- `GET /wishlist` - Get wishlist
- `POST /wishlist` - Add to wishlist

#### Admin Endpoints (Admin Authentication Required)
- `GET /admin/users` - Get all users
- `GET /admin/products` - Manage products
- `GET /admin/orders` - Manage orders
- `GET /admin/inventory` - Manage inventory
- `GET /admin/categories` - Manage categories
- `GET /admin/notifications` - Get notifications

For complete endpoint documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token

1. Register a new user:
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

2. Login:
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

3. Use the token in subsequent requests:
```bash
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing the API

### Using cURL

```bash
# Get all products
curl http://localhost:5000/api/products

# Get single product
curl http://localhost:5000/api/products/507f1f77bcf86cd799439011

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'

# Get user profile (with authentication)
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <your_token>"
```

### Using Postman

1. Import the `openapi.yaml` file into Postman
2. Set up environment variables for base URL and token
3. Test endpoints with pre-configured requests

### Using Swagger UI

You can use online Swagger editors to visualize the API:

1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Import the `openapi.yaml` file
3. Explore and test the API documentation

## 📊 Database Models

### User
- Authentication and profile information
- Addresses, orders, wishlist
- Role-based access (user/admin)

### Product
- Product details and pricing
- Images and specifications
- Stock and availability

### Order
- Order items and totals
- Shipping and payment information
- Order status tracking

### Category
- Hierarchical category structure
- Product organization
- Active/inactive status

### Inventory
- Stock levels and movements
- Reorder alerts
- Supplier information

For detailed schema information, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#data-models)

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js security headers

## 🚦 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📈 Performance

- Database indexing for optimized queries
- Pagination for large datasets
- Caching strategies (Redis - optional)
- Query optimization
- Response compression

## 🔄 Development Workflow

### Running in Development

```bash
npm run dev
```

### Running in Production

```bash
npm start
```

### Database Seeding (Optional)

```bash
npm run seed
```

## 🐛 Debugging

Enable detailed logging:

```env
NODE_ENV=development
DEBUG=true
```

## 📝 API Versioning

Current version: `v1`

Future versions will be accessible via:
```
/api/v2/products
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update API documentation
4. Follow REST best practices

## 📄 License

MIT License

## 📞 Support

For API support and questions:
- Email: support@thevanity.com
- Documentation: See API_DOCUMENTATION.md

---

**Version:** 1.0.0  
**Last Updated:** January 24, 2026
