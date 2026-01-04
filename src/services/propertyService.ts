/**
 * Property Service
 * 
 * Handles property-related operations:
 * - Get properties with filters
 * - Get property by ID
 * - Get nearby properties
 * - Toggle favorite
 * - Rate property
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 11.1
 */

import { coreApi, coreApiBase } from './api';
import {
  Property,
  PropertyFilters,
  PaginatedResponse,
  ApiResponse,
  PropertyTypeName,
  CreatePropertyRequest,
} from '../types';

/**
 * Filter properties by search query (client-side filtering)
 * Requirements: 2.2
 * 
 * @param properties - Array of properties to filter
 * @param query - Search query string
 * @returns Filtered properties containing query in title, address, city, or state
 */
export const filterBySearch = (properties: Property[], query: string): Property[] => {
  if (!query || query.trim() === '') {
    return properties;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return properties.filter(property => 
    property.title.toLowerCase().includes(lowerQuery) ||
    property.address.toLowerCase().includes(lowerQuery) ||
    property.city.toLowerCase().includes(lowerQuery) ||
    property.state.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Filter properties by category/property type (client-side filtering)
 * Requirements: 2.3
 * 
 * @param properties - Array of properties to filter
 * @param category - Property type name to filter by
 * @returns Filtered properties matching the category
 */
export const filterByCategory = (properties: Property[], category: PropertyTypeName): Property[] => {
  return properties.filter(property => 
    property.propertyType?.name === category
  );
};

/**
 * Filter properties by price range (client-side filtering)
 * 
 * @param properties - Array of properties to filter
 * @param minPrice - Minimum price (inclusive)
 * @param maxPrice - Maximum price (inclusive)
 * @returns Filtered properties within price range
 */
export const filterByPriceRange = (
  properties: Property[], 
  minPrice?: number, 
  maxPrice?: number
): Property[] => {
  return properties.filter(property => {
    if (minPrice !== undefined && property.price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && property.price > maxPrice) {
      return false;
    }
    return true;
  });
};


/**
 * Get properties with optional filters
 * Requirements: 2.1, 2.2, 2.3
 * 
 * @param filters - Optional filter parameters
 * @returns Paginated list of properties
 */
export const getProperties = async (
  filters?: PropertyFilters
): Promise<PaginatedResponse<Property>> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.search) params.append('search', filters.search);
    if (filters.propertyTypeId) params.append('propertyTypeId', filters.propertyTypeId);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms !== undefined) params.append('bathrooms', filters.bathrooms.toString());
    if (filters.furnished) params.append('furnished', filters.furnished);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/properties?${queryString}` : '/properties';
  
  const response = await coreApi.get<ApiResponse<{ properties: Property[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(url);
  
  // Transform backend response to match PaginatedResponse format
  const backendData = response.data.data;
  return {
    success: response.data.success,
    data: backendData?.properties || [],
    pagination: backendData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
};

/**
 * Get property by ID
 * Requirements: 3.1
 * 
 * @param id - Property ID
 * @returns Property details
 */
export const getPropertyById = async (id: string): Promise<Property> => {
  const response = await coreApi.get<ApiResponse<Property>>(`/properties/${id}`);
  return response.data.data;
};

/**
 * Get nearby properties based on location
 * Requirements: 2.1
 * 
 * Note: Backend endpoint /properties/nearby has route conflict with /:id
 * Using /properties with lat/lng/radius params as workaround
 * 
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radius - Search radius in kilometers (default: 10)
 * @returns List of nearby properties
 */
export const getNearbyProperties = async (
  latitude: number,
  longitude: number,
  radius: number = 10
): Promise<Property[]> => {
  // Use /properties with location params instead of /properties/nearby
  // because /nearby route is defined after /:id causing route conflict
  const response = await coreApi.get<ApiResponse<{ properties: Property[]; pagination: unknown }>>('/properties', {
    params: { latitude, longitude, radius, limit: 20 },
  });
  return response.data.data?.properties || [];
};

/**
 * Get featured properties
 * Requirements: 2.1
 * 
 * Note: Backend doesn't have /properties/featured endpoint
 * Using /properties with sortBy=newest as alternative
 * 
 * @param limit - Number of properties to return
 * @returns List of featured properties
 */
export const getFeaturedProperties = async (limit: number = 10): Promise<Property[]> => {
  // Backend doesn't have /featured endpoint, use /properties with sortBy
  const response = await coreApi.get<ApiResponse<{ properties: Property[]; pagination: unknown }>>('/properties', {
    params: { limit, sortBy: 'newest' },
  });
  return response.data.data?.properties || [];
};

/**
 * Toggle favorite status for a property
 * Requirements: 3.2, 4.2
 * 
 * @param propertyId - Property ID to toggle favorite
 * @returns Updated favorite status
 */
export const toggleFavorite = async (propertyId: string): Promise<{ isFavorite: boolean }> => {
  const response = await coreApi.post<ApiResponse<{ isFavorite: boolean }>>(
    `/properties/${propertyId}/favorite`
  );
  return response.data.data;
};

/**
 * Get user's favorite properties
 * Requirements: 4.1
 * 
 * Note: Favorites endpoint is at /users/favorites, not /favorites
 * 
 * @returns List of favorite properties
 */
export const getFavorites = async (): Promise<Property[]> => {
  const response = await coreApi.get<ApiResponse<{ favorites: Property[]; pagination: unknown }>>('/users/favorites');
  return response.data.data?.favorites || [];
};

/**
 * Rate a property
 * 
 * @param propertyId - Property ID to rate
 * @param rating - Rating value (1-5)
 * @returns Updated property with new rating
 */
export const rateProperty = async (
  propertyId: string, 
  rating: number
): Promise<Property> => {
  const response = await coreApi.post<ApiResponse<Property>>(
    `/properties/${propertyId}/rate`,
    { rating }
  );
  return response.data.data;
};

/**
 * Get property types
 * 
 * Backend returns: { success: true, data: [{ id, name, icon, propertyCount }] }
 * 
 * @returns List of available property types
 */
export const getPropertyTypes = async () => {
  try {
    const response = await coreApi.get<ApiResponse<{ id: string; name: string; icon?: string; propertyCount?: number }[]>>('/property-types');
    console.log('Property types raw response:', response.data);
    const data = response.data.data;
    // Backend returns array directly in data field
    if (Array.isArray(data)) {
      return data;
    }
    // Fallback: check if data has propertyTypes property
    if (data && typeof data === 'object' && 'propertyTypes' in data) {
      return (data as unknown as { propertyTypes: { id: string; name: string }[] }).propertyTypes || [];
    }
    return [];
  } catch (error) {
    console.error('getPropertyTypes error:', error);
    return [];
  }
};

/**
 * Get amenities
 * 
 * @returns List of available amenities
 */
export const getAmenities = async () => {
  const response = await coreApi.get<ApiResponse<{ amenities?: { id: string; name: string }[]; grouped?: unknown } | { id: string; name: string }[]>>('/amenities');
  const data = response.data.data;
  // Handle both array and object response formats
  // Backend returns { amenities: [...], grouped: {...} }
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'amenities' in data) {
    return data.amenities || [];
  }
  return [];
};

/**
 * Property summary from backend
 */
export interface PropertySummary {
  totalListings: number;
  activeListings: number;
  occupiedListings: number;
  occupancyRate: number;
  totalRevenue?: number;
}

/**
 * Response type for getMyProperties with summary
 */
export interface MyPropertiesResponse {
  properties: Property[];
  summary?: PropertySummary;
}

/**
 * Get properties owned by a specific user (for provider listings)
 * Requirements: 6.3
 * 
 * Uses dedicated endpoint that returns properties for authenticated owner
 * 
 * @param ownerId - Owner user ID
 * @returns Properties and summary statistics
 */
export const getMyProperties = async (ownerId: string): Promise<MyPropertiesResponse> => {
  try {
    const response = await coreApiBase.get<
      ApiResponse<{ properties: Property[]; pagination: unknown; summary?: PropertySummary }>
    >('/properties/my-properties', {
      params: { limit: 100 },
    });
    return {
      properties: response.data.data?.properties || [],
      summary: response.data.data?.summary,
    };
  } catch (error) {
    const response = await coreApiBase.get<
      ApiResponse<{ properties: Property[]; pagination: unknown }>
    >('/properties', {
      params: { limit: 100 },
    });
    const allProperties = response.data.data?.properties || [];
    const filteredProperties = allProperties.filter((p) => p.ownerId === ownerId);
    return {
      properties: filteredProperties,
      summary: undefined,
    };
  }
};

/**
 * Create a new property listing
 * Requirements: 6.1
 * 
 * Note: Uses non-mobile endpoint /api/v1/properties (not /api/v1/m/properties)
 * 
 * @param data - Property data to create
 * @returns Created property
 */
export const createProperty = async (data: CreatePropertyRequest): Promise<Property> => {
  const response = await coreApiBase.post<ApiResponse<Property>>('/properties', data);
  return response.data.data;
};

/**
 * Update an existing property listing
 * Requirements: 6.2
 * 
 * Note: Uses non-mobile endpoint /api/v1/properties (not /api/v1/m/properties)
 * 
 * @param id - Property ID to update
 * @param data - Property data to update
 * @returns Updated property
 */
export const updateProperty = async (
  id: string,
  data: Partial<CreatePropertyRequest>
): Promise<Property> => {
  const response = await coreApiBase.put<ApiResponse<Property>>(`/properties/${id}`, data);
  return response.data.data;
};

/**
 * Validate listing data before submission
 * Requirements: 6.4
 * 
 * @param data - Property data to validate
 * @returns Validation result with errors if any
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateListingData = (data: Partial<CreatePropertyRequest>): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  }

  if (!data.price || data.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  if (!data.bedrooms || data.bedrooms < 1) {
    errors.bedrooms = 'At least 1 bedroom is required';
  }

  if (!data.bathrooms || data.bathrooms < 1) {
    errors.bathrooms = 'At least 1 bathroom is required';
  }

  if (!data.areaSqm || data.areaSqm <= 0) {
    errors.areaSqm = 'Area must be greater than 0';
  }

  if (!data.propertyTypeId || data.propertyTypeId.trim() === '') {
    errors.propertyTypeId = 'Property type is required';
  }

  if (!data.address || data.address.trim() === '') {
    errors.address = 'Address is required';
  }

  if (!data.city || data.city.trim() === '') {
    errors.city = 'City is required';
  }

  if (!data.state || data.state.trim() === '') {
    errors.state = 'State is required';
  }

  if (!data.zipCode || data.zipCode.trim() === '') {
    errors.zipCode = 'Zip code is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  getProperties,
  getPropertyById,
  getNearbyProperties,
  getFeaturedProperties,
  toggleFavorite,
  getFavorites,
  rateProperty,
  getPropertyTypes,
  getAmenities,
  filterBySearch,
  filterByCategory,
  filterByPriceRange,
  createProperty,
  updateProperty,
  validateListingData,
};
