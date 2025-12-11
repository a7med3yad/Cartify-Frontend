# Cartify Merchant Dashboard - Documentation

## Overview
This is a production-ready merchant dashboard for the Cartify e-commerce platform. It's built with pure vanilla HTML, CSS, and JavaScript (no frameworks) and integrates with the Cartify ASP.NET Core backend API.

## Files Created
1. **merchhome.html** - Main HTML structure
2. **merchant.css** - Complete styling with modern design
3. **merchant.js** - Full JavaScript implementation with API integration

## Features Implemented

### 1. Authentication
- JWT token-based authentication
- Automatic redirect to login if unauthorized
- Token stored in `localStorage` as `authToken`
- User data stored in `localStorage` as `userData`

### 2. Dashboard Section
- **KPI Cards:**
  - Total Revenue (calculated from orders)
  - Total Orders count
  - Total Products count
- **Recent Orders Table:**
  - Shows last 10 orders
  - Displays order ID, customer, status, amount, and date

### 3. Products Management
- **Product List:**
  - View all products for the merchant
  - Shows product name, category, variants count, total stock
- **Add Product:**
  - Modal form to create new products
  - Required fields: Name, Category/Type, Store ID
  - Optional: Description
- **Manage Variants (ProductDetails):**
  - Click "Manage Variants" to see all variants of a product
  - Each variant has: Serial Number, Price, Description, Quantity Available

### 4. Product Variants (ProductDetails)
- **Add Variant:**
  - Create new product variants with unique serial numbers
  - Set price, quantity, and description
- **View Variants:**
  - List all variants for a product
  - See stock levels and pricing
- **Delete Variant:**
  - Remove variants with confirmation

### 5. Attributes & Measure Units
- **Manage Attributes:**
  - Add specifications to variants (e.g., Storage: 128 GB, RAM: 8 GB)
  - Select from available attributes (fetched from backend)
  - Select measure units (GB, GHz, mAh, etc.)
  - Add custom values
- **View Attributes:**
  - See all attributes assigned to a variant

### 6. Orders Management
- **Orders List:**
  - View all orders for the merchant's store
  - Filter by status (Pending, Processing, Shipped, Delivered, Cancelled)
- **Order Details:**
  - View detailed order information (modal)
- **Update Order Status:**
  - Change order status via API

### 7. UI/UX Features
- **Modern Design:**
  - Clean, professional interface
  - Gradient sidebar with smooth animations
  - Responsive layout
  - Hover effects and transitions
- **Toast Notifications:**
  - Success/error messages for all actions
- **Modal System:**
  - Multiple modals for different workflows
  - Click outside to close
  - Smooth animations
- **Loading States:**
  - Loading indicators while fetching data
  - Empty states for tables with no data

## API Endpoints Used

### Authentication
- Uses `Authorization: Bearer <token>` header for all protected routes

### Products
- `GET /api/merchant/products/merchant/{merchantId}` - Get all products by merchant
- `POST /api/merchant/products` - Create new product (FromForm)
- `GET /api/merchant/products/{productId}` - Get product by ID
- `DELETE /api/merchant/products/{productId}` - Delete product

### Product Details (Variants)
- `POST /api/merchant/products/details` - Create new variant
- `PUT /api/merchant/products/details` - Update variant
- `GET /api/merchant/products/details/{productDetailId}` - Get variant details
- `DELETE /api/merchant/products/details/{productDetailId}` - Delete variant

### Attributes & Measures
- `GET /api/merchant/attributes-measures/attributes` - Get all attributes
- `GET /api/merchant/attributes-measures/measures` - Get all measure units
- `POST /api/merchant/attributes-measures/attributes` - Add new attribute
- `POST /api/merchant/attributes-measures/measures` - Add new measure

### Orders
- `GET /api/merchant/orders/filter?storeId={id}&status={status}` - Get filtered orders
- `PUT /api/merchant/orders/{orderId}/status` - Update order status

### Categories
- `GET /api/Category` - Get all categories (for product creation)

## Domain Model

### Product
Represents the base product family (e.g., "Realme 8")
```json
{
  "ProductName": "Realme 8",
  "ProductDescription": "Latest smartphone",
  "TypeId": 1,
  "StoreId": 5
}
```

### ProductDetails (Variant)
Represents a specific variant with unique attributes
```json
{
  "productId": 1,
  "serialNumber": "R8-128-8-001",
  "price": 299.99,
  "description": "128GB variant",
  "quantityAvailable": 50,
  "attributes": [...]
}
```

### ProductAttributeDto
Links attributes and measure units to a variant
```json
{
  "attributeId": 1,
  "measureUnitId": 2,
  "value": "128"
}
```

## How to Extend

### Adding a New Section
1. Add a nav item in `merchhome.html`:
```html
<button class="nav-item" data-section="newsection">
    <svg class="nav-icon">...</svg>
    <span>New Section</span>
</button>
```

2. Add the section content:
```html
<section class="content-section" id="newsection-section">
    <!-- Your content -->
</section>
```

3. Add the handler in `merchant.js`:
```javascript
case 'newsection':
    loadNewSection();
    break;
```

### Adding a New API Call
```javascript
async function myNewFunction() {
    try {
        const data = await fetchAPI('/your/endpoint', {
            method: 'POST',
            body: JSON.stringify({ ... })
        });
        showToast('Success!', 3000);
    } catch (error) {
        console.error('Error:', error);
        showToast('Error: ' + error.message, 3000);
    }
}
```

## Known Issues & Future Enhancements

### Current Limitations
1. **Attribute Assignment:** The backend endpoint for assigning attributes to variants may need verification
2. **Inventory Serial Numbers:** Currently integrated into ProductDetails; separate inventory tracking can be added if backend supports it
3. **Image Upload:** Product image upload endpoints exist but UI not yet implemented
4. **Pagination:** Currently loads first 100 items; full pagination can be added
5. **Search:** Product search functionality can be enhanced

### Recommended Enhancements
1. Add image upload UI for products
2. Implement full pagination controls
3. Add product search in the Products section
4. Add date range filter for orders
5. Add export functionality (CSV/PDF) for orders
6. Add product analytics/statistics
7. Implement real-time order notifications
8. Add bulk operations for products

## Configuration

### Environment Variables
Update these in `merchant.js` if needed:
```javascript
const API_BASE_URL = 'https://cartify.runasp.net/api';
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
```

### User Data Structure Expected
```javascript
{
  "id": "merchant-uuid",
  "userName": "merchantname",
  "storeName": "My Store",
  "storeId": 5,
  "email": "merchant@example.com"
}
```

## Testing Checklist

- [ ] Login with merchant account
- [ ] Dashboard loads KPIs correctly
- [ ] Can create a new product
- [ ] Can add variants to a product
- [ ] Can manage attributes for variants
- [ ] Orders list displays
- [ ] Can filter orders by status
- [ ] Can update order status
- [ ] Toast notifications appear
- [ ] Modals open and close properly
- [ ] Logout works correctly

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Dependencies
- **None** - Pure vanilla JavaScript, no external libraries

## Performance Notes
- All API calls use async/await with proper error handling
- Loading states prevent multiple simultaneous requests
- Modals use CSS animations for smooth UX
- Minimal DOM manipulation for better performance

## Security Notes
- JWT tokens are stored in localStorage (secure over HTTPS)
- All API requests include Authorization header
- 401 responses automatically redirect to login
- CORS handled by backend

## Support
For issues or questions, contact the backend team or check the Swagger documentation at:
https://cartify.runasp.net/swagger/index.html

---

**Built with ❤️ for Cartify - Production Multi-Vendor E-commerce Platform**
