/**
 * Rentverse App Entry Point
 * 
 * Main application component that sets up:
 * - ThemeProvider for dark mode support
 * - AuthProvider for authentication state management
 * - NavigationContainer and AppNavigator for navigation
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * App Content with Theme-aware StatusBar
 */
const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <AuthProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </AuthProvider>
  );
};

/**
 * App Component
 * 
 * Root component that wraps the entire application with:
 * 1. ThemeProvider - Provides theme context with dark mode support
 * 2. AuthProvider - Provides authentication context throughout the app
 * 3. AppNavigator - Handles navigation based on auth state and user role
 * 
 * Navigation flow:
 * - Unauthenticated: Splash -> Login -> Register
 * - Tenant: Home, Search, Saved, Profile tabs
 * - Provider: Dashboard, AI Estimator, Listings, Profile tabs
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
