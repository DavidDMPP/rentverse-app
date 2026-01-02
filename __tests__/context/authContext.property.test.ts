/**
 * Property-Based Tests for Auth Context
 * 
 * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
 * Validates: Requirements 1.5
 * 
 * Tests that after logout, token is null and session is cleared.
 */

import * as fc from 'fast-check';
import * as SecureStore from 'expo-secure-store';
import { removeAuthToken } from '../../src/services/api';
import { logout } from '../../src/services/authService';

describe('Auth Context Properties', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
   * Validates: Requirements 1.5
   * 
   * Test that after logout, the stored token is removed via deleteItemAsync
   */
  it('should clear token after logout for any authenticated session', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JWT-like tokens
        fc.string({ minLength: 10, maxLength: 500 }),
        async (token) => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Setup: Mock deleteItemAsync
          (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
          
          // Action: Perform logout
          await logout();
          
          // Verify: deleteItemAsync was called to remove the token
          expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
   * Validates: Requirements 1.5
   * 
   * Test that logout always calls removeAuthToken regardless of initial state
   */
  it('should always attempt to remove token on logout', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various scenarios
        fc.integer({ min: 1, max: 10 }),
        async () => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Setup
          (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
          
          // Action
          await logout();
          
          // Verify: deleteItemAsync is always called
          expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
   * Validates: Requirements 1.5
   * 
   * Test that removeAuthToken correctly uses the TOKEN_KEY constant
   */
  it('should use correct token key when removing auth token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async () => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Setup
          (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
          
          // Action
          await removeAuthToken();
          
          // Verify: Called with the correct key
          expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
   * Validates: Requirements 1.5
   * 
   * Test that logout clears token state - simulating the full flow
   */
  it('should result in null token after logout operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tokens that could have been stored
        fc.string({ minLength: 10, maxLength: 200 }),
        async (initialToken) => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Setup: Track token state
          let tokenStore: string | null = initialToken;
          
          (SecureStore.getItemAsync as jest.Mock).mockImplementation(async () => tokenStore);
          (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async () => {
            tokenStore = null;
            return undefined;
          });
          
          // Action: Logout
          await logout();
          
          // Verify: Token store is now null
          expect(tokenStore).toBeNull();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: rentverse-react-native-app, Property 2: Logout Clears Session
   * Validates: Requirements 1.5
   * 
   * Test that logout is idempotent - calling it multiple times has same effect
   */
  it('should be idempotent - multiple logouts should not cause errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of logout calls
        fc.string({ minLength: 10 }),
        async (logoutCount, initialToken) => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Setup: Track token state
          let tokenStore: string | null = initialToken;
          
          (SecureStore.getItemAsync as jest.Mock).mockImplementation(async () => tokenStore);
          (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async () => {
            tokenStore = null;
            return undefined;
          });
          
          // Action: Call logout multiple times
          for (let i = 0; i < logoutCount; i++) {
            await logout();
          }
          
          // Verify: Token store is null after any number of logouts
          expect(tokenStore).toBeNull();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
