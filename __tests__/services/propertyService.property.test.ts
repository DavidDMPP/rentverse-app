/**
 * Property-Based Tests for Property Service
 * 
 * Feature: rentverse-react-native-app, Property 4: Search Filter Consistency
 * Feature: rentverse-react-native-app, Property 5: Category Filter Consistency
 * Validates: Requirements 2.2, 2.3
 * 
 * Tests that search results contain query in title/location and
 * category filter returns matching property types.
 */

import * as fc from 'fast-check';
import {
  filterBySearch,
  filterByCategory,
  filterByPriceRange,
} from '../../src/services/propertyService';
import {
  Property,
  PropertyType,
  PROPERTY_TYPES,
  PropertyTypeName,
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

// Property arbitrary for testing
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

describe('Property Service Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 4: Search Filter Consistency
   * Validates: Requirements 2.2
   * 
   * Test that search results contain query in title, address, city, or state
   */
  it('search results should contain query in title or location fields', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (properties, query) => {
          const results = filterBySearch(properties, query);
          // The implementation trims the query, so we should also trim when checking
          const lowerQuery = query.toLowerCase().trim();
          
          // All results should contain the query in at least one of the searchable fields
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
   * Feature: rentverse-react-native-app, Property 4: Search Filter Consistency
   * Validates: Requirements 2.2
   * 
   * Test that empty search returns all properties
   */
  it('empty search query should return all properties', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom('', '   ', null as unknown as string, undefined as unknown as string),
        (properties, query) => {
          const results = filterBySearch(properties, query);
          return results.length === properties.length;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Feature: rentverse-react-native-app, Property 4: Search Filter Consistency
   * Validates: Requirements 2.2
   * 
   * Test that search is case-insensitive
   */
  it('search should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (properties, query) => {
          const lowerResults = filterBySearch(properties, query.toLowerCase());
          const upperResults = filterBySearch(properties, query.toUpperCase());
          const mixedResults = filterBySearch(properties, query);
          
          // All case variations should return the same results
          return lowerResults.length === upperResults.length &&
                 upperResults.length === mixedResults.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 5: Category Filter Consistency
   * Validates: Requirements 2.3
   * 
   * Test that category filter returns only matching property types
   */
  it('category filter should return only matching property types', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...PROPERTY_TYPES),
        (properties, category: PropertyTypeName) => {
          const results = filterByCategory(properties, category);
          
          // All results should have the matching property type
          return results.every(p => p.propertyType?.name === category);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 5: Category Filter Consistency
   * Validates: Requirements 2.3
   * 
   * Test that category filter doesn't miss any matching properties
   */
  it('category filter should include all matching properties', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...PROPERTY_TYPES),
        (properties, category: PropertyTypeName) => {
          const results = filterByCategory(properties, category);
          const expectedCount = properties.filter(p => p.propertyType?.name === category).length;
          
          // Result count should match expected count
          return results.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test for price range filtering
   * 
   * Test that price range filter returns properties within range
   */
  it('price range filter should return properties within specified range', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 0, max: 50000 }),
        fc.integer({ min: 50001, max: 100000 }),
        (properties, minPrice, maxPrice) => {
          const results = filterByPriceRange(properties, minPrice, maxPrice);
          
          // All results should be within the price range
          return results.every(p => p.price >= minPrice && p.price <= maxPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that filters can be combined
   */
  it('combined filters should be consistent', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.constantFrom(...PROPERTY_TYPES),
        (properties, query, category: PropertyTypeName) => {
          // Apply filters in different orders
          const searchThenCategory = filterByCategory(filterBySearch(properties, query), category);
          const categoryThenSearch = filterBySearch(filterByCategory(properties, category), query);
          
          // Results should be the same regardless of order
          return searchThenCategory.length === categoryThenSearch.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
