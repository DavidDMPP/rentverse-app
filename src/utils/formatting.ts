/**
 * Formatting Utilities
 * 
 * Provides consistent formatting functions for currency and dates
 * throughout the Rentverse application.
 * 
 * Requirements: 8.4 - Currency handling in MYR (Malaysian Ringgit)
 */

/**
 * Formats a numeric price value with RM (Malaysian Ringgit) prefix.
 * 
 * @param price - The numeric price value to format (can be number or string)
 * @returns Formatted string with RM prefix (e.g., "RM 1,500.00")
 * 
 * @example
 * formatCurrency(1500) // "RM 1,500.00"
 * formatCurrency("1500.00") // "RM 1,500.00"
 * formatCurrency(0) // "RM 0.00"
 * formatCurrency(1234567.89) // "RM 1,234,567.89"
 */
export function formatCurrency(price: number | string | null | undefined): string {
  // Convert string to number if needed (Prisma Decimal comes as string)
  let numPrice: number;
  
  if (price === null || price === undefined) {
    return 'RM 0.00';
  }
  
  if (typeof price === 'string') {
    numPrice = parseFloat(price);
  } else {
    numPrice = price;
  }
  
  // Handle edge cases
  if (!Number.isFinite(numPrice)) {
    return 'RM 0.00';
  }

  // Format with thousand separators and 2 decimal places
  const formattedNumber = Math.abs(numPrice).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Handle negative values
  if (numPrice < 0) {
    return `RM -${formattedNumber}`;
  }

  return `RM ${formattedNumber}`;
}

/**
 * Formats a date string or Date object into a human-readable format.
 * 
 * @param date - The date to format (ISO string or Date object)
 * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string (e.g., "25 Dec 2025")
 * 
 * @example
 * formatDate('2025-12-25') // "25 Dec 2025"
 * formatDate(new Date(2025, 11, 25)) // "25 Dec 2025"
 * formatDate('2025-12-25', { dateStyle: 'full' }) // "Thursday, 25 December 2025"
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    // Default format: "25 Dec 2025"
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    return dateObj.toLocaleDateString('en-MY', options || defaultOptions);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats a date range for booking display.
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Formatted date range string (e.g., "25 Dec 2025 - 30 Dec 2025")
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date
): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === 'Invalid Date' || end === 'Invalid Date') {
    return 'Invalid Date Range';
  }
  
  return `${start} - ${end}`;
}
