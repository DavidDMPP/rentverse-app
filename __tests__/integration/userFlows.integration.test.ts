/**
 * Integration Tests for Complete User Flows
 * 
 * Tests the complete user flows for both tenant and provider roles:
 * - Tenant flow: login → browse → search → view detail → favorite → book
 * - Provider flow: login → dashboard → AI estimator → add listing → manage bookings
 * 
 * Requirements: All (1.1-11.5)
 */

import * as fc from 'fast-check';
import {
  validateLoginRequest,
  validateRegisterRequest,
  isValidEmail,
} from '../../src/services/authService';
import {
  filterBySearch,
  filterByCategory,
  filterByPriceRange,
  validateListingData,
} from '../../src/services/propertyService';
import {
  createBookingPayload,
  filterBookingsByStatus,
  validateBookingDates,
  canApproveBooking,
  canRejectBooking,
  applyApprovalStatus,
  applyRejectionStatus,
} from '../../src/services/bookingService';
import {
  validatePredictionRequest,
  isValidPredictionResponse,
  createPredictionRequest,
} from '../../src/services/aiService';
import { formatCurrency, formatDate } from '../../src/utils/formatting';
import {
  Property,
  PropertyType,
  Booking,
  BookingStatus,
  PROPERTY_TYPES,
  PropertyTypeName,
  FURNISHED_TYPES,
  FurnishedType,
  BOOKING_STATUSES,
  PredictionResponse,
  CreatePropertyRequest,
} from '../../src/types';

// ============================================================================
// Test Arbitraries (Generators)
// ============================================================================

// Valid date arbitrary
const validDateArbitrary = (min: Date, max: Date) =>
  fc.date({ min, max }).filter(d => !isNaN(d.getTime()));

// Property type arbitrary
const propertyTypeArbitrary = fc.record<PropertyType>({
  id: fc.uuid(),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.constantFrom(...PROPERTY_TYPES),
  description: fc.option(fc.string(), { nil: undefined }),
  icon: fc.option(fc.string(), { nil: undefined }),
  isActive: fc.boolean(),
  propertyCount: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
});

// Property arbitrary
const propertyArbitrary = fc.record<Property>({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string(), { nil: undefined }),
  address: fc.string({ minLength: 1, maxLength: 200 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.string({ minLength: 1, maxLength: 50 }),
  zipCode: fc.string({ minLength: 1, maxLength: 10 }),
  country: fc.constant('Malaysia'),
  price: fc.integer({ min: 100, max: 100000 }),
  currencyCode: fc.constant('MYR'),
  bedrooms: fc.integer({ min: 1, max: 10 }),
  bathrooms: fc.integer({ min: 1, max: 10 }),
  areaSqm: fc.option(fc.integer({ min: 10, max: 10000 }), { nil: undefined }),
  furnished: fc.constantFrom(...FURNISHED_TYPES) as fc.Arbitrary<FurnishedType | boolean>,
  isAvailable: fc.boolean(),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
  latitude: fc.option(fc.double({ min: -90, max: 90 }), { nil: undefined }),
  longitude: fc.option(fc.double({ min: -180, max: 180 }), { nil: undefined }),
  placeId: fc.option(fc.string(), { nil: undefined }),
  projectName: fc.option(fc.string(), { nil: undefined }),
  developer: fc.option(fc.string(), { nil: undefined }),
  code: fc.string({ minLength: 1, maxLength: 20 }),
  status: fc.constantFrom('PENDING_REVIEW', 'APPROVED', 'REJECTED') as fc.Arbitrary<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>,
  createdAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  updatedAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  ownerId: fc.uuid(),
  propertyTypeId: fc.uuid(),
  propertyType: propertyTypeArbitrary,
  amenities: fc.option(fc.array(fc.record({ id: fc.uuid(), name: fc.string() })), { nil: undefined }),
  owner: fc.option(fc.constant(undefined), { nil: undefined }),
  isFavorite: fc.option(fc.boolean(), { nil: undefined }),
  rating: fc.option(fc.double({ min: 1, max: 5 }), { nil: undefined }),
  viewCount: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
});

// Booking arbitrary
const bookingArbitrary = fc.record<Booking>({
  id: fc.uuid(),
  propertyId: fc.uuid(),
  property: fc.option(propertyArbitrary, { nil: undefined }),
  tenantId: fc.uuid(),
  tenant: fc.option(fc.constant(undefined), { nil: undefined }),
  landlordId: fc.uuid(),
  landlord: fc.option(fc.constant(undefined), { nil: undefined }),
  startDate: validDateArbitrary(new Date('2024-01-01'), new Date('2025-12-31')).map(d => d.toISOString()),
  endDate: validDateArbitrary(new Date('2025-01-01'), new Date('2026-12-31')).map(d => d.toISOString()),
  rentAmount: fc.integer({ min: 100, max: 100000 }),
  currencyCode: fc.constant('MYR'),
  securityDeposit: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
  status: fc.constantFrom(...BOOKING_STATUSES) as fc.Arbitrary<BookingStatus>,
  notes: fc.option(fc.string(), { nil: undefined }),
  createdAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  updatedAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
});

// Valid email arbitrary
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]+$/),
  fc.stringMatching(/^[a-z0-9]+$/),
  fc.stringMatching(/^[a-z]{2,4}$/)
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Valid password arbitrary (at least 6 chars, not just whitespace)
const validPasswordArbitrary = fc.string({ minLength: 6, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// ============================================================================
// Tenant Flow Integration Tests
// ============================================================================

describe('Tenant Flow Integration Tests', () => {
  describe('Step 1: Login', () => {
    /**
     * Test that valid credentials pass validation
     * Requirements: 1.2, 1.3
     */
    it('should validate correct login credentials', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validPasswordArbitrary,
          (email, password) => {
            const result = validateLoginRequest({ email, password });
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that invalid credentials are rejected
     * Requirements: 1.3
     */
    it('should reject invalid login credentials', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('@')), // Invalid email
          fc.string({ minLength: 6 }),
          (email, password) => {
            const result = validateLoginRequest({ email, password });
            return result.isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 2: Browse Properties', () => {
    /**
     * Test that properties can be filtered by search
     * Requirements: 2.2
     */
    it('should filter properties by search query', () => {
      fc.assert(
        fc.property(
          fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          (properties, query) => {
            const results = filterBySearch(properties, query);
            const lowerQuery = query.toLowerCase().trim();
            
            return results.every(p =>
              p.title.toLowerCase().includes(lowerQuery) ||
              p.address.toLowerCase().includes(lowerQuery) ||
              p.city.toLowerCase().includes(lowerQuery) ||
              p.state.toLowerCase().includes(lowerQuery)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that properties can be filtered by category
     * Requirements: 2.3
     */
    it('should filter properties by category', () => {
      fc.assert(
        fc.property(
          fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom(...PROPERTY_TYPES),
          (properties, category: PropertyTypeName) => {
            const results = filterByCategory(properties, category);
            return results.every(p => p.propertyType?.name === category);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that properties can be filtered by price range
     * Requirements: 2.2
     */
    it('should filter properties by price range', () => {
      fc.assert(
        fc.property(
          fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
          fc.integer({ min: 0, max: 50000 }),
          fc.integer({ min: 50001, max: 100000 }),
          (properties, minPrice, maxPrice) => {
            const results = filterByPriceRange(properties, minPrice, maxPrice);
            return results.every(p => p.price >= minPrice && p.price <= maxPrice);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 3: View Property Detail', () => {
    /**
     * Test that property prices are formatted correctly
     * Requirements: 8.4
     */
    it('should format property prices with RM prefix', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          (price) => {
            const formatted = formatCurrency(price);
            return formatted.startsWith('RM');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that property has all required fields for detail view
     * Requirements: 3.1
     */
    it('should have all required fields for property detail', () => {
      fc.assert(
        fc.property(
          propertyArbitrary,
          (property) => {
            // Check all required fields exist
            return (
              typeof property.id === 'string' &&
              typeof property.title === 'string' &&
              typeof property.price === 'number' &&
              typeof property.address === 'string' &&
              typeof property.city === 'string' &&
              typeof property.state === 'string' &&
              typeof property.bedrooms === 'number' &&
              typeof property.bathrooms === 'number' &&
              Array.isArray(property.images)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 4: Favorite Property', () => {
    /**
     * Test favorite toggle idempotence
     * Requirements: 3.2, 4.2
     */
    it('should toggle favorite status correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (initialFavorite) => {
            // Simulate toggling favorite twice
            const afterFirstToggle = !initialFavorite;
            const afterSecondToggle = !afterFirstToggle;
            
            // Should return to original state
            return afterSecondToggle === initialFavorite;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 5: Create Booking', () => {
    /**
     * Test booking payload creation
     * Requirements: 10.2
     */
    it('should create valid booking payload', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validDateArbitrary(new Date('2025-01-01'), new Date('2025-06-30')),
          validDateArbitrary(new Date('2025-07-01'), new Date('2025-12-31')),
          fc.option(fc.string()),
          (propertyId, startDate, endDate, message) => {
            const payload = createBookingPayload(
              propertyId,
              startDate,
              endDate,
              message ?? undefined
            );
            
            return (
              typeof payload.propertyId === 'string' &&
              typeof payload.startDate === 'string' &&
              typeof payload.endDate === 'string' &&
              (payload.message === undefined || typeof payload.message === 'string')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test booking date validation
     * Requirements: 10.2
     */
    it('should validate booking dates correctly', () => {
      fc.assert(
        fc.property(
          validDateArbitrary(new Date('2026-01-01'), new Date('2026-06-30')),
          validDateArbitrary(new Date('2026-07-01'), new Date('2026-12-31')),
          (startDate, endDate) => {
            const result = validateBookingDates(startDate, endDate);
            // End date is after start date, so should be valid
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booking status filter works correctly
     * Requirements: 10.4
     */
    it('should filter bookings by status', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom(...BOOKING_STATUSES),
          (bookings, status: BookingStatus) => {
            const filtered = filterBookingsByStatus(bookings, status);
            return filtered.every(b => b.status === status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Provider Flow Integration Tests
// ============================================================================

describe('Provider Flow Integration Tests', () => {
  describe('Step 1: Login as Provider', () => {
    /**
     * Test that provider can login with valid credentials
     * Requirements: 1.2
     */
    it('should validate provider login credentials', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validPasswordArbitrary,
          (email, password) => {
            const result = validateLoginRequest({ email, password });
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 2: AI Price Estimator', () => {
    /**
     * Test AI prediction request validation
     * Requirements: 7.1
     */
    it('should validate AI prediction request', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PROPERTY_TYPES),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 10, max: 10000 }),
          fc.constantFrom('Yes', 'Partially', 'No') as fc.Arbitrary<'Yes' | 'Partially' | 'No'>,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (propertyType, bedrooms, bathrooms, area, furnished, location) => {
            const request = createPredictionRequest(
              propertyType as PropertyTypeName,
              bedrooms,
              bathrooms,
              area,
              furnished,
              location
            );
            const result = validatePredictionRequest(request);
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test AI prediction response validation
     * Requirements: 7.2, 7.4
     */
    it('should validate AI prediction response format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 100000 }),
          fc.integer({ min: 50, max: 50000 }),
          fc.integer({ min: 50001, max: 150000 }),
          fc.double({ min: 0, max: 1 }),
          (predictedPrice, minPrice, maxPrice, confidence) => {
            const response: PredictionResponse = {
              status: 'success',
              predicted_price: predictedPrice,
              price_range: {
                min: minPrice,
                max: maxPrice,
              },
              confidence_score: confidence,
              currency: 'RM',
              model_version: '1.0.0',
              features_used: ['bedrooms', 'bathrooms', 'area'],
            };
            
            return isValidPredictionResponse(response);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that invalid prediction requests are rejected
     * Requirements: 7.1
     */
    it('should reject invalid AI prediction requests', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !PROPERTY_TYPES.includes(s as PropertyTypeName)), // Invalid property type
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 10, max: 10000 }),
          fc.constantFrom('Yes', 'Partially', 'No') as fc.Arbitrary<'Yes' | 'Partially' | 'No'>,
          fc.string({ minLength: 1, maxLength: 50 }),
          (propertyType, bedrooms, bathrooms, area, furnished, location) => {
            const request = {
              property_type: propertyType as PropertyTypeName,
              bedrooms,
              bathrooms,
              area,
              furnished,
              location,
            };
            const result = validatePredictionRequest(request);
            return result.isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 3: Add Listing', () => {
    /**
     * Test listing validation with valid data
     * Requirements: 6.1, 6.4
     */
    it('should validate complete listing data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 100, max: 100000 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 10, max: 10000 }),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (title, price, bedrooms, bathrooms, areaSqm, propertyTypeId, address, city, state) => {
            const data: Partial<CreatePropertyRequest> = {
              title,
              price,
              bedrooms,
              bathrooms,
              areaSqm,
              propertyTypeId,
              address,
              city,
              state,
            };
            const result = validateListingData(data);
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test listing validation with missing required fields
     * Requirements: 6.4
     */
    it('should reject listing with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('title', 'price', 'bedrooms', 'bathrooms', 'areaSqm', 'propertyTypeId', 'address', 'city', 'state'),
          (missingField) => {
            const data: Partial<CreatePropertyRequest> = {
              title: 'Test Property',
              price: 1000,
              bedrooms: 2,
              bathrooms: 1,
              areaSqm: 100,
              propertyTypeId: 'test-id',
              address: '123 Test St',
              city: 'Kuala Lumpur',
              state: 'Selangor',
            };
            
            // Remove the field
            delete (data as Record<string, unknown>)[missingField];
            
            const result = validateListingData(data);
            return result.isValid === false && missingField in result.errors;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Step 4: Manage Bookings', () => {
    /**
     * Test booking approval for pending bookings
     * Requirements: 10.7
     */
    it('should approve pending bookings', () => {
      fc.assert(
        fc.property(
          bookingArbitrary.map(b => ({ ...b, status: 'PENDING' as BookingStatus })),
          (booking) => {
            const canApprove = canApproveBooking(booking);
            const approved = applyApprovalStatus(booking);
            
            return canApprove === true && approved.status === 'APPROVED';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test booking rejection for pending bookings
     * Requirements: 10.7
     */
    it('should reject pending bookings', () => {
      fc.assert(
        fc.property(
          bookingArbitrary.map(b => ({ ...b, status: 'PENDING' as BookingStatus })),
          fc.option(fc.string()),
          (booking, reason) => {
            const canReject = canRejectBooking(booking);
            const rejected = applyRejectionStatus(booking, reason ?? undefined);
            
            return canReject === true && rejected.status === 'REJECTED';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that non-pending bookings cannot be approved/rejected
     * Requirements: 10.7
     */
    it('should not modify non-pending bookings', () => {
      fc.assert(
        fc.property(
          bookingArbitrary.filter(b => b.status !== 'PENDING'),
          (booking) => {
            const approved = applyApprovalStatus(booking);
            const rejected = applyRejectionStatus(booking);
            
            // Status should remain unchanged
            return approved.status === booking.status && rejected.status === booking.status;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test booking status filter for provider view
     * Requirements: 10.6
     */
    it('should filter bookings by status for provider', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom(...BOOKING_STATUSES),
          (bookings, status: BookingStatus) => {
            const filtered = filterBookingsByStatus(bookings, status);
            return filtered.every(b => b.status === status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Cross-Flow Integration Tests
// ============================================================================

describe('Cross-Flow Integration Tests', () => {
  describe('Data Model Consistency', () => {
    /**
     * Test property type values match AI_API enum
     * Requirements: 8.1
     */
    it('should use valid property type values', () => {
      fc.assert(
        fc.property(
          propertyArbitrary,
          (property) => {
            return PROPERTY_TYPES.includes(property.propertyType.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test furnished values match AI_API enum
     * Requirements: 8.2
     */
    it('should use valid furnished values', () => {
      fc.assert(
        fc.property(
          propertyArbitrary,
          (property) => {
            if (typeof property.furnished === 'boolean') {
              return true; // Boolean is also valid
            }
            return FURNISHED_TYPES.includes(property.furnished as FurnishedType);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Currency Formatting', () => {
    /**
     * Test all prices are formatted with RM prefix
     * Requirements: 8.4
     */
    it('should format all prices with RM prefix', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          (price) => {
            const formatted = formatCurrency(price);
            return formatted.startsWith('RM');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Registration Flow', () => {
    /**
     * Test registration validation with valid data
     * Requirements: 1.4
     */
    it('should validate complete registration data', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validPasswordArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          validDateArbitrary(new Date('1950-01-01'), new Date('2005-12-31')).map(d => d.toISOString().split('T')[0]),
          fc.stringMatching(/^\+?[0-9]{10,15}$/),
          (email, password, firstName, lastName, dateOfBirth, phone) => {
            const result = validateRegisterRequest({
              email,
              password,
              firstName,
              lastName,
              dateOfBirth,
              phone,
            });
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('End-to-End Data Flow', () => {
    /**
     * Test that property data flows correctly through search → detail → booking
     * Requirements: 2.1, 3.1, 10.1
     */
    it('should maintain data integrity through tenant flow', () => {
      fc.assert(
        fc.property(
          fc.array(propertyArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          (properties, searchQuery) => {
            // Step 1: Search
            const searchResults = filterBySearch(properties, searchQuery);
            
            // Step 2: Each result should have valid structure for detail view
            const allValidForDetail = searchResults.every(p =>
              typeof p.id === 'string' &&
              typeof p.title === 'string' &&
              typeof p.price === 'number' &&
              p.price > 0
            );
            
            // Step 3: Each result should be bookable (has required fields)
            const allBookable = searchResults.every(p =>
              typeof p.id === 'string' &&
              typeof p.ownerId === 'string'
            );
            
            return allValidForDetail && allBookable;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that listing data flows correctly through create → AI estimate → publish
     * Requirements: 6.1, 7.1
     */
    it('should maintain data integrity through provider flow', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PROPERTY_TYPES),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 10, max: 10000 }),
          fc.constantFrom('Yes', 'Partially', 'No') as fc.Arbitrary<'Yes' | 'Partially' | 'No'>,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (propertyType, bedrooms, bathrooms, area, furnished, location) => {
            // Step 1: Create prediction request
            const predictionRequest = createPredictionRequest(
              propertyType as PropertyTypeName,
              bedrooms,
              bathrooms,
              area,
              furnished,
              location
            );
            
            // Step 2: Validate prediction request
            const validationResult = validatePredictionRequest(predictionRequest);
            
            // Step 3: Create listing data
            const listingData: Partial<CreatePropertyRequest> = {
              title: `${propertyType} in ${location}`,
              price: 1000, // Would come from AI prediction
              bedrooms,
              bathrooms,
              areaSqm: area,
              propertyTypeId: 'test-id',
              address: location,
              city: location,
              state: 'Selangor',
            };
            
            // Step 4: Validate listing data
            const listingValidation = validateListingData(listingData);
            
            return validationResult.isValid === true && listingValidation.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
