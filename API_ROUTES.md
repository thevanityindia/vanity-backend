# API Routes Quick Reference

## Base URL: `/api`

---

## 📦 PUBLIC ROUTES (No Authentication Required)

### Products
```
GET    /products                    # Get all products (with filters)
GET    /products/:id                # Get single product
```

### Categories
```
GET    /categories                  # Get all categories
```

### Authentication
```
POST   /auth/register               # Register new user
POST   /auth/login                  # Login user
```

---

## 👤 USER ROUTES (Requires User Authentication)

### Profile
```
GET    /users/profile               # Get user profile
PUT    /users/profile               # Update user profile
```

### Orders
```
GET    /orders/my-orders            # Get user's orders
POST   /orders                      # Create new order
GET    /orders/:id                  # Get single order details
```

### Cart
```
GET    /cart                        # Get user cart
POST   /cart                        # Add item to cart
PUT    /cart/:itemId                # Update cart item quantity
DELETE /cart/:itemId                # Remove item from cart
DELETE /cart                        # Clear entire cart
```

### Wishlist
```
GET    /wishlist                    # Get user wishlist
POST   /wishlist                    # Add to wishlist
DELETE /wishlist/:productId         # Remove from wishlist
```

---

## 🔐 ADMIN ROUTES (Requires Admin Authentication)

### Users Management
```
GET    /admin/users                 # Get all users (with filters)
GET    /admin/users/:id             # Get single user details
PUT    /admin/users/:id             # Update user details
PUT    /admin/users/:id/status      # Update user status (active/suspended)
DELETE /admin/users/:id             # Delete user
```

### Products Management
```
GET    /admin/products              # Get all products (admin view)
POST   /admin/products              # Create new product
PUT    /admin/products/:id          # Update product
DELETE /admin/products/:id          # Delete product
PUT    /admin/products/:id/publish  # Toggle product public/private status
```

### Inventory Management
```
GET    /admin/inventory             # Get all inventory items
GET    /admin/inventory/:id         # Get single inventory item
PUT    /admin/inventory/:id         # Update inventory
POST   /admin/inventory/adjust      # Adjust stock levels
GET    /admin/inventory/alerts      # Get low stock alerts
```

### Categories Management
```
GET    /admin/categories            # Get all categories (admin view)
POST   /admin/categories            # Create new category
PUT    /admin/categories/:id        # Update category
DELETE /admin/categories/:id        # Delete category
PUT    /admin/categories/:id/status # Toggle category active/inactive
```

### Orders Management
```
GET    /admin/orders                # Get all orders (with filters)
GET    /admin/orders/:id            # Get single order details
PUT    /admin/orders/:id            # Update order
PUT    /admin/orders/:id/status     # Update order status
DELETE /admin/orders/:id            # Cancel/delete order
GET    /admin/orders/stats          # Get order statistics
```

### Notifications
```
GET    /admin/notifications         # Get all notifications
POST   /admin/notifications         # Create notification
PUT    /admin/notifications/:id/read # Mark as read
DELETE /admin/notifications/:id     # Delete notification
DELETE /admin/notifications         # Clear all notifications
```

### Analytics & Reports
```
GET    /admin/analytics/dashboard   # Get dashboard stats
GET    /admin/analytics/sales       # Get sales analytics
GET    /admin/analytics/products    # Get product analytics
GET    /admin/analytics/users       # Get user analytics
```

---

## 📝 QUERY PARAMETERS REFERENCE

### Products Filtering
```
?category=Necklaces              # Filter by category
?brand=Fashion+Jewelry           # Filter by brand
?minPrice=100                    # Minimum price
?maxPrice=1000                   # Maximum price
?search=crystal                  # Search term
?limit=10                        # Limit results
?exclude=507f1f77bcf86cd799439011 # Exclude product ID
?isPublic=true                   # Filter by public status
?sort=price_asc                  # Sort (price_asc, price_desc, name_asc, name_desc, newest)
?page=1                          # Pagination page number
```

### Users Filtering (Admin)
```
?status=active                   # Filter by status (active, suspended)
?search=john                     # Search by name or email
?role=user                       # Filter by role (user, admin)
?verified=true                   # Filter by email verification
?page=1                          # Pagination
?limit=20                        # Results per page
```

### Orders Filtering (Admin)
```
?status=pending                  # Filter by status
?startDate=2024-01-01           # From date
?endDate=2024-01-31             # To date
?userId=507f1f77bcf86cd799439011 # Filter by user
?paymentStatus=completed         # Filter by payment status
?page=1                          # Pagination
```

### Inventory Filtering (Admin)
```
?status=low_stock               # Filter by status (in_stock, low_stock, out_of_stock)
?category=Makeup                # Filter by category
?search=blush                   # Search by name or SKU
```

---

## 🔒 AUTHENTICATION HEADERS

### User/Admin Requests
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 📤 COMMON REQUEST BODY EXAMPLES

### Register User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+91 98765 43210"
}
```

### Login
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Create Product (Admin)
```json
{
  "name": "Crystal Necklace",
  "brand": "Fashion Jewelry",
  "price": 599,
  "originalPrice": 799,
  "category": "Necklaces",
  "description": "Beautiful crystal necklace",
  "image": "https://example.com/image.jpg",
  "images": ["url1", "url2"],
  "stock": 50,
  "isPublic": true,
  "specifications": {
    "material": "Sterling Silver",
    "weight": "15g"
  }
}
```

### Create Order
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
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

### Add to Cart
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

### Update Order Status (Admin)
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

### Adjust Inventory (Admin)
```json
{
  "type": "add",
  "quantity": 50,
  "reason": "Restock",
  "notes": "New shipment received"
}
```

---

## ⚠️ COMMON HTTP STATUS CODES

```
200 - OK                         # Successful GET, PUT, DELETE
201 - Created                    # Successful POST (resource created)
400 - Bad Request                # Invalid request data
401 - Unauthorized               # Missing or invalid token
403 - Forbidden                  # Insufficient permissions
404 - Not Found                  # Resource not found
409 - Conflict                   # Duplicate resource (e.g., email exists)
422 - Unprocessable Entity       # Validation error
500 - Internal Server Error      # Server error
```

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 - Core Functionality
1. ✅ Authentication (register, login)
2. ✅ Products (get all, get single)
3. ✅ Categories (get all)
4. ✅ User profile (get, update)

### Phase 2 - E-commerce Features
5. ✅ Cart operations
6. ✅ Wishlist operations
7. ✅ Order creation
8. ✅ Order history

### Phase 3 - Admin Features
9. ✅ Admin products management
10. ✅ Admin users management
11. ✅ Admin orders management
12. ✅ Admin inventory management

### Phase 4 - Advanced Features
13. ✅ Admin categories management
14. ✅ Admin notifications
15. ✅ Analytics & reports
16. ✅ Search & filtering

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
