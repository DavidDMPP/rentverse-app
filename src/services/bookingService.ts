/**
 * Booking Service
 * 
 * Handles booking-related operations:
 * - Get bookings with filters
 * - Create booking
 * - Get booking by ID
 * - Cancel booking
 * - Approve/Reject booking (for providers)
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1
 */

import { coreApi } from './api';
import {
  Booking,
  BookingFilters,
  BookingStatus,
  CreateBookingRequest,
  CancelBookingRequest,
  UpdateBookingStatusRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types';

/**
 * Create booking request payload
 * Requirements: 10.2
 * 
 * @param propertyId - Property ID
 * @param startDate - Booking start date
 * @param endDate - Booking end date
 * @param message - Optional message to owner
 * @returns Formatted booking payload
 */
export const createBookingPayload = (
  propertyId: string,
  startDate: Date,
  endDate: Date,
  message?: string | null
): CreateBookingRequest => {
  return {
    propertyId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...(message ? { message } : {}),
  };
};

/**
 * Filter bookings by status (client-side filtering)
 * Requirements: 10.4
 * 
 * @param bookings - Array of bookings to filter
 * @param status - Status to filter by
 * @returns Filtered bookings matching the status
 */
export const filterBookingsByStatus = (
  bookings: Booking[],
  status: BookingStatus
): Booking[] => {
  return bookings.filter(booking => booking.status === status);
};

/**
 * Validate booking dates
 * 
 * @param startDate - Booking start date
 * @param endDate - Booking end date
 * @returns Validation result
 */
export const validateBookingDates = (
  startDate: Date,
  endDate: Date
): { isValid: boolean; error?: string } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (startDate < now) {
    return { isValid: false, error: 'Start date cannot be in the past' };
  }

  if (endDate <= startDate) {
    return { isValid: false, error: 'End date must be after start date' };
  }

  return { isValid: true };
};

/**
 * Check if a booking can be approved
 * Requirements: 10.7
 * 
 * @param booking - Booking to check
 * @returns Whether the booking can be approved
 */
export const canApproveBooking = (booking: Booking): boolean => {
  return booking.status === 'PENDING';
};

/**
 * Check if a booking can be rejected
 * Requirements: 10.7
 * 
 * @param booking - Booking to check
 * @returns Whether the booking can be rejected
 */
export const canRejectBooking = (booking: Booking): boolean => {
  return booking.status === 'PENDING';
};

/**
 * Apply approval status to a booking (client-side state update)
 * Requirements: 10.7
 * 
 * @param booking - Booking to approve
 * @returns Updated booking with APPROVED status, or original if not PENDING
 */
export const applyApprovalStatus = (booking: Booking): Booking => {
  if (booking.status !== 'PENDING') {
    return booking;
  }
  return {
    ...booking,
    status: 'APPROVED' as BookingStatus,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Apply rejection status to a booking (client-side state update)
 * Requirements: 10.7
 * 
 * @param booking - Booking to reject
 * @param reason - Optional rejection reason
 * @returns Updated booking with REJECTED status, or original if not PENDING
 */
export const applyRejectionStatus = (
  booking: Booking,
  reason?: string
): Booking => {
  if (booking.status !== 'PENDING') {
    return booking;
  }
  return {
    ...booking,
    status: 'REJECTED' as BookingStatus,
    notes: reason || booking.notes,
    updatedAt: new Date().toISOString(),
  };
};


/**
 * Get bookings with optional filters
 * Requirements: 10.4, 10.6
 * 
 * @param filters - Optional filter parameters (status, role)
 * @returns Paginated list of bookings
 */
export const getBookings = async (
  filters?: BookingFilters
): Promise<PaginatedResponse<Booking>> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/bookings?${queryString}` : '/bookings';
  
  const response = await coreApi.get<ApiResponse<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(url);
  
  // Transform backend response to match PaginatedResponse format
  const backendData = response.data.data;
  return {
    success: response.data.success,
    data: backendData?.bookings || [],
    pagination: backendData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
};

/**
 * Get booking by ID
 * 
 * @param id - Booking ID
 * @returns Booking details
 */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await coreApi.get<ApiResponse<Booking>>(`/bookings/${id}`);
  return response.data.data;
};

/**
 * Create a new booking
 * Requirements: 10.2, 10.3
 * 
 * @param bookingData - Booking creation data
 * @returns Created booking
 */
export const createBooking = async (
  bookingData: CreateBookingRequest
): Promise<Booking> => {
  const response = await coreApi.post<ApiResponse<Booking>>('/bookings', bookingData);
  return response.data.data;
};

/**
 * Cancel a booking
 * Requirements: 10.5
 * 
 * @param bookingId - Booking ID to cancel
 * @param data - Optional cancellation reason
 * @returns Updated booking with CANCELLED status
 */
export const cancelBooking = async (
  bookingId: string,
  data?: CancelBookingRequest
): Promise<Booking> => {
  const response = await coreApi.post<ApiResponse<Booking>>(
    `/bookings/${bookingId}/cancel`,
    data || {}
  );
  return response.data.data;
};

/**
 * Approve a booking (for providers)
 * Requirements: 10.7
 * 
 * @param bookingId - Booking ID to approve
 * @returns Updated booking with APPROVED status
 */
export const approveBooking = async (bookingId: string): Promise<Booking> => {
  const response = await coreApi.post<ApiResponse<Booking>>(
    `/bookings/${bookingId}/approve`
  );
  return response.data.data;
};

/**
 * Reject a booking (for providers)
 * Requirements: 10.7
 * 
 * @param bookingId - Booking ID to reject
 * @param reason - Optional rejection reason
 * @returns Updated booking with REJECTED status
 */
export const rejectBooking = async (
  bookingId: string,
  reason?: string
): Promise<Booking> => {
  const response = await coreApi.post<ApiResponse<Booking>>(
    `/bookings/${bookingId}/reject`,
    reason ? { reason } : {}
  );
  return response.data.data;
};

/**
 * Get tenant's bookings
 * Requirements: 10.4
 * 
 * @param status - Optional status filter
 * @returns List of tenant's bookings
 */
export const getTenantBookings = async (
  status?: BookingStatus
): Promise<PaginatedResponse<Booking>> => {
  return getBookings({ role: 'tenant', status });
};

/**
 * Get owner's bookings (for providers)
 * Requirements: 10.6
 * 
 * @param status - Optional status filter
 * @returns List of owner's bookings
 */
export const getOwnerBookings = async (
  status?: BookingStatus,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<Booking>> => {
  // Use /bookings with role=owner parameter instead of /bookings/owner-bookings
  return getBookings({ role: 'owner', status, page, limit });
};

export default {
  getBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  getTenantBookings,
  getOwnerBookings,
  createBookingPayload,
  filterBookingsByStatus,
  validateBookingDates,
  canApproveBooking,
  canRejectBooking,
  applyApprovalStatus,
  applyRejectionStatus,
};
