# The Vanity - API Documentation

## Overview

This document provides comprehensive documentation for The Vanity E-commerce Platform API. The API follows RESTful principles and returns JSON responses.

**Base URL:** `http://localhost:5000/api`

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
   - [Products](#products)
   - [Categories](#categories)
3. [User Endpoints](#user-endpoints)
   - [Authentication](#user-authentication)
   - [Profile](#user-profile)
   - [Orders](#user-orders)
   - [Cart](#cart)
   - [Wishlist](#wishlist)
4. [Admin Endpoints](#admin-endpoints)
   - [Users Management](#users-management)
   - [Products Management](#products-management)
   - [Inventory Management](#inventory-management)
   - [Categories Management](#categories-management)
   - [Orders Management](#orders-management)
   - [Notifications](#notifications)
5. [Error Handling](#error-handling)
6. [Data Models](#data-models)

---

## Authentication

### JWT Token Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Admin Authentication

Admin endpoints require an admin role. The JWT token must contain `role: 'admin'`.

---

## Public Endpoints

### Products

#### Get All Products

```http
GET /api/products
```

**Query Parameters:**
- `category` (string, optional) - Filter by category name
- `limit` (number, optional) - Limit number of results
- `exclude` (string, optional) - Exclude product by ID
- `search` (string, optional) - Search in product name, brand, category
- `minPrice` (number, optional) - Minimum price filter
- `maxPrice` (number, optional) - Maximum price filter
- `brand` (string, optional) - Filter by brand
- `isPublic` (boolean, optional) - Filter by public/private status (default: true)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Crystal Pendant Necklace Set",
    "brand": "Fashion Jewelry",
    "price": 600,
    "originalPrice": 899,
    "image": "https://example.com/image.jpg",
    "images": ["url1", "url2"],
    "category": "Necklaces",
    "description": "Elegant crystal pendant necklace set...",
    "reviews": 120,
    "rating": 4.5,
    "stock": 45,
    "isPublic": true,
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z"
  }
]
```

#### Get Single Product

```http
GET /api/products/:id
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Crystal Pendant Necklace Set",
  "brand": "Fashion Jewelry",
  "price": 600,
  "originalPrice": 899,
  "image": "https://example.com/image.jpg",
  "images": ["url1", "url2"],
  "category": "Necklaces",
  "description": "Elegant crystal pendant necklace set...",
  "reviews": 120,
  "rating": 4.5,
  "stock": 45,
  "specifications": {
    "material": "Sterling Silver",
    "weight": "15g"
  },
  "isPublic": true
}
```

### Categories

#### Get All Categories

```http
GET /api/categories
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Necklaces",
    "slug": "necklaces",
    "description": "Beautiful necklaces for every occasion",
    "image": "https://example.com/category.jpg",
    "parentId": null,
    "isActive": true,
    "sortOrder": 1,
    "productCount": 45
  }
]
```

---

## User Endpoints

### User Authentication

#### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+91 98765 43210"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login User

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### User Profile

#### Get User Profile

```http
GET /api/users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "addresses": [],
  "createdAt": "2024-01-20T10:30:00Z"
}
```

#### Update User Profile

```http
PUT /api/users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+91 98765 43211"
}
```

### User Orders

#### Get User Orders

```http
GET /api/orders/my-orders
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-001",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "Crystal Necklace",
        "quantity": 2,
        "price": 600
      }
    ],
    "totalAmount": 1200,
    "status": "processing",
    "shippingAddress": {},
    "createdAt": "2024-01-20T10:30:00Z"
  }
]
```

#### Create Order

```http
POST /api/orders
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "phone": "+91 98765 43210"
  },
  "paymentMethod": "cod"
}
```

### Cart

#### Get User Cart

```http
GET /api/cart
```

**Headers:** `Authorization: Bearer <token>`

#### Add to Cart

```http
POST /api/cart
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

#### Update Cart Item

```http
PUT /api/cart/:itemId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove from Cart

```http
DELETE /api/cart/:itemId
```

**Headers:** `Authorization: Bearer <token>`

### Wishlist

#### Get Wishlist

```http
GET /api/wishlist
```

**Headers:** `Authorization: Bearer <token>`

#### Add to Wishlist

```http
POST /api/wishlist
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439012"
}
```

#### Remove from Wishlist

```http
DELETE /api/wishlist/:productId
```

**Headers:** `Authorization: Bearer <token>`

---

## Admin Endpoints

### Users Management

#### Get All Users

```http
GET /api/admin/users
```

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (string, optional) - Filter by status (active, suspended)
- `search` (string, optional) - Search by name or email

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Priya",
    "lastName": "Sharma",
    "email": "priya.sharma@email.com",
    "phone": "+91 98765 43210",
    "status": "active",
    "emailVerified": true,
    "phoneVerified": true,
    "totalOrders": 8,
    "totalSpent": 15600,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-20T09:15:00Z"
  }
]
```

#### Update User Status

```http
PUT /api/admin/users/:id/status
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "suspended"
}
```

### Products Management

#### Create Product

```http
POST /api/admin/products
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "New Product",
  "brand": "Brand Name",
  "price": 599,
  "originalPrice": 799,
  "category": "Necklaces",
  "description": "Product description",
  "image": "https://example.com/image.jpg",
  "images": ["url1", "url2"],
  "stock": 50,
  "isPublic": true
}
```

#### Update Product

```http
PUT /api/admin/products/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** Same as Create Product

#### Delete Product

```http
DELETE /api/admin/products/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

### Inventory Management

#### Get Inventory

```http
GET /api/admin/inventory
```

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "productId": "507f1f77bcf86cd799439012",
    "productName": "Rare Beauty Liquid Blush",
    "sku": "RB-BLUSH-JOY",
    "category": "Makeup",
    "currentStock": 45,
    "reservedStock": 8,
    "availableStock": 37,
    "reorderLevel": 20,
    "maxStock": 100,
    "unitCost": 15.50,
    "totalValue": 697.50,
    "status": "in_stock",
    "supplier": "Beauty Supplies Co.",
    "location": "Warehouse A - Shelf 12",
    "lastUpdated": "2024-01-20T14:30:00Z"
  }
]
```

#### Update Inventory

```http
PUT /api/admin/inventory/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "currentStock": 50,
  "reorderLevel": 25
}
```

### Categories Management

#### Get All Categories (Admin)

```http
GET /api/admin/categories
```

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Makeup",
    "description": "All makeup products",
    "parentId": null,
    "isActive": true,
    "sortOrder": 1,
    "image": "https://example.com/category.jpg",
    "productCount": 245,
    "attributes": ["Brand", "Shade", "Finish"],
    "children": []
  }
]
```

#### Create Category

```http
POST /api/admin/categories
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "parentId": null,
  "isActive": true,
  "sortOrder": 1,
  "image": "https://example.com/image.jpg"
}
```

#### Update Category

```http
PUT /api/admin/categories/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

#### Delete Category

```http
DELETE /api/admin/categories/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

### Orders Management

#### Get All Orders

```http
GET /api/admin/orders
```

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (string, optional) - Filter by order status
- `startDate` (string, optional) - Filter orders from date
- `endDate` (string, optional) - Filter orders to date

#### Update Order Status

```http
PUT /api/admin/orders/:id/status
```

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

### Notifications

#### Get Notifications

```http
GET /api/admin/notifications
```

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "type": "order",
    "priority": "high",
    "title": "New Order Received",
    "message": "Order #ORD-2024-001 has been placed",
    "timestamp": "2024-01-21T10:30:00Z",
    "read": false,
    "actionUrl": "/admin/orders/ORD-2024-001",
    "iconName": "FiShoppingCart",
    "color": "#10b981"
  }
]
```

#### Mark Notification as Read

```http
PUT /api/admin/notifications/:id/read
```

**Headers:** `Authorization: Bearer <admin_token>`

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### Product Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  brand: String (required),
  price: Number (required),
  originalPrice: Number,
  image: String (required),
  images: [String],
  category: String (required),
  description: String,
  reviews: Number (default: 0),
  rating: Number (default: 0),
  stock: Number (default: 0),
  specifications: Object,
  isPublic: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### User Model

```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  role: String (enum: ['user', 'admin'], default: 'user'),
  status: String (enum: ['active', 'suspended'], default: 'active'),
  emailVerified: Boolean (default: false),
  phoneVerified: Boolean (default: false),
  addresses: [AddressSchema],
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Order Model

```javascript
{
  _id: ObjectId,
  orderNumber: String (required, unique),
  userId: ObjectId (ref: 'User'),
  items: [{
    productId: ObjectId (ref: 'Product'),
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number (required),
  status: String (enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  shippingAddress: AddressSchema,
  paymentMethod: String,
  paymentStatus: String,
  trackingNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  slug: String (required, unique),
  description: String,
  parentId: ObjectId (ref: 'Category'),
  isActive: Boolean (default: true),
  sortOrder: Number (default: 0),
  image: String,
  attributes: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Rate Limiting

- **Public Endpoints:** 100 requests per 15 minutes
- **Authenticated Endpoints:** 200 requests per 15 minutes
- **Admin Endpoints:** 500 requests per 15 minutes

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All prices are in INR (Indian Rupees)
- File uploads should be multipart/form-data
- Maximum file size for images: 5MB
- Supported image formats: JPG, PNG, WebP

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
