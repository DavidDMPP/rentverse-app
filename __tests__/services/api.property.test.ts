/**
 * Property-Based Tests for API Service
 * 
 * Feature: rentverse-react-native-app, Property 16: Auth Header Inclusion
 * Validates: Requirements 11.5
 * 
 * Tests that authenticated requests include Bearer token in Authorization header.
 */

import * as fc from 'fast-check';
import { hasAuthHeader } from '../../src/services/api';
import { InternalAxiosRequestConfig } from 'axios';

describe('API Service Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 16: Auth Header Inclusion
   * Validates: Requirements 11.5
   * 
   * Test that hasAuthHeader correctly identifies Bearer token presence
   */
  it('should correctly identify requests with Bearer token', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 500 }), // JWT-like tokens
        (token: string) => {
          const config: InternalAxiosRequestConfig = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          } as InternalAxiosRequestConfig;
          
          return hasAuthHeader(config) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 16: Auth Header Inclusion
   * Validates: Requirements 11.5
   * 
   * Test that hasAuthHeader returns false for requests without Bearer token
   */
  it('should return false for requests without Bearer token', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
          fc.string().filter(s => !s.startsWith('Bearer ')),
          fc.constant('Basic sometoken'),
        ),
        (authValue) => {
          const config: InternalAxiosRequestConfig = {
            headers: authValue !== undefined && authValue !== null
              ? { Authorization: authValue }
              : {},
          } as InternalAxiosRequestConfig;
          
          return hasAuthHeader(config) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 16: Auth Header Inclusion
   * Validates: Requirements 11.5
   * 
   * Test that Bearer token format is preserved correctly
   */
  it('should preserve Bearer token format in Authorization header', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes(' ')),
        (token: string) => {
          const expectedHeader = `Bearer ${token}`;
          const config: InternalAxiosRequestConfig = {
            headers: {
              Authorization: expectedHeader,
            },
          } as InternalAxiosRequestConfig;
          
          // Verify the header starts with "Bearer " and contains the token
          const authHeader = config.headers?.Authorization?.toString();
          return authHeader === expectedHeader && hasAuthHeader(config);
        }
      ),
      { numRuns: 100 }
    );
  });
});
