/**
 * Property-Based Tests for Booking Service
 * 
 * Feature: rentverse-react-native-app, Property 12: Booking Creation Payload
 * Feature: rentverse-react-native-app, Property 13: Booking Status Filter
 * Validates: Requirements 10.2, 10.4
 * 
 * Tests that booking payload has required fields and
 * filtered bookings match status.
 */

import * as fc from 'fast-check';
import {
  createBookingPayload,
  filterBookingsByStatus,
  validateBookingDates,
} from '../../src/services/bookingService';
import {
  Booking,
  BookingStatus,
  BOOKING_STATUSES,
} from '../../src/types';

// Helper to generate valid dates
const validDateArbitrary = (min: Date, max: Date) => 
  fc.date({ min, max }).filter(d => !isNaN(d.getTime()));

// Booking arbitrary for testing
const bookingArbitrary = fc.record<Booking>({
  id: fc.uuid(),
  propertyId: fc.uuid(),
  property: fc.constant(undefined) as fc.Arbitrary<undefined>,
  tenantId: fc.uuid(),
  tenant: fc.constant(undefined) as fc.Arbitrary<undefined>,
  landlordId: fc.uuid(),
  landlord: fc.constant(undefined) as fc.Arbitrary<undefined>,
  startDate: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  endDate: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  rentAmount: fc.integer({ min: 100, max: 100000 }),
  currencyCode: fc.constant('MYR'),
  securityDeposit: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
  status: fc.constantFrom(...BOOKING_STATUSES),
  notes: fc.option(fc.string(), { nil: undefined }),
  createdAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
  updatedAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(d => d.toISOString()),
});

describe('Booking Service Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 12: Booking Creation Payload
   * Validates: Requirements 10.2
   * 
   * Test that booking payload has required fields (propertyId, startDate, endDate)
   */
  it('booking payload should have required fields', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
        (propertyId, startDate, endDate, message) => {
          const payload = createBookingPayload(propertyId, startDate, endDate, message);
          
          // Required fields must be present and have correct types
          return (
            typeof payload.propertyId === 'string' &&
            payload.propertyId.length > 0 &&
            typeof payload.startDate === 'string' &&
            payload.startDate.length > 0 &&
            typeof payload.endDate === 'string' &&
            payload.endDate.length > 0 &&
            (payload.message === undefined || typeof payload.message === 'string')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 12: Booking Creation Payload
   * Validates: Requirements 10.2
   * 
   * Test that dates are formatted as ISO strings
   */
  it('booking payload dates should be ISO formatted strings', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        (propertyId, startDate, endDate) => {
          const payload = createBookingPayload(propertyId, startDate, endDate);
          
          // Dates should be valid ISO strings
          const parsedStart = new Date(payload.startDate);
          const parsedEnd = new Date(payload.endDate);
          
          return (
            !isNaN(parsedStart.getTime()) &&
            !isNaN(parsedEnd.getTime())
          );
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Feature: rentverse-react-native-app, Property 12: Booking Creation Payload
   * Validates: Requirements 10.2
   * 
   * Test that message is optional and only included when provided
   */
  it('booking payload should only include message when provided', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        validDateArbitrary(new Date('2024-01-01'), new Date('2030-12-31')),
        (propertyId, startDate, endDate) => {
          // Without message
          const payloadWithoutMessage = createBookingPayload(propertyId, startDate, endDate);
          const hasNoMessage = !('message' in payloadWithoutMessage) || payloadWithoutMessage.message === undefined;
          
          // With message
          const payloadWithMessage = createBookingPayload(propertyId, startDate, endDate, 'Test message');
          const hasMessage = payloadWithMessage.message === 'Test message';
          
          return hasNoMessage && hasMessage;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 13: Booking Status Filter
   * Validates: Requirements 10.4
   * 
   * Test that filtered bookings match the specified status
   */
  it('filtered bookings should match status', () => {
    fc.assert(
      fc.property(
        fc.array(bookingArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...BOOKING_STATUSES),
        (bookings, status: BookingStatus) => {
          const filtered = filterBookingsByStatus(bookings, status);
          
          // All filtered bookings should have the matching status
          return filtered.every(b => b.status === status);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 13: Booking Status Filter
   * Validates: Requirements 10.4
   * 
   * Test that filter doesn't miss any matching bookings
   */
  it('filter should include all bookings with matching status', () => {
    fc.assert(
      fc.property(
        fc.array(bookingArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...BOOKING_STATUSES),
        (bookings, status: BookingStatus) => {
          const filtered = filterBookingsByStatus(bookings, status);
          const expectedCount = bookings.filter(b => b.status === status).length;
          
          // Result count should match expected count
          return filtered.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 13: Booking Status Filter
   * Validates: Requirements 10.4
   * 
   * Test that filtering by different statuses produces disjoint sets
   */
  it('filtering by different statuses should produce disjoint sets', () => {
    fc.assert(
      fc.property(
        fc.array(bookingArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...BOOKING_STATUSES),
        fc.constantFrom(...BOOKING_STATUSES),
        (bookings, status1: BookingStatus, status2: BookingStatus) => {
          if (status1 === status2) return true; // Skip if same status
          
          const filtered1 = filterBookingsByStatus(bookings, status1);
          const filtered2 = filterBookingsByStatus(bookings, status2);
          
          // Sets should be disjoint (no common elements)
          const ids1 = new Set(filtered1.map(b => b.id));
          const hasOverlap = filtered2.some(b => ids1.has(b.id));
          
          return !hasOverlap;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test for date validation
   * 
   * Test that past start dates are rejected
   */
  it('should reject start dates in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const result = validateBookingDates(pastDate, futureDate);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('past');
  });

  /**
   * Additional property test for date validation
   * 
   * Test that end date must be after start date
   */
  it('should reject end date before or equal to start date', () => {
    fc.assert(
      fc.property(
        validDateArbitrary(new Date(), new Date('2030-12-31')),
        (startDate) => {
          // End date same as start date
          const result1 = validateBookingDates(startDate, startDate);
          
          // End date before start date
          const beforeStart = new Date(startDate);
          beforeStart.setDate(beforeStart.getDate() - 1);
          const result2 = validateBookingDates(startDate, beforeStart);
          
          return !result1.isValid && !result2.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });
});
