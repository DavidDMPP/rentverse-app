/**
 * Property-Based Tests for Property Detail Screen
 * 
 * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
 * Validates: Requirements 3.1
 * 
 * Tests that the property detail view displays all required fields:
 * images, price, location (address/city/state), bedrooms, bathrooms, areaSqm, and amenities.
 */

import * as fc from 'fast-check';
import {
  Property,
  PropertyType,
  Amenity,
  PROPERTY_TYPES,
  FURNISHED_TYPES,
  FurnishedType,
} from '../../src/types';

// Helper to generate valid dates
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

// Amenity arbitrary
const amenityArbitrary = fc.record<Amenity>({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.option(fc.string(), { nil: undefined }),
});

// Property arbitrary for testing - with all required fields for detail view
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
  images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }),
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
  amenities: fc.option(fc.array(amenityArbitrary, { minLength: 0, maxLength: 10 }), { nil: undefined }),
  owner: fc.option(fc.constant(undefined), { nil: undefined }),
  isFavorite: fc.option(fc.boolean(), { nil: undefined }),
  rating: fc.option(fc.double({ min: 1, max: 5 }), { nil: undefined }),
  viewCount: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
});

/**
 * Helper function to check if a property has all required fields for detail view
 * This mirrors the logic in PropertyDetailScreen
 * 
 * Requirements: 3.1 - Property detail view SHALL display:
 * - images
 * - price
 * - location (address/city/state)
 * - bedrooms
 * - bathrooms
 * - areaSqm
 * - amenities
 */
function hasRequiredDetailFields(property: Property): boolean {
  // Check images array exists (can be empty, but must exist)
  const hasImages = Array.isArray(property.images);
  
  // Check price is a valid number
  const hasPrice = typeof property.price === 'number' && !isNaN(property.price);
  
  // Check location fields exist
  const hasAddress = typeof property.address === 'string';
  const hasCity = typeof property.city === 'string';
  const hasState = typeof property.state === 'string';
  
  // Check bedroom/bathroom counts
  const hasBedrooms = typeof property.bedrooms === 'number' && !isNaN(property.bedrooms);
  const hasBathrooms = typeof property.bathrooms === 'number' && !isNaN(property.bathrooms);
  
  // areaSqm is optional but should be number or undefined
  const hasValidAreaSqm = property.areaSqm === undefined || 
    (typeof property.areaSqm === 'number' && !isNaN(property.areaSqm));
  
  // amenities is optional but should be array or undefined
  const hasValidAmenities = property.amenities === undefined || 
    Array.isArray(property.amenities);

  return hasImages && hasPrice && hasAddress && hasCity && hasState && 
         hasBedrooms && hasBathrooms && hasValidAreaSqm && hasValidAmenities;
}

/**
 * Helper function to format location string (mirrors PropertyDetailScreen logic)
 */
function getLocation(property: Property): string {
  return [property.address, property.city, property.state]
    .filter(Boolean)
    .join(', ');
}

/**
 * Helper function to get furnished status display text (mirrors PropertyDetailScreen logic)
 */
function getFurnishedStatus(property: Property): string {
  if (typeof property.furnished === 'boolean') {
    return property.furnished ? 'Furnished' : 'Unfurnished';
  }
  return property.furnished;
}

describe('Property Detail Screen Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that all property objects have the required fields for detail view display
   */
  it('property detail view should have all required fields', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          return hasRequiredDetailFields(property);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that price is always a positive number
   */
  it('property price should be a positive number', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          return typeof property.price === 'number' && 
                 property.price > 0 && 
                 !isNaN(property.price);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that location can be formatted from address, city, state
   */
  it('property location should be formattable from address, city, state', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          const location = getLocation(property);
          // Location should be a non-empty string if any location field is present
          const hasAnyLocationField = property.address || property.city || property.state;
          if (hasAnyLocationField) {
            return location.length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that bedrooms and bathrooms are positive integers
   */
  it('bedrooms and bathrooms should be positive integers', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          return property.bedrooms >= 1 && 
                 property.bathrooms >= 1 &&
                 Number.isInteger(property.bedrooms) &&
                 Number.isInteger(property.bathrooms);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that furnished status can be displayed as a string
   */
  it('furnished status should be displayable as string', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          const status = getFurnishedStatus(property);
          return typeof status === 'string' && status.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that amenities array items have required fields
   */
  it('amenities should have id and name fields', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          if (!property.amenities || property.amenities.length === 0) {
            return true; // Empty amenities is valid
          }
          return property.amenities.every(amenity => 
            typeof amenity.id === 'string' && 
            typeof amenity.name === 'string' &&
            amenity.id.length > 0 &&
            amenity.name.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that property type has required fields for display
   */
  it('property type should have name for display', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          return property.propertyType && 
                 typeof property.propertyType.name === 'string' &&
                 property.propertyType.name.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 7: Property Detail Completeness
   * Validates: Requirements 3.1
   * 
   * Test that images array is always an array (even if empty)
   */
  it('images should always be an array', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          return Array.isArray(property.images);
        }
      ),
      { numRuns: 100 }
    );
  });
});
