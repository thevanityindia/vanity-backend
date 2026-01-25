# API Testing Guide

Quick guide to test all The Vanity API endpoints.

## Prerequisites

1. MongoDB running on `localhost:27017`
2. Backend server running on `http://localhost:5000`
3. Admin user created (run `node seed-admin.js`)

---

## 🧪 Test Sequence

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

Expected: `{"success":true,"message":"The Vanity API is running",...}`

---

### 2. User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+91 98765 43210"
  }'
```

Expected: Returns token and user object

**Save the token for next requests!**

---

### 3. User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

### 4. Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@thevanity.com",
    "password": "admin123"
  }'
```

**Save the admin token!**

---

### 5. Create Product (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Crystal Pendant Necklace",
    "brand": "Fashion Jewelry",
    "price": 599,
    "originalPrice": 799,
    "category": "Necklaces",
    "description": "Beautiful crystal pendant necklace",
    "image": "https://example.com/image.jpg",
    "stock": 50,
    "isPublic": true
  }'
```

---

### 6. Get All Products

```bash
curl http://localhost:5000/api/products
```

---

### 7. Get User Profile

```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

### 8. Add to Cart

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID_FROM_STEP_6",
    "quantity": 2
  }'
```

---

### 9. Get Cart

```bash
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

### 10. Create Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "User",
      "address1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "phone": "+91 98765 43210"
    },
    "paymentMethod": "cod"
  }'
```

---

## 📋 Postman Collection

Import this JSON into Postman for easier testing:

```json
{
  "info": {
    "name": "The Vanity API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "userToken",
      "value": ""
    },
    {
      "key": "adminToken",
      "value": ""
    }
  ]
}
```

---

## ✅ Checklist

- [ ] Health check works
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Create product (admin) works
- [ ] Get products works
- [ ] Get user profile works
- [ ] Add to cart works
- [ ] Create order works
- [ ] Get user orders works

---

## 🐛 Troubleshooting

### "MongoDB connection failed"
- Make sure MongoDB is running
- Check MONGO_URI in .env

### "Not authorized"
- Make sure you're using the correct token
- Token format: `Bearer YOUR_TOKEN`

### "User already exists"
- Use a different email
- Or login with existing credentials

### "Product not found"
- Create a product first using admin endpoint
- Use the correct product ID

---

**Happy Testing!** 🚀
