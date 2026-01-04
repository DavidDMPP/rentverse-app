# 🏠 RentVerse - Property Rental Platform

<p align="center">
  <img src="assets/icon.png" alt="RentVerse Logo" width="120" height="120">
</p>

<p align="center">
  <strong>A modern mobile application connecting tenants with property providers</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat-square&logo=react" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-54.0-000020?style=flat-square&logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=flat-square" alt="Platform">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Integration](#-api-integration)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**RentVerse** is a comprehensive property rental platform that bridges the gap between property owners (providers) and tenants. The application provides a seamless experience for browsing, booking, and managing rental properties with AI-powered price estimation features.

### Key Highlights

- 🏘️ **Dual User Roles**: Separate interfaces for Tenants and Property Providers
- 🤖 **AI-Powered**: Smart rental price estimation using machine learning
- 📱 **Cross-Platform**: Works on both Android and iOS devices
- 🔒 **Secure**: JWT-based authentication with secure token storage
- 🌐 **Cloud-Ready**: Deployed with Cloudflare Tunnel for reliable access

---

## ✨ Features

### For Tenants
| Feature | Description |
|---------|-------------|
| 🔍 **Property Search** | Search properties by location, price, bedrooms, and more |
| 🏠 **Property Details** | View comprehensive property information with images |
| 📅 **Booking System** | Book properties with date selection and instant confirmation |
| 📋 **Booking Details** | View detailed booking information with tenant/landlord contact |
| 📊 **Booking Status** | Real-time status tracking (Pending → Active → Completed) |
| ❤️ **Favorites** | Save properties to favorites for quick access |
| 📋 **Booking History** | Track all past and current bookings with filtering |
| 👤 **Profile Management** | Update personal information and preferences |

### For Property Providers
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time overview with 7-day booking activity charts |
| 💰 **Daily Income** | Live income tracking from active bookings |
| ➕ **Add Listings** | Create new property listings with dark theme UI |
| ✏️ **Edit Listings** | Update property details with success notifications |
| 📋 **Booking Management** | Approve, reject, or manage booking requests with filters |
| 🤖 **AI Price Estimator** | Enhanced 2x2 grid layout with colored property type icons |
| 📈 **Analytics** | View property performance metrics and booking trends |

### AI Features
- **Smart Price Prediction**: ML-based rental price estimation
- **Enhanced UI**: 2x2 grid layout with colored property type icons
- **Confidence Scoring**: Dynamic confidence levels (75%-92%)
- **Market Analysis**: Location-based price recommendations

### Recent Updates (Latest Version)
- ✨ **New BookingDetailScreen**: Comprehensive booking information with contact details
- 🎨 **Enhanced UI/UX**: Dark theme consistency across all provider screens
- 🐛 **Bug Fixes**: Fixed daily income calculation and booking status logic
- 📊 **Real Data Charts**: Provider dashboard now shows actual 7-day booking activity
- 🔧 **Improved Validation**: Better form validation and error handling
- 📱 **Better Navigation**: Smooth transitions between screens with proper status updates

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | 54.0 | Development and build toolchain |
| TypeScript | 5.9 | Type-safe JavaScript |
| React Navigation | 7.x | Navigation and routing |
| Axios | 1.13 | HTTP client for API calls |
| React Hook Form | 7.69 | Form handling and validation |

### Backend Services
| Service | Technology | Purpose |
|---------|------------|---------|
| Core API | Node.js + Express | Main backend service |
| AI Service | Python + FastAPI | ML price prediction |
| Database | PostgreSQL (Neon) | Cloud database |
| Tunnel | Cloudflare | Secure public access |

### Infrastructure
```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Expo)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Tunnel                          │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ rentverse-api.      │  │ rentverse-ai.       │          │
│  │ daviddmpp.my.id     │  │ daviddmpp.my.id     │          │
│  └──────────┬──────────┘  └──────────┬──────────┘          │
└─────────────┼────────────────────────┼──────────────────────┘
              │                        │
              ▼                        ▼
┌─────────────────────────┐  ┌─────────────────────┐
│   Core API (Port 3000)  │  │  AI Service (8000)  │
│   Node.js + Express     │  │  Python + FastAPI   │
└──────────┬──────────────┘  └─────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   PostgreSQL (Neon)     │
│   Cloud Database        │
└─────────────────────────┘
```

---

## 🏗️ Architecture

### Application Architecture
```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── navigation/         # Navigation configuration
├── screens/            # Screen components
├── services/           # API service layers
├── theme/              # Styling and theming
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### State Management
- **AuthContext**: User authentication state
- **ThemeContext**: App theming (dark/light mode)
- **Local State**: Component-level state with useState/useReducer

### Navigation Flow
```
App
├── SplashScreen
├── Auth Stack (Unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
│
├── Tenant Tab Navigator (Role: USER)
│   ├── Home Tab
│   │   ├── TenantHomeScreen
│   │   ├── PropertyDetailScreen
│   │   ├── BookingScreen
│   │   └── BookingDetailScreen        # 🆕 New detailed view
│   ├── Search Tab
│   │   └── SearchScreen
│   ├── Saved Tab
│   │   └── SavedScreen
│   ├── Bookings Tab
│   │   └── TenantBookingsScreen
│   └── Profile Tab
│       └── ProfileScreen
│
└── Provider Tab Navigator (Role: ADMIN)
    ├── Dashboard Tab
    │   └── ProviderDashboardScreen
    ├── Listings Tab
    │   ├── ListingsScreen
    │   ├── AddListingScreen
    │   └── EditListingScreen
    ├── Bookings Tab
    │   └── BookingManagementScreen
    ├── AI Tools Tab
    │   └── AIPriceEstimatorScreen
    └── Profile Tab
        └── ProfileScreen
```

---

## 📁 Project Structure

```
rentverse-app/
├── 📱 App.tsx                    # App entry point
├── 📄 index.ts                   # Expo entry
├── 📦 package.json               # Dependencies
├── ⚙️ app.json                   # Expo configuration
├── 🔧 tsconfig.json              # TypeScript config
├── 🏗️ eas.json                   # EAS Build config
│
├── 📁 assets/                    # Static assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
│
├── 📁 src/
│   ├── 📁 components/            # Reusable components
│   │   ├── BookingCard.tsx       # 🔄 Enhanced status display
│   │   ├── PropertyCard.tsx      # Property listing card
│   │   ├── SearchBar.tsx         # Search input component
│   │   ├── CategoryFilter.tsx    # Filter chips
│   │   └── LoadingSpinner.tsx    # Loading indicator
│   │
│   ├── 📁 context/               # Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── ThemeContext.tsx      # Theme management
│   │
│   ├── 📁 navigation/            # Navigation setup
│   │   ├── AppNavigator.tsx      # Main navigator
│   │   ├── TenantTabNavigator.tsx
│   │   └── ProviderTabNavigator.tsx
│   │
│   ├── 📁 screens/               # Screen components
│   │   ├── 📁 auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── SplashScreen.tsx
│   │   │
│   │   ├── 📁 tenant/
│   │   │   ├── TenantHomeScreen.tsx
│   │   │   ├── PropertyDetailScreen.tsx
│   │   │   ├── BookingScreen.tsx
│   │   │   ├── BookingDetailScreen.tsx    # 🆕 Detailed booking view
│   │   │   ├── SearchScreen.tsx
│   │   │   ├── SavedScreen.tsx
│   │   │   └── TenantBookingsScreen.tsx
│   │   │
│   │   ├── 📁 provider/
│   │   │   ├── ProviderDashboardScreen.tsx  # 🔄 Enhanced with real data
│   │   │   ├── ListingsScreen.tsx
│   │   │   ├── AddListingScreen.tsx
│   │   │   ├── EditListingScreen.tsx        # 🔄 Dark theme + modals
│   │   │   ├── BookingManagementScreen.tsx  # 🔄 Fixed active filter
│   │   │   └── AIPriceEstimatorScreen.tsx   # 🔄 2x2 grid layout
│   │   │
│   │   └── 📁 common/
│   │       └── ProfileScreen.tsx
│   │
│   ├── 📁 services/              # API services
│   │   ├── api.ts                # Axios configuration
│   │   ├── authService.ts        # Authentication API
│   │   ├── propertyService.ts    # Property CRUD API
│   │   ├── bookingService.ts     # Booking API
│   │   └── aiService.ts          # AI prediction API
│   │
│   ├── 📁 theme/                 # Theming
│   │   └── index.ts              # Colors, spacing, fonts
│   │
│   ├── 📁 types/                 # TypeScript types
│   │   └── index.ts              # All type definitions
│   │
│   └── 📁 utils/                 # Utilities
│       └── formatting.ts         # Date, currency formatters
│
└── 📁 __tests__/                 # Test files
    └── services/
        └── *.test.ts
```

---

## 📝 Changelog

### Version 2.0.0 (Latest) - Major UI/UX Improvements
**Release Date**: January 2026

#### ✨ New Features
- **BookingDetailScreen**: Comprehensive booking information with tenant/landlord contact details
- **Enhanced Provider Dashboard**: Real-time 7-day booking activity charts with actual data
- **Dark Theme Consistency**: All provider screens now use consistent dark theme
- **Custom Modals**: Success/error modals for better user feedback

#### 🐛 Bug Fixes
- Fixed daily income calculation showing correct amounts (RM 30K instead of RM 100B+)
- Fixed booking status display logic (APPROVED → ACTIVE → COMPLETED based on dates)
- Fixed active booking filter in booking management
- Fixed validation errors in EditListingScreen (missing zipCode field)
- Fixed booking price display consistency (per day vs total amount)

#### 🎨 UI/UX Improvements
- **AIPriceEstimator**: Updated to 2x2 grid layout with colored property type icons
- **EditListingScreen**: Complete dark theme makeover with success notifications
- **BookingCard**: Enhanced status indicators and navigation
- **Provider Dashboard**: Real booking data instead of mock monthly data
- **Form Validation**: Better error handling and user feedback

#### 🔧 Technical Improvements
- Enhanced booking status logic with date-based calculations
- Improved data validation and error handling
- Added comprehensive debugging for dashboard calculations
- Fixed navigation flow between screens
- Optimized booking data fetching and filtering

### Version 1.0.0 - Initial Release
**Release Date**: December 2025

#### 🚀 Core Features
- Complete tenant and provider interfaces
- Property search and booking system
- AI-powered price estimation
- JWT authentication
- Cloud deployment with Cloudflare Tunnel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rentverse-app.git
   cd rentverse-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device/emulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

### Environment Configuration

The app connects to the following endpoints:

| Service | URL |
|---------|-----|
| Core API | `https://rentverse-api.daviddmpp.my.id` |
| AI Service | `https://rentverse-ai.daviddmpp.my.id` |

---

## 🔌 API Integration

### Authentication

```typescript
// Login
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { success: true, data: { user: User, token: string } }

// Register
POST /api/v1/auth/register
Body: { email, password, firstName, lastName, role }
Response: { success: true, data: { user: User, token: string } }
```

### Properties

```typescript
// Get all properties
GET /api/v1/m/properties
Query: { page, limit, city, minPrice, maxPrice, bedrooms }

// Get property by ID
GET /api/v1/m/properties/:id

// Create property (Provider only)
POST /api/v1/m/properties
Body: { title, description, address, city, price, bedrooms, ... }

// Update property
PUT /api/v1/m/properties/:id

// Delete property
DELETE /api/v1/m/properties/:id
```

### Bookings

```typescript
// Get bookings
GET /api/v1/m/bookings
Query: { role: 'tenant' | 'owner', status }

// Create booking
POST /api/v1/m/bookings
Body: { propertyId, startDate, endDate, message }

// Approve booking (Provider)
POST /api/v1/m/bookings/:id/approve

// Reject booking (Provider)
POST /api/v1/m/bookings/:id/reject
Body: { reason }
```

### AI Service

```typescript
// Price prediction
POST /api/v1/classify/price
Body: {
  property_type: string,
  bedrooms: number,
  bathrooms: number,
  area: number,
  furnished: 'Yes' | 'Partially' | 'No',
  location: string
}
Response: {
  predicted_price: number,
  price_range: { min: number, max: number },
  currency: string
}
```

---

## 📱 Screenshots

<p align="center">
  <i>Screenshots coming soon...</i>
</p>

| Tenant Home | Property Detail | Booking |
|-------------|-----------------|---------|
| ![Home](docs/screenshots/home.png) | ![Detail](docs/screenshots/detail.png) | ![Booking](docs/screenshots/booking.png) |

| Provider Dashboard | Add Listing | AI Estimator |
|--------------------|-------------|--------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Add](docs/screenshots/add.png) | ![AI](docs/screenshots/ai.png) |

---

## 🚢 Deployment

### Building with EAS

1. **Configure EAS**
   ```bash
   eas login
   eas build:configure
   ```

2. **Build for Android (APK)**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Build for Production**
   ```bash
   eas build --platform android --profile production
   ```

### Server Deployment

The backend services are deployed on a VirtualBox server with:

- **Docker containers** for all services
- **Cloudflare Tunnel** for secure public access
- **Neon PostgreSQL** for cloud database
- **Auto-restart** configured for all services

```bash
# Check service status
docker ps

# View logs
docker logs rentverse-backend --tail 50

# Restart services
docker restart rentverse-backend
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run property-based tests
npm run test:property
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**David DMPP**
- GitHub: [@DavidDMPP](https://github.com/DavidDMPP)
- Email: daviddmppdev@gmail.com

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Amazing development platform
- [React Native](https://reactnative.dev/) - Cross-platform framework
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Cloudflare](https://cloudflare.com/) - Tunnel and CDN services

---

<p align="center">
  Made with ❤️ for the RentVerse Project
</p>
