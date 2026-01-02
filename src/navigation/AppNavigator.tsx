/**
 * App Navigator
 * 
 * Main navigation structure for the Rentverse app.
 * Implements conditional navigation based on auth state and user role.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Import Tab Navigators
import TenantTabNavigator from './TenantTabNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';

// Import Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Import Shared Screens
import { PropertyDetailScreen } from '../screens/tenant/PropertyDetailScreen';
import { BookingScreen } from '../screens/tenant/BookingScreen';

// Stack param lists
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  TenantTabs: undefined;
  ProviderTabs: undefined;
  PropertyDetail: { propertyId: string };
  Booking: { propertyId: string };
  BookingManagement: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth Stack Navigator
 * Handles unauthenticated user flow: Splash -> Login -> Register
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * Root Stack Navigator
 * Handles authenticated user flow based on role
 * USER = Tenant, ADMIN = Provider
 */
const RootNavigator: React.FC = () => {
  const { user } = useAuth();
  
  // Determine initial route based on user role
  // ADMIN users are providers (can list properties)
  // USER users are tenants (looking for properties)
  const isProvider = user?.role === 'ADMIN';
  
  console.log('RootNavigator - User:', user?.email, 'Role:', user?.role, 'isProvider:', isProvider);
  
  // Use key to force re-render when role changes
  const navigatorKey = isProvider ? 'provider' : 'tenant';
  
  return (
    <RootStack.Navigator
      key={navigatorKey}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isProvider ? 'ProviderTabs' : 'TenantTabs'}
    >
      {isProvider ? (
        <>
          <RootStack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
          <RootStack.Screen name="TenantTabs" component={TenantTabNavigator} />
        </>
      ) : (
        <>
          <RootStack.Screen name="TenantTabs" component={TenantTabNavigator} />
          <RootStack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
        </>
      )}
      <RootStack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <RootStack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
};

/**
 * Loading Screen
 * Displayed while checking auth state
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#6200ee" />
  </View>
);

/**
 * App Navigator
 * 
 * Main navigation component that conditionally renders:
 * - Loading screen while checking auth state
 * - Auth stack for unauthenticated users
 * - Root stack for authenticated users (with role-based initial route)
 * 
 * Requirements: 9.1, 9.2, 9.3
 */
const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, user, token } = useAuth();

  console.log('AppNavigator - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email, 'token:', token ? 'exists' : 'null');

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default AppNavigator;
