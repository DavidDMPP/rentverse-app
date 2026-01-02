/**
 * Property-Based Tests for Booking Approval/Rejection
 * 
 * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
 * Validates: Requirements 10.7
 * 
 * Tests that:
 * - Approve changes status to APPROVED
 * - Reject changes status to REJECTED
 */

import * as fc from 'fast-check';
import {
  canApproveBooking,
  canRejectBooking,
  applyApprovalStatus,
  applyRejectionStatus,
} from '../../src/services/bookingService';
import {
  Booking,
  BookingStatus,
  BOOKING_STATUSES,
} from '../../src/types';

// Helper to generate valid dates
const validDateArbitrary = (min: Date, max: Date) =>
  fc.date({ min, max }).filter((d) => !isNaN(d.getTime()));

// Booking arbitrary for testing
const bookingArbitrary = fc.record<Booking>({
  id: fc.uuid(),
  propertyId: fc.uuid(),
  property: fc.constant(undefined) as fc.Arbitrary<undefined>,
  tenantId: fc.uuid(),
  tenant: fc.constant(undefined) as fc.Arbitrary<undefined>,
  landlordId: fc.uuid(),
  landlord: fc.constant(undefined) as fc.Arbitrary<undefined>,
  startDate: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(
    (d) => d.toISOString()
  ),
  endDate: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(
    (d) => d.toISOString()
  ),
  rentAmount: fc.integer({ min: 100, max: 100000 }),
  currencyCode: fc.constant('MYR'),
  securityDeposit: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
  status: fc.constantFrom(...BOOKING_STATUSES),
  notes: fc.option(fc.string(), { nil: undefined }),
  createdAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(
    (d) => d.toISOString()
  ),
  updatedAt: validDateArbitrary(new Date('2020-01-01'), new Date('2030-12-31')).map(
    (d) => d.toISOString()
  ),
});

// Pending booking arbitrary (only PENDING status)
const pendingBookingArbitrary = bookingArbitrary.map((booking) => ({
  ...booking,
  status: 'PENDING' as BookingStatus,
}));

// Non-pending booking arbitrary (any status except PENDING)
const nonPendingBookingArbitrary = bookingArbitrary.filter(
  (booking) => booking.status !== 'PENDING'
);

describe('Booking Approval/Rejection Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that approving a PENDING booking changes status to APPROVED
   */
  it('approving a PENDING booking should change status to APPROVED', () => {
    fc.assert(
      fc.property(pendingBookingArbitrary, (booking) => {
        const approved = applyApprovalStatus(booking);

        // Status should be APPROVED
        return approved.status === 'APPROVED';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that rejecting a PENDING booking changes status to REJECTED
   */
  it('rejecting a PENDING booking should change status to REJECTED', () => {
    fc.assert(
      fc.property(pendingBookingArbitrary, (booking) => {
        const rejected = applyRejectionStatus(booking);

        // Status should be REJECTED
        return rejected.status === 'REJECTED';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that rejection reason is stored in notes
   */
  it('rejection reason should be stored in booking notes', () => {
    fc.assert(
      fc.property(
        pendingBookingArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (booking, reason) => {
          const rejected = applyRejectionStatus(booking, reason);

          // Notes should contain the rejection reason
          return rejected.notes === reason;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that only PENDING bookings can be approved
   */
  it('only PENDING bookings can be approved', () => {
    fc.assert(
      fc.property(bookingArbitrary, (booking) => {
        const canApprove = canApproveBooking(booking);

        // Should only return true for PENDING status
        return canApprove === (booking.status === 'PENDING');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that only PENDING bookings can be rejected
   */
  it('only PENDING bookings can be rejected', () => {
    fc.assert(
      fc.property(bookingArbitrary, (booking) => {
        const canReject = canRejectBooking(booking);

        // Should only return true for PENDING status
        return canReject === (booking.status === 'PENDING');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that non-PENDING bookings remain unchanged when approval is attempted
   */
  it('non-PENDING bookings should remain unchanged when approval is attempted', () => {
    fc.assert(
      fc.property(nonPendingBookingArbitrary, (booking) => {
        const result = applyApprovalStatus(booking);

        // Status should remain the same
        return result.status === booking.status;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that non-PENDING bookings remain unchanged when rejection is attempted
   */
  it('non-PENDING bookings should remain unchanged when rejection is attempted', () => {
    fc.assert(
      fc.property(nonPendingBookingArbitrary, (booking) => {
        const result = applyRejectionStatus(booking, 'Some reason');

        // Status should remain the same
        return result.status === booking.status;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that approval preserves all other booking fields
   */
  it('approval should preserve all other booking fields', () => {
    fc.assert(
      fc.property(pendingBookingArbitrary, (booking) => {
        const approved = applyApprovalStatus(booking);

        // All fields except status and updatedAt should be preserved
        return (
          approved.id === booking.id &&
          approved.propertyId === booking.propertyId &&
          approved.tenantId === booking.tenantId &&
          approved.landlordId === booking.landlordId &&
          approved.startDate === booking.startDate &&
          approved.endDate === booking.endDate &&
          approved.rentAmount === booking.rentAmount &&
          approved.currencyCode === booking.currencyCode
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 15: Booking Approval/Rejection
   * Validates: Requirements 10.7
   *
   * Test that rejection preserves all other booking fields (except notes)
   */
  it('rejection should preserve all other booking fields except notes', () => {
    fc.assert(
      fc.property(pendingBookingArbitrary, (booking) => {
        const rejected = applyRejectionStatus(booking);

        // All fields except status, notes, and updatedAt should be preserved
        return (
          rejected.id === booking.id &&
          rejected.propertyId === booking.propertyId &&
          rejected.tenantId === booking.tenantId &&
          rejected.landlordId === booking.landlordId &&
          rejected.startDate === booking.startDate &&
          rejected.endDate === booking.endDate &&
          rejected.rentAmount === booking.rentAmount &&
          rejected.currencyCode === booking.currencyCode
        );
      }),
      { numRuns: 100 }
    );
  });
});
