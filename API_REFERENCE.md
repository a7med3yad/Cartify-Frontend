# Cartify Merchant API Quick Reference

Base URL: `https://cartify.runasp.net/api`

## Authentication
All merchant endpoints require JWT Bearer token:
```javascript
headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 📦 Products

### Get Products by Merchant
```
GET /merchant/products/merchant/{merchantId}?page=1&pageSize=10
```

### Get Product by ID
```
GET /merchant/products/{productId}
```

### Create Product
```
POST /merchant/products
Content-Type: multipart/form-data

Body (FormData):
{
  "ProductName": "string" (required),
  "ProductDescription": "string" (optional),
  "TypeId": number (required),
  "StoreId": number (required)
}
```

### Update Product
```
PUT /merchant/products/{productId}
Content-Type: multipart/form-data
```

### Delete Product
```
DELETE /merchant/products/{productId}
```

### Add Product Images
```
POST /merchant/products/{productId}/images
Content-Type: multipart/form-data

Body:
{
  "images": [File, File, ...]
}
```

### Search Products
```
GET /merchant/products/search?name=searchterm&page=1&pageSize=10
```

### Get Products by Type
```
GET /merchant/products/type/{typeId}?page=1&pageSize=10
```

---

## 🔧 Product Details (Variants)

### Get Product Detail
```
GET /merchant/products/details/{productDetailId}
```

### Create Product Detail
```
POST /merchant/products/details
Content-Type: application/json

Body:
{
  "productId": number (required),
  "serialNumber": "string" (required),
  "price": number (required, min: 0.01),
  "description": "string" (optional),
  "quantityAvailable": number (required, min: 0),
  "attributes": [
    {
      "attributeId": number (required),
      "measureUnitId": number (required)
    }
  ]
}
```

### Update Product Detail
```
PUT /merchant/products/details
Content-Type: application/json

Body:
{
  "productDetailId": number,
  "serialNumber": "string",
  "price": number,
  "description": "string",
  "quantityAvailable": number
}
```

### Delete Product Detail
```
DELETE /merchant/products/details/{productDetailId}
```

---

## 📊 Attributes & Measure Units

### Get All Attributes
```
GET /merchant/attributes-measures/attributes

Response: ["Storage", "RAM", "Processor", "Color", ...]
```

### Add New Attribute
```
POST /merchant/attributes-measures/attributes
Content-Type: application/json

Body:
{
  "name": "string" (required, max: 100)
}
```

### Check Attribute Exists
```
GET /merchant/attributes-measures/attributes/check?name=Storage
```

### Get All Measure Units
```
GET /merchant/attributes-measures/measures

Response: ["GB", "GHz", "mAh", "MHz", ...]
```

### Add New Measure Unit
```
POST /merchant/attributes-measures/measures
Content-Type: application/json

Body:
{
  "name": "string" (required, max: 100)
}
```

### Check Measure Exists
```
GET /merchant/attributes-measures/measures/check?name=GB
```

---

## 🛍️ Orders

### Get Orders (Filtered)
```
GET /merchant/orders/filter?storeId={id}&status={status}&startDate={date}&endDate={date}&page=1&pageSize=10

Query Parameters:
- storeId: number (required)
- status: string (optional) - "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
- startDate: datetime (optional)
- endDate: datetime (optional)
- page: number (default: 1)
- pageSize: number (default: 10)
```

### Update Order Status
```
PUT /merchant/orders/{orderId}/status
Content-Type: application/json

Body:
{
  "status": "string" (required)
}

Valid statuses:
- "Pending"
- "Processing"
- "Shipped"
- "Delivered"
- "Cancelled"
```

---

## 👥 Customers

### Get Customer by User ID
```
GET /merchant/customers/{userId}
```

### Get Customers by Store
```
GET /merchant/customers/store/{storeId}?page=1&pageSize=10
```

### Get Customer Count by Store
```
GET /merchant/customers/store/{storeId}/count
```

---

## 📁 Categories

### Get All Categories
```
GET /Category?page=1&pageSize=10
```

### Get Category by ID
```
GET /Category/{categoryId}
```

### Create Category
```
POST /Category
Content-Type: multipart/form-data

Body:
{
  "CategoryName": "string" (required),
  "CategoryDescription": "string" (optional),
  "Image": File (optional)
}
```

### Update Category
```
PUT /Category/{categoryId}
Content-Type: multipart/form-data
```

### Delete Category
```
DELETE /Category/{categoryId}
```

---

## 📂 SubCategories

### Get SubCategories by Category
```
GET /Category/{categoryId}/subcategories
```

### Create SubCategory
```
POST /Category/{categoryId}/subcategories
Content-Type: multipart/form-data
```

### Update SubCategory
```
PUT /Category/subcategories/{subCategoryId}
```

### Delete SubCategory
```
DELETE /Category/subcategories/{subCategoryId}
```

### Get SubCategory by ID
```
GET /Category/subcategories/{subCategoryId}
```

---

## 🔐 User Profile

### Get Profile
```
GET /Profile/{userId}
```

### Update Profile
```
PUT /Profile/{userId}
Content-Type: application/json

Body:
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "telephone": "string",
  ...
}
```

---

## 📝 Response Structure Examples

### Successful Response
```json
{
  "message": "Product created successfully",
  "success": true
}
```

### Paginated Response
```json
{
  "data": [...],
  "totalCount": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10
}
```

### Error Response
```json
{
  "message": "Invalid input data",
  "errors": {
    "ProductName": ["The ProductName field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

---

## 🎯 Common Query Parameters

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 100)
- `status`: Filter by status
- `name`: Search by name
- `startDate`: Filter from date
- `endDate`: Filter to date

---

## 💡 Tips

1. **Always include Authorization header** for merchant endpoints
2. **Use FormData** for endpoints that accept files (multipart/form-data)
3. **Use JSON** for regular data endpoints (application/json)
4. **Check 401 responses** and redirect to login
5. **Validate input** on the client side before sending to API
6. **Handle pagination** for large datasets
7. **Show loading states** while API calls are in progress

---

## 🚀 JavaScript Examples

### Create Product
```javascript
const formData = new FormData();
formData.append('ProductName', 'iPhone 14');
formData.append('ProductDescription', 'Latest iPhone');
formData.append('TypeId', '3');
formData.append('StoreId', '5');

const response = await fetch('https://cartify.runasp.net/api/merchant/products', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### Create Variant
```javascript
const variant = {
    productId: 1,
    serialNumber: 'IP14-128-BLK-001',
    price: 999.99,
    description: '128GB Black',
    quantityAvailable: 50,
    attributes: [
        { attributeId: 1, measureUnitId: 2 }, // Storage: GB
        { attributeId: 3, measureUnitId: 2 }  // RAM: GB
    ]
};

const response = await fetch('https://cartify.runasp.net/api/merchant/products/details', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(variant)
});
```

### Update Order Status
```javascript
const response = await fetch(`https://cartify.runasp.net/api/merchant/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        status: 'Shipped'
    })
});
```

---

**For complete API documentation, visit:** https://cartify.runasp.net/swagger/index.html
