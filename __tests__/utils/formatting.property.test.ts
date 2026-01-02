/**
 * Property-Based Tests for Currency Formatting
 * 
 * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
 * Validates: Requirements 8.4
 * 
 * Tests that all prices are formatted with RM prefix (Malaysian Ringgit).
 */

import * as fc from 'fast-check';
import { formatCurrency, formatDate, formatDateRange } from '../../src/utils/formatting';

describe('Currency Format Consistency Properties', () => {
  /**
   * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
   * Validates: Requirements 8.4
   * 
   * Test that all prices are formatted with RM prefix
   */
  it('currency should always be formatted with RM prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }),
        (price: number) => {
          const formatted = formatCurrency(price);
          return formatted.startsWith('RM');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
   * Validates: Requirements 8.4
   * 
   * Test that negative prices also have RM prefix
   */
  it('negative prices should also have RM prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000000, max: -1 }),
        (price: number) => {
          const formatted = formatCurrency(price);
          return formatted.startsWith('RM');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
   * Validates: Requirements 8.4
   * 
   * Test that decimal prices are formatted correctly with RM prefix
   */
  it('decimal prices should be formatted with RM prefix and 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000000, noNaN: true }),
        (price: number) => {
          const formatted = formatCurrency(price);
          // Should start with RM
          if (!formatted.startsWith('RM')) return false;
          // Should have exactly 2 decimal places
          const decimalMatch = formatted.match(/\.\d{2}$/);
          return decimalMatch !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
   * Validates: Requirements 8.4
   * 
   * Test that zero price is formatted correctly
   */
  it('zero price should be formatted as RM 0.00', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toBe('RM 0.00');
  });

  /**
   * Feature: rentverse-react-native-app, Property 11: Currency Format Consistency
   * Validates: Requirements 8.4
   * 
   * Test that formatted currency contains the numeric value
   */
  it('formatted currency should represent the original value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (price: number) => {
          const formatted = formatCurrency(price);
          // Remove RM prefix and spaces, then parse
          const numericPart = formatted.replace(/RM\s*/, '').replace(/,/g, '');
          const parsedValue = parseFloat(numericPart);
          return Math.abs(parsedValue - price) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Date Formatting Properties', () => {
  /**
   * Test that valid dates are formatted without error
   */
  it('valid dates should be formatted without returning Invalid Date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') })
          .filter((d: Date) => !isNaN(d.getTime())),
        (date: Date) => {
          const formatted = formatDate(date);
          return formatted !== 'Invalid Date';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that ISO date strings are formatted correctly
   */
  it('ISO date strings should be formatted correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
        (date: Date) => {
          const isoString = date.toISOString();
          const formatted = formatDate(isoString);
          return formatted !== 'Invalid Date';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that date range formatting works correctly
   */
  it('date range should format both dates correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') })
          .filter((d: Date) => !isNaN(d.getTime())),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') })
          .filter((d: Date) => !isNaN(d.getTime())),
        (startDate: Date, endDate: Date) => {
          const formatted = formatDateRange(startDate, endDate);
          // Should contain a separator
          return formatted.includes(' - ') && formatted !== 'Invalid Date Range';
        }
      ),
      { numRuns: 100 }
    );
  });
});
