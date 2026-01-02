/**
 * Base API Configuration
 * 
 * Configures axios instances for Core API and AI API with:
 * - Base URLs
 * - Request interceptor for JWT token injection
 * - Response interceptor for error handling
 * 
 * Requirements: 11.1, 11.4, 11.5
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ApiError } from '../types';

// API Base URLs
// Production: Cloudflare Tunnel static domains
const CORE_API_HOST = 'rentverse-api.daviddmpp.my.id';
const AI_API_HOST = 'rentverse-ai.daviddmpp.my.id';

export const API_CONFIG = {
  CORE_API_URL: `https://${CORE_API_HOST}/api/v1/m`,
  CORE_API_URL_BASE: `https://${CORE_API_HOST}/api/v1`,
  AI_API_URL: `https://${AI_API_HOST}`,
  TOKEN_KEY: 'auth_token',
} as const;

/**
 * Get stored authentication token
 * Uses localStorage for web, SecureStore for native
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(API_CONFIG.TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Store authentication token securely
 * Uses localStorage for web, SecureStore for native
 */
export const setAuthToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(API_CONFIG.TOKEN_KEY, token);
};

/**
 * Remove stored authentication token
 * Uses localStorage for web, SecureStore for native
 */
export const removeAuthToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(API_CONFIG.TOKEN_KEY);
};

/**
 * Handle API errors and return user-friendly messages
 * Requirements: 11.3
 */
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    const data = error.response.data as { message?: string; code?: string };
    return {
      status: error.response.status,
      message: data?.message || getDefaultErrorMessage(error.response.status),
      code: data?.code,
    };
  } else if (error.request) {
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }
  return {
    status: -1,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};

/**
 * Get default error message based on HTTP status code
 */
const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. The resource may already exist.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};


/**
 * Create request interceptor for JWT token injection
 * Requirements: 11.5
 */
const createAuthInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

/**
 * Create response interceptor for error handling
 * Requirements: 11.3
 */
const createErrorInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError = handleApiError(error);
      return Promise.reject(apiError);
    }
  );
};

/**
 * Core API axios instance
 * For authentication, properties, users, favorites, bookings, etc.
 * Requirements: 11.1
 */
export const coreApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.CORE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply interceptors to Core API
createAuthInterceptor(coreApi);
createErrorInterceptor(coreApi);

/**
 * Core API Base axios instance (non-mobile endpoints)
 * For endpoints that don't have /m/ prefix like POST /properties
 */
export const coreApiBase: AxiosInstance = axios.create({
  baseURL: API_CONFIG.CORE_API_URL_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply interceptors to Core API Base
createAuthInterceptor(coreApiBase);
createErrorInterceptor(coreApiBase);

/**
 * AI API axios instance
 * For price prediction and listing approval
 * Requirements: 11.2
 */
export const aiApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.AI_API_URL,
  timeout: 60000, // Longer timeout for AI predictions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply error interceptor to AI API (no auth needed)
createErrorInterceptor(aiApi);

/**
 * Helper to check if request has auth header
 * Used for testing Property 16
 */
export const hasAuthHeader = (config: InternalAxiosRequestConfig): boolean => {
  return !!config.headers?.Authorization?.toString().startsWith('Bearer ');
};

export default { coreApi, aiApi };
