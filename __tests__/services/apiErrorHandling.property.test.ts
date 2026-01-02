/**
 * Property-Based Tests for API Error Handling
 * 
 * Feature: rentverse-react-native-app, Property 17: API Error Handling
 * Validates: Requirements 11.3
 * 
 * Tests that API errors are caught and return user-friendly messages.
 */

import * as fc from 'fast-check';
import { handleApiError } from '../../src/services/api';
import { AxiosError } from 'axios';

// Create mock AxiosError for testing
const createMockAxiosError = (
  status?: number,
  message?: string,
  code?: string,
  isNetworkError: boolean = false
): AxiosError => {
  const error = new Error(message || 'Test error') as AxiosError;
  error.isAxiosError = true;
  error.name = 'AxiosError';
  
  if (isNetworkError) {
    error.request = {};
    error.response = undefined;
  } else if (status !== undefined) {
    error.response = {
      status,
      data: { message, code },
      statusText: 'Error',
      headers: {},
      config: {
        headers: {},
      },
    } as AxiosError['response'];
  }
  
  return error;
};

describe('API Error Handling Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that all HTTP error statuses return user-friendly messages
   */
  it('should return user-friendly messages for all HTTP error statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 404, 409, 422, 500, 503),
        (status) => {
          const error = createMockAxiosError(status);
          const result = handleApiError(error);
          
          // Should have a status and message
          return (
            result.status === status &&
            typeof result.message === 'string' &&
            result.message.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that network errors return appropriate message
   */
  it('should handle network errors with appropriate message', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const error = createMockAxiosError(undefined, undefined, undefined, true);
          const result = handleApiError(error);
          
          return (
            result.status === 0 &&
            result.code === 'NETWORK_ERROR' &&
            result.message.toLowerCase().includes('network')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that custom error messages from server are preserved
   */
  it('should preserve custom error messages from server', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 5, maxLength: 100 }),
        (status, customMessage) => {
          const error = createMockAxiosError(status, customMessage);
          const result = handleApiError(error);
          
          // Custom message should be preserved
          return result.message === customMessage;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that error codes are preserved when provided
   */
  it('should preserve error codes when provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (status, message, code) => {
          const error = createMockAxiosError(status, message, code);
          const result = handleApiError(error);
          
          return result.code === code;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that unknown errors are handled gracefully
   */
  it('should handle unknown errors gracefully', () => {
    const error = new Error('Unknown error') as AxiosError;
    error.isAxiosError = true;
    error.name = 'AxiosError';
    // No response or request set
    
    const result = handleApiError(error);
    
    expect(result.status).toBe(-1);
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test that error messages are never empty
   */
  it('should never return empty error messages', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 400, max: 599 }),
          fc.constant(0), // Network error
          fc.constant(-1), // Unknown error
        ),
        (status) => {
          let error: AxiosError;
          
          if (status === 0) {
            error = createMockAxiosError(undefined, undefined, undefined, true);
          } else if (status === -1) {
            error = new Error('Unknown') as AxiosError;
            error.isAxiosError = true;
            error.name = 'AxiosError';
          } else {
            error = createMockAxiosError(status);
          }
          
          const result = handleApiError(error);
          
          return (
            typeof result.message === 'string' &&
            result.message.trim().length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 17: API Error Handling
   * Validates: Requirements 11.3
   * 
   * Test specific error status messages
   */
  describe('specific error status messages', () => {
    it('should return authentication message for 401', () => {
      const error = createMockAxiosError(401);
      const result = handleApiError(error);
      expect(result.message.toLowerCase()).toMatch(/auth|login/);
    });

    it('should return permission message for 403', () => {
      const error = createMockAxiosError(403);
      const result = handleApiError(error);
      expect(result.message.toLowerCase()).toMatch(/permission/);
    });

    it('should return not found message for 404', () => {
      const error = createMockAxiosError(404);
      const result = handleApiError(error);
      expect(result.message.toLowerCase()).toMatch(/not found/);
    });

    it('should return server error message for 500', () => {
      const error = createMockAxiosError(500);
      const result = handleApiError(error);
      expect(result.message.toLowerCase()).toMatch(/server/);
    });

    it('should return service unavailable message for 503', () => {
      const error = createMockAxiosError(503);
      const result = handleApiError(error);
      expect(result.message.toLowerCase()).toMatch(/unavailable|later/);
    });
  });
});
