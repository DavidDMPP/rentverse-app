/**
 * Property-Based Tests for Listing Validation
 * 
 * Feature: rentverse-react-native-app, Property 8: Listing Validation
 * Validates: Requirements 6.4
 * 
 * Tests that missing required fields prevent submission and display validation errors.
 */

import * as fc from 'fast-check';
import { validateListingData, ValidationResult } from '../../src/services/propertyService';
import { CreatePropertyRequest, FURNISHED_TYPES, FurnishedType } from '../../src/types';

// Valid property data arbitrary for generating complete listings
const validPropertyDataArbitrary = fc.record<CreatePropertyRequest>({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  propertyTypeId: fc.uuid(),
  address: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  city: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  state: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  price: fc.integer({ min: 1, max: 1000000 }),
  bedrooms: fc.integer({ min: 1, max: 20 }),
  bathrooms: fc.integer({ min: 1, max: 20 }),
  areaSqm: fc.integer({ min: 1, max: 100000 }),
  furnished: fc.constantFrom(...FURNISHED_TYPES) as fc.Arbitrary<FurnishedType>,
  images: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }), { nil: undefined }),
  amenityIds: fc.option(fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }), { nil: undefined }),
});

describe('Listing Validation Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that valid listings pass validation
   */
  it('valid listings should pass validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        (data) => {
          const result: ValidationResult = validateListingData(data);
          return result.isValid === true && Object.keys(result.errors).length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that missing title prevents submission
   */
  it('missing title should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom('', '   ', undefined as unknown as string),
        (data, invalidTitle) => {
          const invalidData = { ...data, title: invalidTitle };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'title' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that invalid price prevents submission
   */
  it('invalid price should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom(0, -1, -100, undefined as unknown as number),
        (data, invalidPrice) => {
          const invalidData = { ...data, price: invalidPrice };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'price' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that invalid bedrooms prevents submission
   */
  it('invalid bedrooms should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom(0, -1, undefined as unknown as number),
        (data, invalidBedrooms) => {
          const invalidData = { ...data, bedrooms: invalidBedrooms };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'bedrooms' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that invalid bathrooms prevents submission
   */
  it('invalid bathrooms should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom(0, -1, undefined as unknown as number),
        (data, invalidBathrooms) => {
          const invalidData = { ...data, bathrooms: invalidBathrooms };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'bathrooms' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that invalid area prevents submission
   */
  it('invalid area should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom(0, -1, undefined as unknown as number),
        (data, invalidArea) => {
          const invalidData = { ...data, areaSqm: invalidArea };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'areaSqm' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that missing propertyTypeId prevents submission
   */
  it('missing propertyTypeId should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom('', '   ', undefined as unknown as string),
        (data, invalidPropertyTypeId) => {
          const invalidData = { ...data, propertyTypeId: invalidPropertyTypeId };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'propertyTypeId' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that missing address prevents submission
   */
  it('missing address should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom('', '   ', undefined as unknown as string),
        (data, invalidAddress) => {
          const invalidData = { ...data, address: invalidAddress };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'address' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that missing city prevents submission
   */
  it('missing city should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom('', '   ', undefined as unknown as string),
        (data, invalidCity) => {
          const invalidData = { ...data, city: invalidCity };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'city' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that missing state prevents submission
   */
  it('missing state should fail validation', () => {
    fc.assert(
      fc.property(
        validPropertyDataArbitrary,
        fc.constantFrom('', '   ', undefined as unknown as string),
        (data, invalidState) => {
          const invalidData = { ...data, state: invalidState };
          const result: ValidationResult = validateListingData(invalidData);
          return result.isValid === false && 'state' in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that multiple missing fields result in multiple errors
   */
  it('multiple missing fields should result in multiple errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.constantFrom('', undefined as unknown as string),
          price: fc.constantFrom(0, undefined as unknown as number),
          bedrooms: fc.constantFrom(0, undefined as unknown as number),
          bathrooms: fc.constantFrom(0, undefined as unknown as number),
          areaSqm: fc.constantFrom(0, undefined as unknown as number),
          propertyTypeId: fc.constantFrom('', undefined as unknown as string),
          address: fc.constantFrom('', undefined as unknown as string),
          city: fc.constantFrom('', undefined as unknown as string),
          state: fc.constantFrom('', undefined as unknown as string),
        }),
        (invalidData) => {
          const result: ValidationResult = validateListingData(invalidData);
          // Should have multiple errors
          return result.isValid === false && Object.keys(result.errors).length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 8: Listing Validation
   * Validates: Requirements 6.4
   * 
   * Test that validation result structure is correct
   */
  it('validation result should have correct structure', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validPropertyDataArbitrary,
          fc.record({
            title: fc.constantFrom('', 'valid title'),
            price: fc.constantFrom(0, 1000),
            bedrooms: fc.constantFrom(0, 2),
            bathrooms: fc.constantFrom(0, 1),
            areaSqm: fc.constantFrom(0, 100),
            propertyTypeId: fc.constantFrom('', 'valid-id'),
            address: fc.constantFrom('', 'valid address'),
            city: fc.constantFrom('', 'valid city'),
            state: fc.constantFrom('', 'valid state'),
          })
        ),
        (data) => {
          const result: ValidationResult = validateListingData(data);
          // Result should always have isValid boolean and errors object
          return (
            typeof result.isValid === 'boolean' &&
            typeof result.errors === 'object' &&
            result.errors !== null
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
