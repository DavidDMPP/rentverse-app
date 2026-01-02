/**
 * Authentication Service
 * 
 * Handles user authentication operations:
 * - Login
 * - Register
 * - Logout
 * - Token refresh
 * - Get current user
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1
 */

import { coreApi, setAuthToken, removeAuthToken, getAuthToken } from './api';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
} from '../types';

// Email validation regex
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate login request
 * Requirements: 1.3
 */
export const validateLoginRequest = (request: LoginRequest): ValidationResult => {
  const errors: string[] = [];

  if (!request.email || request.email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(request.email)) {
    errors.push('Invalid email format');
  }

  if (!request.password || request.password.trim() === '') {
    errors.push('Password is required');
  } else if (request.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate registration request
 * Requirements: 1.4
 */
export const validateRegisterRequest = (request: RegisterRequest): ValidationResult => {
  const errors: string[] = [];

  if (!request.email || request.email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(request.email)) {
    errors.push('Invalid email format');
  }

  if (!request.password || request.password.trim() === '') {
    errors.push('Password is required');
  } else if (request.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!request.firstName || request.firstName.trim() === '') {
    errors.push('First name is required');
  }

  if (!request.lastName || request.lastName.trim() === '') {
    errors.push('Last name is required');
  }

  if (!request.dateOfBirth || request.dateOfBirth.trim() === '') {
    errors.push('Date of birth is required');
  }

  if (!request.phone || request.phone.trim() === '') {
    errors.push('Phone number is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};


/**
 * Login user with email and password
 * Requirements: 1.2, 1.3
 * 
 * @param credentials - Login credentials (email, password)
 * @returns AuthResponse with user and token
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const validation = validateLoginRequest(credentials);
  if (!validation.isValid) {
    throw {
      status: 400,
      message: validation.errors[0],
      code: 'VALIDATION_ERROR',
    };
  }

  const response = await coreApi.post<AuthResponse>('/auth/login', credentials);
  
  if (response.data.data?.token) {
    await setAuthToken(response.data.data.token);
  }
  
  return response.data;
};

/**
 * Register new user
 * Requirements: 1.4
 * 
 * @param userData - Registration data
 * @returns AuthResponse with user and token
 */
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const validation = validateRegisterRequest(userData);
  if (!validation.isValid) {
    throw {
      status: 400,
      message: validation.errors[0],
      code: 'VALIDATION_ERROR',
    };
  }

  const response = await coreApi.post<AuthResponse>('/auth/register', userData);
  
  if (response.data.data?.token) {
    await setAuthToken(response.data.data.token);
  }
  
  return response.data;
};

/**
 * Logout current user
 * Requirements: 1.5
 * 
 * Clears stored authentication token
 */
export const logout = async (): Promise<void> => {
  await removeAuthToken();
};

/**
 * Refresh authentication token
 * 
 * @returns New AuthResponse with refreshed token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await coreApi.post<AuthResponse>('/auth/refresh');
  
  if (response.data.data?.token) {
    await setAuthToken(response.data.data.token);
  }
  
  return response.data;
};

/**
 * Get current authenticated user
 * Requirements: 1.1
 * 
 * @returns Current user data or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await coreApi.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 * 
 * @returns true if user has a stored token
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Update user profile
 * 
 * @param data - Partial user data to update
 * @returns Updated user data
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await coreApi.put<ApiResponse<User>>('/users/profile', data);
  return response.data.data;
};

export default {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  isAuthenticated,
  updateProfile,
  validateLoginRequest,
  validateRegisterRequest,
  isValidEmail,
};
