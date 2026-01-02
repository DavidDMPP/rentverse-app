/**
 * Property-Based Tests for Auth Service
 * 
 * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
 * Validates: Requirements 1.3
 * 
 * Tests that invalid email formats are rejected by validation.
 */

import * as fc from 'fast-check';
import {
  validateLoginRequest,
  validateRegisterRequest,
  isValidEmail,
} from '../../src/services/authService';

describe('Auth Service Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that invalid email formats are rejected
   */
  it('should reject invalid email formats', () => {
    fc.assert(
      fc.property(
        // Generate strings that don't contain '@' - definitely invalid emails
        fc.string().filter(s => !s.includes('@')),
        fc.string({ minLength: 6 }), // Valid password length
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          // Should be invalid because email doesn't contain '@'
          return result.isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that emails without domain are rejected
   */
  it('should reject emails without proper domain', () => {
    fc.assert(
      fc.property(
        // Generate emails with @ but no valid domain (no dot after @)
        fc.tuple(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.')),
          fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.'))
        ).map(([local, domain]) => `${local}@${domain}`),
        fc.string({ minLength: 6 }),
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          // Should be invalid because domain has no TLD
          return result.isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that empty emails are rejected
   */
  it('should reject empty or whitespace-only emails', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('     ')
        ),
        fc.string({ minLength: 6 }),
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          return result.isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that short passwords are rejected
   */
  it('should reject passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(), // Valid email
        fc.string({ minLength: 1, maxLength: 5 }), // Too short password
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          return result.isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that valid credentials pass validation
   */
  it('should accept valid email and password combinations', () => {
    // Generate simple valid emails
    const validEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z]{2,4}$/)
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    fc.assert(
      fc.property(
        validEmailArbitrary,
        // Generate passwords that are at least 6 chars and not just whitespace
        fc.string({ minLength: 6, maxLength: 100 }).filter(s => s.trim().length > 0),
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          return result.isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test isValidEmail function consistency
   */
  it('isValidEmail should be consistent with validateLoginRequest', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (email) => {
          const emailValid = isValidEmail(email);
          const loginResult = validateLoginRequest({ 
            email, 
            password: 'validpassword123' 
          });
          
          // If email is valid, login validation should pass (assuming valid password)
          // If email is invalid, login validation should fail
          if (emailValid) {
            return loginResult.isValid === true;
          } else {
            return loginResult.isValid === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 3: Invalid Credentials Rejection
   * Validates: Requirements 1.3
   * 
   * Test that validation errors are descriptive
   */
  it('should provide error messages for invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')), // Invalid email
        fc.string({ minLength: 1, maxLength: 5 }), // Invalid password
        (email, password) => {
          const result = validateLoginRequest({ email, password });
          // Should have at least one error message
          return result.errors.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
