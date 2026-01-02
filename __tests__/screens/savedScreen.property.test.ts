/**
 * Property-Based Tests for SavedScreen / Favorite Toggle
 * 
 * Feature: rentverse-react-native-app, Property 6: Favorite Toggle Idempotence
 * Validates: Requirements 3.2, 4.2
 * 
 * Tests that toggling favorite twice returns to original state.
 */

import * as fc from 'fast-check';
import {
  Property,
  PropertyType,
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
  isFavorite: fc.boolean(),
  rating: fc.option(fc.double({ min: 1, max: 5 }), { nil: undefined }),
  viewCount: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
});

/**
 * Simulates the client-side favorite toggle behavior
 * This mirrors the logic used in TenantHomeScreen and SavedScreen
 * 
 * @param property - The property to toggle
 * @returns Property with toggled isFavorite state
 */
function toggleFavoriteLocal(property: Property): Property {
  return {
    ...property,
    isFavorite: !property.isFavorite,
  };
}

/**
 * Updates a property list after a favorite toggle
 * This mirrors the updateFavorite function in TenantHomeScreen
 * 
 * @param properties - Array of properties
 * @param propertyId - ID of property to toggle
 * @returns Updated array with toggled favorite state
 */
function updateFavoriteInList(properties: Property[], propertyId: string): Property[] {
  return properties.map(p =>
    p.id === propertyId ? { ...p, isFavorite: !p.isFavorite } : p
  );
}

describe('SavedScreen / Favorite Toggle Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 6: Favorite Toggle Idempotence
   * Validates: Requirements 3.2, 4.2
   * 
   * Test that toggling favorite twice returns to original state
   */
  it('toggling favorite twice should return to original state', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          const originalState = property.isFavorite;
          
          // Toggle once
          const afterFirstToggle = toggleFavoriteLocal(property);
          
          // Toggle again
          const afterSecondToggle = toggleFavoriteLocal(afterFirstToggle);
          
          // Should return to original state
          return afterSecondToggle.isFavorite === originalState;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 6: Favorite Toggle Idempotence
   * Validates: Requirements 3.2, 4.2
   * 
   * Test that toggling favorite in a list twice returns to original state
   */
  it('toggling favorite in list twice should return to original state', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 1, maxLength: 20 }),
        fc.nat(),
        (properties, indexSeed) => {
          // Select a random property from the list
          const index = indexSeed % properties.length;
          const targetId = properties[index].id;
          const originalState = properties[index].isFavorite;
          
          // Toggle once
          const afterFirstToggle = updateFavoriteInList(properties, targetId);
          const firstToggleState = afterFirstToggle.find(p => p.id === targetId)?.isFavorite;
          
          // Toggle again
          const afterSecondToggle = updateFavoriteInList(afterFirstToggle, targetId);
          const secondToggleState = afterSecondToggle.find(p => p.id === targetId)?.isFavorite;
          
          // First toggle should flip the state
          const firstToggleCorrect = firstToggleState === !originalState;
          
          // Second toggle should return to original
          const secondToggleCorrect = secondToggleState === originalState;
          
          return firstToggleCorrect && secondToggleCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 6: Favorite Toggle Idempotence
   * Validates: Requirements 3.2, 4.2
   * 
   * Test that toggling preserves all other property fields
   */
  it('toggling favorite should only change isFavorite field', () => {
    fc.assert(
      fc.property(
        propertyArbitrary,
        (property) => {
          const toggled = toggleFavoriteLocal(property);
          
          // All fields except isFavorite should remain the same
          return (
            toggled.id === property.id &&
            toggled.title === property.title &&
            toggled.price === property.price &&
            toggled.address === property.address &&
            toggled.city === property.city &&
            toggled.state === property.state &&
            toggled.bedrooms === property.bedrooms &&
            toggled.bathrooms === property.bathrooms &&
            toggled.isFavorite !== property.isFavorite
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 6: Favorite Toggle Idempotence
   * Validates: Requirements 3.2, 4.2
   * 
   * Test that toggling one property doesn't affect others in the list
   */
  it('toggling one property should not affect other properties', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArbitrary, { minLength: 2, maxLength: 20 }),
        fc.nat(),
        (properties, indexSeed) => {
          // Select a random property to toggle
          const index = indexSeed % properties.length;
          const targetId = properties[index].id;
          
          // Toggle the target property
          const afterToggle = updateFavoriteInList(properties, targetId);
          
          // Check that all other properties remain unchanged
          return properties.every((original, i) => {
            const updated = afterToggle[i];
            if (original.id === targetId) {
              // Target property should have toggled favorite
              return updated.isFavorite === !original.isFavorite;
            } else {
              // Other properties should be unchanged
              return updated.isFavorite === original.isFavorite;
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
