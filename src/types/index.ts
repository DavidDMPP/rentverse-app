/**
 * TypeScript type definitions for Rentverse App
 * Aligned with Core API (rentverse-core-service) and AI API (rentverse-ai-service)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * User roles in the system
 * USER = Tenant (looking for property)
 * ADMIN = Provider/Owner (listing properties)
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Property types supported by AI_API
 * Requirements: 8.1
 */
export const PROPERTY_TYPES = ['Apartment', 'Condominium', 'Service Residence', 'Townhouse'] as const;
export type PropertyTypeName = typeof PROPERTY_TYPES[number];

/**
 * Furnished status values matching AI_API
 * Requirements: 8.2
 */
export const FURNISHED_TYPES = ['Fully Furnished', 'Partially Furnished', 'Unfurnished'] as const;
export type FurnishedType = typeof FURNISHED_TYPES[number];

/**
 * AI API furnished values (different format for API requests)
 */
export const AI_FURNISHED_TYPES = ['Yes', 'Partially', 'No'] as const;
export type AIFurnishedType = typeof AI_FURNISHED_TYPES[number];

/**
 * Booking status values
 */
export const BOOKING_STATUSES = ['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CANCELLED', 'COMPLETED'] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];

/**
 * Listing status values
 */
export type ListingStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

// ============================================================================
// User & Authentication Types
// ============================================================================

/**
 * User interface matching Core_API schema
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  profilePicture?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication response from Core_API
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  role?: 'USER' | 'ADMIN';
}

// ============================================================================
// Property Types
// ============================================================================

/**
 * Property type category
 */
export interface PropertyType {
  id: string;
  code: string;
  name: PropertyTypeName;
  description?: string;
  icon?: string;
  isActive: boolean;
  propertyCount?: number;
}

/**
 * Amenity interface
 */
export interface Amenity {
  id: string;
  name: string;
  category?: string;
}

/**
 * Property interface matching Core_API schema
 * Requirements: 8.3
 */
export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  price: number;
  currencyCode: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number;
  furnished: FurnishedType | boolean;
  isAvailable: boolean;
  images: string[];
  latitude?: number;
  longitude?: number;
  placeId?: string;
  projectName?: string;
  developer?: string;
  code: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  propertyTypeId: string;
  propertyType: PropertyType;
  amenities?: Amenity[];
  owner?: User;
  isFavorite?: boolean;
  rating?: number;
  viewCount?: number;
}

/**
 * Create property request payload
 */
export interface CreatePropertyRequest {
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number;
  furnished: FurnishedType | boolean;
  propertyTypeId: string;
  images?: string[];
  amenityIds?: string[];
  latitude?: number;
  longitude?: number;
  status?: ListingStatus;
}

/**
 * Update property request payload
 */
export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string;
}

/**
 * Property filter parameters
 */
export interface PropertyFilters {
  search?: string;
  category?: PropertyTypeName;
  propertyTypeId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: FurnishedType;
  city?: string;
  state?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Booking Types
// ============================================================================

/**
 * Booking interface matching Core_API Lease schema
 */
export interface Booking {
  id: string;
  propertyId: string;
  property?: Property;
  tenantId: string;
  tenant?: User;
  landlordId: string;
  landlord?: User;
  startDate: string;
  endDate: string;
  rentAmount: number;
  currencyCode: string;
  securityDeposit?: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create booking request payload
 */
export interface CreateBookingRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

/**
 * Cancel booking request payload
 */
export interface CancelBookingRequest {
  reason?: string;
}

/**
 * Approve/Reject booking request payload
 */
export interface UpdateBookingStatusRequest {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}

/**
 * Booking filter parameters
 */
export interface BookingFilters {
  status?: BookingStatus;
  role?: 'tenant' | 'owner';
  page?: number;
  limit?: number;
}

// ============================================================================
// AI Prediction Types
// ============================================================================

/**
 * AI price prediction request payload
 * Matches AI_API PropertyPredictionRequest schema
 */
export interface PredictionRequest {
  property_type: PropertyTypeName;
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnished: AIFurnishedType;
  location: string;
}

/**
 * AI price prediction response
 * Matches AI_API PredictionResponse schema
 */
export interface PredictionResponse {
  status: string;
  predicted_price: number;
  price_range: {
    min: number;
    max: number;
  };
  confidence_score: number;
  currency: string;
  model_version: string;
  features_used: string[];
}

/**
 * Listing approval request payload
 */
export interface ListingApprovalRequest extends PredictionRequest {
  asking_price: number;
  property_age?: number;
  parking_spaces?: number;
  floor_level?: number;
  facilities?: string[];
}

/**
 * Listing approval response
 */
export interface ListingApprovalResponse {
  approval_status: 'approved' | 'rejected' | 'needs_review';
  confidence_score: number;
  predicted_price: number;
  asking_price: number;
  price_deviation: number;
  approval_reasons: string[];
  recommendations?: string[];
  status: string;
}

// ============================================================================
// API Response Wrapper Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API error response
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Provider dashboard statistics
 */
export interface DashboardStats {
  estimatedMonthlyIncome: number;
  occupancyRate: number;
  totalListings: number;
  activeListings: number;
  pendingBookings: number;
  totalViews: number;
}

/**
 * Monthly income data for charts
 */
export interface MonthlyIncome {
  month: string;
  income: number;
}

/**
 * Property interaction data
 */
export interface PropertyInteraction {
  propertyId: string;
  propertyTitle: string;
  type: 'view' | 'favorite' | 'booking';
  userId?: string;
  userName?: string;
  timestamp: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Currency format options
 * Requirements: 8.4
 */
export const CURRENCY = {
  code: 'MYR',
  symbol: 'RM',
  locale: 'ms-MY',
} as const;

/**
 * Mapping from app furnished type to AI API furnished type
 */
export const FURNISHED_TO_AI_MAP: Record<FurnishedType, AIFurnishedType> = {
  'Fully Furnished': 'Yes',
  'Partially Furnished': 'Partially',
  'Unfurnished': 'No',
};

/**
 * Mapping from AI API furnished type to app furnished type
 */
export const AI_TO_FURNISHED_MAP: Record<AIFurnishedType, FurnishedType> = {
  'Yes': 'Fully Furnished',
  'Partially': 'Partially Furnished',
  'No': 'Unfurnished',
};

/**
 * Type guard to check if a value is a valid PropertyTypeName
 */
export function isValidPropertyType(value: string): value is PropertyTypeName {
  return PROPERTY_TYPES.includes(value as PropertyTypeName);
}

/**
 * Type guard to check if a value is a valid FurnishedType
 */
export function isValidFurnishedType(value: string): value is FurnishedType {
  return FURNISHED_TYPES.includes(value as FurnishedType);
}

/**
 * Type guard to check if a value is a valid AIFurnishedType
 */
export function isValidAIFurnishedType(value: string): value is AIFurnishedType {
  return AI_FURNISHED_TYPES.includes(value as AIFurnishedType);
}

/**
 * Type guard to check if a value is a valid BookingStatus
 */
export function isValidBookingStatus(value: string): value is BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus);
}
