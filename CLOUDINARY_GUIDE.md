# Cloudinary Image Upload Integration Guide

## 🎯 Overview

The Vanity backend now supports image uploads using **Cloudinary** - a powerful cloud-based image and video management service with automatic optimization, transformations, and global CDN delivery.

---

## 🚀 Quick Start

### Step 1: Create Cloudinary Account

1. **Sign up for free:** https://cloudinary.com/users/register/free
2. **Verify your email**
3. **Login to dashboard:** https://cloudinary.com/console

### Step 2: Get Your Credentials

Once logged in to your Cloudinary dashboard:

1. Go to **Dashboard** (home page)
2. You'll see your credentials in the **Account Details** section:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### Step 3: Configure Environment Variables

Update your `.env` file in the backend directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
```

### Step 4: Restart Server

```bash
# Stop the server (Ctrl+C in terminal)
# Start again
npm run dev
```

---

## 📡 API Endpoints

### 1. Upload Single Image

**Endpoint:** `POST /api/upload/image`

**Authentication:** Required (Admin only)

**Content-Type:** `multipart/form-data`

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "public_id": "thevanity/products/abc123xyz",
    "url": "https://res.cloudinary.com/dxyz123abc/image/upload/v1234567890/thevanity/products/abc123xyz.jpg",
    "thumbnail_url": "https://res.cloudinary.com/dxyz123abc/image/upload/w_200,h_200,c_fill/v1234567890/thevanity/products/abc123xyz.jpg",
    "width": 1000,
    "height": 1000,
    "format": "jpg",
    "size": 245678
  }
}
```

### 2. Upload Multiple Images

**Endpoint:** `POST /api/upload/images`

**Authentication:** Required (Admin only)

**Max Files:** 10 images per request

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "data": [
    {
      "public_id": "thevanity/products/abc123",
      "url": "https://res.cloudinary.com/.../abc123.jpg",
      "thumbnail_url": "https://res.cloudinary.com/.../w_200,h_200,c_fill/.../abc123.jpg",
      "width": 1000,
      "height": 1000,
      "format": "jpg",
      "size": 245678
    },
    // ... more images
  ]
}
```

### 3. Upload Product Images (Main + Gallery)

**Endpoint:** `POST /api/upload/product-images`

**Authentication:** Required (Admin only)

**Fields:**
- `mainImage` - Single main product image
- `galleryImages` - Up to 5 gallery images

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/product-images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "mainImage=@/path/to/main.jpg" \
  -F "galleryImages=@/path/to/gallery1.jpg" \
  -F "galleryImages=@/path/to/gallery2.jpg" \
  -F "galleryImages=@/path/to/gallery3.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Product images uploaded successfully",
  "data": {
    "mainImage": {
      "public_id": "thevanity/products/main_abc123",
      "url": "https://res.cloudinary.com/.../main_abc123.jpg",
      "thumbnail_url": "https://res.cloudinary.com/.../w_200,h_200,c_fill/.../main_abc123.jpg"
    },
    "galleryImages": [
      {
        "public_id": "thevanity/products/gallery_def456",
        "url": "https://res.cloudinary.com/.../gallery_def456.jpg",
        "thumbnail_url": "https://res.cloudinary.com/.../w_200,h_200,c_fill/.../gallery_def456.jpg"
      },
      // ... more gallery images
    ]
  }
}
```

### 4. Delete Image

**Endpoint:** `DELETE /api/upload/image`

**Authentication:** Required (Admin only)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"public_id": "thevanity/products/abc123xyz"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 💻 Frontend Integration Examples

### React - Single Image Upload

```javascript
import { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'http://localhost:5000/api/upload/image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImageUrl(response.data.data.url);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && (
        <div>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
          <p>URL: {imageUrl}</p>
        </div>
      )}
    </div>
  );
};
```

### React - Product Form with Main + Gallery Images

```javascript
import { useState } from 'react';
import axios from 'axios';

const ProductForm = () => {
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [productData, setProductData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    image: '',
    images: []
  });

  const handleProductImageUpload = async () => {
    if (!mainImage) {
      alert('Please select a main image');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('mainImage', mainImage);
    
    galleryImages.forEach(file => {
      formData.append('galleryImages', file);
    });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'http://localhost:5000/api/upload/product-images',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const { mainImage: main, galleryImages: gallery } = response.data.data;

      setProductData(prev => ({
        ...prev,
        image: main.url,
        images: gallery.map(img => img.url)
      }));

      alert('Images uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/admin/products',
        productData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert('Product created successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create product');
    }
  };

  return (
    <div>
      <h2>Create Product</h2>
      
      {/* Product Details */}
      <input
        type="text"
        placeholder="Product Name"
        value={productData.name}
        onChange={(e) => setProductData({...productData, name: e.target.value})}
      />
      
      {/* Main Image */}
      <div>
        <label>Main Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMainImage(e.target.files[0])}
        />
      </div>

      {/* Gallery Images */}
      <div>
        <label>Gallery Images (up to 5):</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setGalleryImages(Array.from(e.target.files).slice(0, 5))}
        />
      </div>

      <button onClick={handleProductImageUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Images'}
      </button>

      {productData.image && (
        <div>
          <h3>Uploaded Images:</h3>
          <img src={productData.image} alt="Main" style={{ maxWidth: '200px' }} />
          <div>
            {productData.images.map((url, idx) => (
              <img key={idx} src={url} alt={`Gallery ${idx}`} style={{ maxWidth: '100px', margin: '5px' }} />
            ))}
          </div>
        </div>
      )}

      <button onClick={handleCreateProduct} disabled={!productData.image}>
        Create Product
      </button>
    </div>
  );
};
```

---

## ⚙️ Image Transformations

Cloudinary automatically optimizes images with these transformations:

- **Max dimensions:** 1000x1000 pixels
- **Quality:** Auto (best quality/size ratio)
- **Format:** Auto (WebP for supported browsers)
- **Thumbnail:** 200x200 pixels, cropped to fill

### Custom Transformations

You can request different sizes by modifying the URL:

```javascript
// Original URL
const originalUrl = "https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg";

// 500x500 thumbnail
const thumb500 = originalUrl.replace('/upload/', '/upload/w_500,h_500,c_fill/');

// 300 width, auto height
const width300 = originalUrl.replace('/upload/', '/upload/w_300/');

// Square crop
const square = originalUrl.replace('/upload/', '/upload/w_400,h_400,c_crop/');
```

---

## 📋 File Restrictions

- **Allowed formats:** JPEG, JPG, PNG, GIF, WebP
- **Max file size:** 10MB per image
- **Max files per request:**
  - Single upload: 1 image
  - Multiple upload: 10 images
  - Product images: 1 main + 5 gallery

---

## 🔒 Security Features

- ✅ Admin authentication required
- ✅ File type validation
- ✅ File size limits
- ✅ Secure token-based uploads
- ✅ Cloudinary CDN protection
- ✅ Automatic image optimization

---

## 💰 Cloudinary Pricing

**Free Tier Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

**Perfect for:**
- Development
- Small to medium e-commerce sites
- Testing

**Paid Plans:** Start at $99/month for more storage and bandwidth

Check pricing: https://cloudinary.com/pricing

---

## 🐛 Troubleshooting

### "Cloudinary credentials not configured"
- Make sure `.env` has all three Cloudinary variables
- Restart the server after updating `.env`
- Check for typos in variable names

### "Upload failed"
- Verify your Cloudinary credentials are correct
- Check your Cloudinary dashboard for quota limits
- Ensure file is under 10MB

### "Only image files are allowed"
- Make sure file is JPEG, PNG, GIF, or WebP
- Check file extension

### "File too large"
- Compress image before uploading
- Max size is 10MB

---

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

---

## ✅ Quick Test

```bash
# 1. Get admin token
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thevanity.com","password":"admin123"}'

# 2. Upload test image
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@./test-image.jpg"

# 3. Use the returned URL in product creation
curl -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "brand": "Test Brand",
    "price": 599,
    "image": "YOUR_CLOUDINARY_URL_HERE",
    "category": "Test",
    "description": "Test product",
    "stock": 10
  }'
```

---

**Last Updated:** January 24, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready to Use
