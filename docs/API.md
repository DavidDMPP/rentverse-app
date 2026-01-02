# 📚 RentVerse API Documentation

## Base URLs

| Service | URL | Description |
|---------|-----|-------------|
| Core API | `https://rentverse-api.daviddmpp.my.id/api/v1` | Main backend API |
| Mobile API | `https://rentverse-api.daviddmpp.my.id/api/v1/m` | Mobile-optimized endpoints |
| AI Service | `https://rentverse-ai.daviddmpp.my.id` | AI prediction service |

---

## 🔐 Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "phone": "089514787137",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

**Roles:**
- `USER` - Tenant (can browse and book properties)
- `ADMIN` - Provider (can list and manage properties)

---

## 🏠 Properties

### Get All Properties

```http
GET /api/v1/m/properties
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| city | string | Filter by city |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| bedrooms | number | Number of bedrooms |
| propertyType | string | Property type code |

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "title": "Modern Apartment",
        "description": "Beautiful apartment...",
        "address": "123 Main St",
        "city": "Kuala Lumpur",
        "state": "Kuala Lumpur",
        "price": "2500",
        "currencyCode": "MYR",
        "bedrooms": 2,
        "bathrooms": 1,
        "areaSqm": 85,
        "furnished": true,
        "isAvailable": true,
        "images": ["url1", "url2"],
        "status": "APPROVED",
        "propertyType": {
          "code": "APARTMENT",
          "name": "Apartment"
        },
        "owner": {
          "id": "uuid",
          "firstName": "Owner",
          "lastName": "Name"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Get Property by ID

```http
GET /api/v1/m/properties/:id
Authorization: Bearer <token>
```

### Create Property (Provider Only)

```http
POST /api/v1/m/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Modern Apartment",
  "description": "Beautiful apartment with city view",
  "address": "123 Main Street",
  "city": "Kuala Lumpur",
  "state": "Kuala Lumpur",
  "zipCode": "50000",
  "country": "MY",
  "price": 2500,
  "bedrooms": 2,
  "bathrooms": 1,
  "areaSqm": 85,
  "furnished": true,
  "propertyTypeId": "uuid",
  "images": ["url1", "url2", "url3"]
}
```

### Update Property

```http
PUT /api/v1/m/properties/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 2800
}
```

### Delete Property

```http
DELETE /api/v1/m/properties/:id
Authorization: Bearer <token>
```

---

## 📅 Bookings

### Get Bookings

```http
GET /api/v1/m/bookings
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | `tenant` or `owner` |
| status | string | `PENDING`, `APPROVED`, `ACTIVE`, `REJECTED`, `CANCELLED` |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "startDate": "2026-01-01T00:00:00.000Z",
        "endDate": "2026-02-01T00:00:00.000Z",
        "rentAmount": "20000",
        "currencyCode": "MYR",
        "status": "ACTIVE",
        "notes": "Booking notes",
        "property": {
          "id": "uuid",
          "title": "Property Title",
          "city": "Kuala Lumpur",
          "images": ["url"]
        },
        "tenant": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "089514787137"
        },
        "landlord": {
          "id": "uuid",
          "firstName": "Owner",
          "lastName": "Name",
          "email": "owner@example.com",
          "phone": "089514787138"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Create Booking

```http
POST /api/v1/m/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "uuid",
  "startDate": "2026-01-01",
  "endDate": "2026-02-01",
  "message": "I'm interested in renting this property"
}
```

### Approve Booking (Provider Only)

```http
POST /api/v1/m/bookings/:id/approve
Authorization: Bearer <token>
```

### Reject Booking (Provider Only)

```http
POST /api/v1/m/bookings/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Property is no longer available"
}
```

### Cancel Booking

```http
POST /api/v1/m/bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Change of plans"
}
```

---

## 🤖 AI Service

### Price Prediction

```http
POST /api/v1/classify/price
Content-Type: application/json

{
  "property_type": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 85,
  "furnished": "Yes",
  "location": "Kuala Lumpur"
}
```

**Property Types:**
- `Apartment`
- `House`
- `Condominium`
- `Studio`
- `Townhouse`

**Furnished Options:**
- `Yes`
- `Partially`
- `No`

**Response:**
```json
{
  "predicted_price": 2500,
  "price_range": {
    "min": 2200,
    "max": 2800
  },
  "currency": "MYR"
}
```

### Listing Approval

```http
POST /api/v1/classify/approval
Content-Type: application/json

{
  "property_type": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 85,
  "furnished": "Yes",
  "location": "Kuala Lumpur",
  "asking_price": 2500
}
```

---

## 👤 Users

### Get Current User Profile

```http
GET /api/v1/m/users/profile
Authorization: Bearer <token>
```

### Update Profile

```http
PUT /api/v1/m/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "089514787137"
}
```

---

## 🏷️ Property Types

### Get All Property Types

```http
GET /api/v1/m/property-types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "APARTMENT",
      "name": "Apartment",
      "description": "Multi-unit residential building",
      "icon": "🏢",
      "isActive": true
    },
    {
      "id": "uuid",
      "code": "HOUSE",
      "name": "House",
      "description": "Standalone residential property",
      "icon": "🏠",
      "isActive": true
    }
  ]
}
```

---

## ❤️ Favorites

### Get Favorites

```http
GET /api/v1/m/users/favorites
Authorization: Bearer <token>
```

### Add to Favorites

```http
POST /api/v1/m/users/favorites/:propertyId
Authorization: Bearer <token>
```

### Remove from Favorites

```http
DELETE /api/v1/m/users/favorites/:propertyId
Authorization: Bearer <token>
```

---

## 🔍 Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## 🏥 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-02T10:00:00.000Z",
  "database": "Connected",
  "uptime": 3600,
  "environment": "development"
}
```
