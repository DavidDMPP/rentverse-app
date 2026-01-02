/**
 * Property-Based Tests for Data Model Alignment
 * 
 * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
 * Validates: Requirements 8.1, 8.2, 8.3
 * 
 * Tests that propertyType values match AI_API enum and
 * furnished values match AI_API enum.
 */

import * as fc from 'fast-check';
import {
  PROPERTY_TYPES,
  FURNISHED_TYPES,
  AI_FURNISHED_TYPES,
  FURNISHED_TO_AI_MAP,
  AI_TO_FURNISHED_MAP,
  isValidPropertyType,
  isValidFurnishedType,
  isValidAIFurnishedType,
  PropertyTypeName,
  FurnishedType,
  AIFurnishedType,
} from '../../src/types';

// AI API supported property types (from rentverse-ai-service schemas.py)
const AI_API_PROPERTY_TYPES = ['Apartment', 'Condominium', 'Service Residence', 'Townhouse'] as const;

// AI API supported furnished types (from rentverse-ai-service schemas.py)
const AI_API_FURNISHED_TYPES = ['Yes', 'No', 'Partial', 'Fully Furnished', 'Partially Furnished', 'Unfurnished'] as const;

// Core API furnished types used in the app
const CORE_API_FURNISHED_TYPES = ['Fully Furnished', 'Partially Furnished', 'Unfurnished'] as const;

describe('Data Model Alignment Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.1
   * 
   * Test that all app property types are valid AI_API property types
   */
  it('all app property types should be valid AI_API property types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROPERTY_TYPES),
        (propertyType: PropertyTypeName) => {
          // Every property type in the app should exist in AI_API
          return AI_API_PROPERTY_TYPES.includes(propertyType as typeof AI_API_PROPERTY_TYPES[number]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.1
   * 
   * Test that AI_API property types are covered by app property types
   */
  it('AI_API property types should be covered by app property types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AI_API_PROPERTY_TYPES),
        (aiPropertyType) => {
          // Every AI_API property type should be valid in the app
          return isValidPropertyType(aiPropertyType);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.2
   * 
   * Test that all app furnished types can be mapped to AI_API furnished types
   */
  it('all app furnished types should map to valid AI_API furnished types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FURNISHED_TYPES),
        (furnishedType: FurnishedType) => {
          // Every furnished type should have a valid mapping to AI format
          const aiValue = FURNISHED_TO_AI_MAP[furnishedType];
          return isValidAIFurnishedType(aiValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.2
   * 
   * Test that AI_API furnished types can be mapped back to app furnished types
   */
  it('AI_API furnished types should map back to valid app furnished types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AI_FURNISHED_TYPES),
        (aiFurnishedType: AIFurnishedType) => {
          // Every AI furnished type should have a valid mapping back to app format
          const appValue = AI_TO_FURNISHED_MAP[aiFurnishedType];
          return isValidFurnishedType(appValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.2
   * 
   * Test round-trip conversion: app -> AI -> app should preserve value
   */
  it('furnished type round-trip conversion should preserve value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FURNISHED_TYPES),
        (furnishedType: FurnishedType) => {
          // Convert to AI format and back
          const aiValue = FURNISHED_TO_AI_MAP[furnishedType];
          const backToApp = AI_TO_FURNISHED_MAP[aiValue];
          return backToApp === furnishedType;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.1, 8.2
   * 
   * Test that type guards correctly identify valid values
   */
  it('type guards should correctly identify valid property types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...PROPERTY_TYPES),
          fc.string().filter(s => !PROPERTY_TYPES.includes(s as PropertyTypeName))
        ),
        (value: string) => {
          const isValid = isValidPropertyType(value);
          const shouldBeValid = PROPERTY_TYPES.includes(value as PropertyTypeName);
          return isValid === shouldBeValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.1, 8.2
   * 
   * Test that type guards correctly identify valid furnished types
   */
  it('type guards should correctly identify valid furnished types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...FURNISHED_TYPES),
          fc.string().filter(s => !FURNISHED_TYPES.includes(s as FurnishedType))
        ),
        (value: string) => {
          const isValid = isValidFurnishedType(value);
          const shouldBeValid = FURNISHED_TYPES.includes(value as FurnishedType);
          return isValid === shouldBeValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.3
   * 
   * Test that property type enum has exactly 4 values as specified
   */
  it('property types should have exactly 4 values matching AI_API', () => {
    expect(PROPERTY_TYPES.length).toBe(4);
    expect(AI_API_PROPERTY_TYPES.length).toBe(4);
    
    // All values should match
    PROPERTY_TYPES.forEach(type => {
      expect(AI_API_PROPERTY_TYPES).toContain(type);
    });
  });

  /**
   * Feature: rentverse-react-native-app, Property 10: Data Model Alignment
   * Validates: Requirements 8.3
   * 
   * Test that furnished types have exactly 3 values as specified
   */
  it('furnished types should have exactly 3 values', () => {
    expect(FURNISHED_TYPES.length).toBe(3);
    expect(CORE_API_FURNISHED_TYPES.length).toBe(3);
    
    // All values should match
    FURNISHED_TYPES.forEach(type => {
      expect(CORE_API_FURNISHED_TYPES).toContain(type);
    });
  });
});
