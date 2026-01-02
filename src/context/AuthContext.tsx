/**
 * Authentication Context
 * 
 * Provides authentication state and functions throughout the app:
 * - User state management
 * - Token persistence with expo-secure-store
 * - Login, register, logout functions
 * - Auto-login on app start
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 11.4
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '../types';
import * as authService from '../services/authService';
import { getAuthToken, removeAuthToken } from '../services/api';

// Storage key for role preference
const ROLE_PREFERENCE_KEY = 'rentverse_role_preference';

/**
 * Get stored role preference
 */
const getStoredRolePreference = async (): Promise<UserRole | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ROLE_PREFERENCE_KEY) as UserRole | null;
    }
    // For native, we could use AsyncStorage but for simplicity return null
    return null;
  } catch {
    return null;
  }
};

/**
 * Store role preference
 */
const storeRolePreference = async (role: UserRole): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(ROLE_PREFERENCE_KEY, role);
    }
  } catch {
    // Silently fail
  }
};

/**
 * Clear role preference
 */
const clearRolePreference = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ROLE_PREFERENCE_KEY);
    }
  } catch {
    // Silently fail
  }
};

/**
 * Auth context state interface
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Auth context value interface
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest, selectedRole?: UserRole) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

/**
 * Default auth state
 */
const defaultAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

/**
 * Auth context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * 
 * Wraps the app and provides authentication state and functions.
 * Implements auto-login on app start by checking for stored token.
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 11.4
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on app start
   * Checks for stored token and fetches current user
   * Requirements: 1.1
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getAuthToken();
      
      if (storedToken) {
        setToken(storedToken);
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          // Check for stored role preference and override if backend returns USER
          // Backend: USER = Tenant, ADMIN = Provider
          const storedRole = await getStoredRolePreference();
          if (storedRole && storedRole !== currentUser.role) {
            // Use stored role preference
            setUser({ ...currentUser, role: storedRole });
          } else {
            setUser(currentUser);
          }
        } else {
          // Token is invalid, clear it
          await removeAuthToken();
          await clearRolePreference();
          setToken(null);
        }
      }
    } catch {
      // Clear invalid auth state
      await removeAuthToken();
      await clearRolePreference();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-login on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Login user with credentials
   * Requirements: 1.2
   */
  const login = useCallback(async (credentials: LoginRequest, selectedRole?: UserRole): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        // Store the user with their actual role from backend
        // Backend: USER = Tenant, ADMIN = Provider
        const userFromBackend = response.data.user;
        const tokenFromBackend = response.data.token;
        
        // Use the role selected by user in login screen if provided
        // This overrides the backend role to match user's selection
        let finalRole = userFromBackend.role;
        if (selectedRole) {
          finalRole = selectedRole;
          console.log('Using selected role from login screen:', selectedRole);
        }
        
        // Store role preference for future sessions
        await storeRolePreference(finalRole);
        
        const finalUser = { ...userFromBackend, role: finalRole };
        
        console.log('Login successful - Setting user:', finalUser.email, 'Role:', finalUser.role);
        console.log('Login successful - Token exists:', !!tokenFromBackend);
        
        // Set both user and token together before setting isLoading to false
        setUser(finalUser);
        setToken(tokenFromBackend);
        
        return {
          ...response,
          data: {
            ...response.data,
            user: finalUser,
          },
        };
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   * Requirements: 1.4
   */
  const register = useCallback(async (userData: RegisterRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        // Store role preference from registration
        // Backend: USER = Tenant, ADMIN = Provider
        const selectedRole: UserRole = userData.role === 'ADMIN' ? 'ADMIN' : 'USER';
        await storeRolePreference(selectedRole);
        
        // Override user role with selected role
        const userWithRole = { ...response.data.user, role: selectedRole };
        setUser(userWithRole);
        setToken(response.data.token);
        
        return {
          ...response,
          data: {
            ...response.data,
            user: userWithRole,
          },
        };
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout current user
   * Clears session and token
   * Requirements: 1.5
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      await clearRolePreference();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch {
      // Silently fail, user state remains unchanged
    }
  }, []);

  /**
   * Update current user data
   */
  const updateUser = useCallback(async (data: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 * 
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Export for testing purposes
 */
export { AuthContext };

export default AuthProvider;
