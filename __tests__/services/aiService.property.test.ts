/**
 * Property-Based Tests for AI Service
 * 
 * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
 * Validates: Requirements 7.2, 7.4
 * 
 * Tests that AI prediction response contains predicted_price, price_range, and currency.
 */

import * as fc from 'fast-check';
import {
  isValidPredictionResponse,
  validatePredictionRequest,
  createPredictionRequest,
  toAIFurnishedType,
} from '../../src/services/aiService';
import {
  PredictionRequest,
  PredictionResponse,
  PROPERTY_TYPES,
  FURNISHED_TYPES,
  AI_FURNISHED_TYPES,
  PropertyTypeName,
  FurnishedType,
  AIFurnishedType,
} from '../../src/types';

// Valid prediction response arbitrary
const validPredictionResponseArbitrary = fc.record<PredictionResponse>({
  status: fc.constant('success'),
  predicted_price: fc.integer({ min: 100, max: 100000 }),
  price_range: fc.record({
    min: fc.integer({ min: 50, max: 50000 }),
    max: fc.integer({ min: 50001, max: 150000 }),
  }),
  confidence_score: fc.double({ min: 0, max: 1 }),
  currency: fc.constant('RM'),
  model_version: fc.string({ minLength: 1, maxLength: 20 }),
  features_used: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
});

// Valid non-whitespace string arbitrary for location
const nonWhitespaceStringArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Valid prediction request arbitrary
const validPredictionRequestArbitrary = fc.record<PredictionRequest>({
  property_type: fc.constantFrom(...PROPERTY_TYPES),
  bedrooms: fc.integer({ min: 1, max: 10 }),
  bathrooms: fc.integer({ min: 1, max: 10 }),
  area: fc.integer({ min: 10, max: 10000 }),
  furnished: fc.constantFrom(...AI_FURNISHED_TYPES),
  location: nonWhitespaceStringArbitrary,
});

describe('AI Service Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
   * Validates: Requirements 7.2, 7.4
   * 
   * Test that valid responses are correctly identified
   */
  it('should correctly identify valid prediction responses', () => {
    fc.assert(
      fc.property(
        validPredictionResponseArbitrary,
        (response) => {
          return isValidPredictionResponse(response) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
   * Validates: Requirements 7.2, 7.4
   * 
   * Test that responses must have predicted_price as number
   */
  it('should reject responses without numeric predicted_price', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.string(),
          fc.boolean(),
          fc.constant({}),
        ),
        (invalidPrice) => {
          const response = {
            predicted_price: invalidPrice,
            price_range: { min: 1000, max: 2000 },
            currency: 'RM',
          };
          return isValidPredictionResponse(response) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
   * Validates: Requirements 7.2, 7.4
   * 
   * Test that responses must have price_range with min and max
   */
  it('should reject responses without valid price_range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant({}),
          fc.constant({ min: 'invalid' }),
          fc.constant({ max: 1000 }),
          fc.constant({ min: 1000 }),
        ),
        (invalidRange) => {
          const response = {
            predicted_price: 1500,
            price_range: invalidRange,
            currency: 'RM',
          };
          return isValidPredictionResponse(response) === false;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
   * Validates: Requirements 7.2, 7.4
   * 
   * Test that responses must have currency as string
   */
  it('should reject responses without string currency', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.integer(),
          fc.boolean(),
        ),
        (invalidCurrency) => {
          const response = {
            predicted_price: 1500,
            price_range: { min: 1000, max: 2000 },
            currency: invalidCurrency,
          };
          return isValidPredictionResponse(response) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 9: AI Prediction Response Format
   * Validates: Requirements 7.2, 7.4
   * 
   * Test that null/undefined responses are rejected
   */
  it('should reject null or undefined responses', () => {
    expect(isValidPredictionResponse(null)).toBe(false);
    expect(isValidPredictionResponse(undefined)).toBe(false);
  });

  /**
   * Test that valid prediction requests pass validation
   */
  it('should accept valid prediction requests', () => {
    fc.assert(
      fc.property(
        validPredictionRequestArbitrary,
        (request) => {
          const result = validatePredictionRequest(request);
          return result.isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that invalid property types are rejected
   */
  it('should reject invalid property types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !PROPERTY_TYPES.includes(s as PropertyTypeName)),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 10, max: 10000 }),
        fc.constantFrom(...AI_FURNISHED_TYPES),
        fc.string({ minLength: 1, maxLength: 100 }),
        (propertyType, bedrooms, bathrooms, area, furnished, location) => {
          const request: PredictionRequest = {
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

  /**
   * Test that createPredictionRequest produces valid requests
   */
  it('createPredictionRequest should produce valid requests', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROPERTY_TYPES),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 10, max: 10000 }),
        fc.constantFrom(...FURNISHED_TYPES),
        nonWhitespaceStringArbitrary, // Use non-whitespace string for valid location
        (propertyType: PropertyTypeName, bedrooms, bathrooms, area, furnished: FurnishedType, location) => {
          const request = createPredictionRequest(
            propertyType,
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
   * Test furnished type conversion
   */
  it('should correctly convert furnished types to AI format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FURNISHED_TYPES),
        (furnished: FurnishedType) => {
          const aiFormat = toAIFurnishedType(furnished);
          return AI_FURNISHED_TYPES.includes(aiFormat);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that furnished type conversion is deterministic
   */
  it('furnished type conversion should be deterministic', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FURNISHED_TYPES),
        (furnished: FurnishedType) => {
          const result1 = toAIFurnishedType(furnished);
          const result2 = toAIFurnishedType(furnished);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
