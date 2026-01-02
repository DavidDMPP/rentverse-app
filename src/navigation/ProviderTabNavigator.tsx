/**
 * Provider Tab Navigator - Rentverse Style
 * 
 * Dark theme bottom tab navigation for provider users.
 * Tabs: Dashboard, AI Estimator, Listings, Bookings, Profile
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

// Import screens
import { ProviderDashboardScreen } from '../screens/provider/ProviderDashboardScreen';
import { AIPriceEstimatorScreen } from '../screens/provider/AIPriceEstimatorScreen';
import { ListingsScreen } from '../screens/provider/ListingsScreen';
import { AddListingScreen } from '../screens/provider/AddListingScreen';
import { EditListingScreen } from '../screens/provider/EditListingScreen';
import { BookingManagementScreen } from '../screens/provider/BookingManagementScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

export type ListingsStackParamList = {
  ListingsMain: undefined;
  AddListing: undefined;
  EditListing: { propertyId: string };
};

export type ProviderTabParamList = {
  Dashboard: undefined;
  AIEstimator: undefined;
  Listings: undefined;
  Bookings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();
const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();

const ListingsStackNavigator: React.FC = () => {
  return (
    <ListingsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ListingsStack.Screen name="ListingsMain" component={ListingsScreen} />
      <ListingsStack.Screen name="AddListing" component={AddListingScreen} />
      <ListingsStack.Screen name="EditListing" component={EditListingScreen} />
    </ListingsStack.Navigator>
  );
};

const ProviderTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.dark.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.dark.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.dark.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.dark.border,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={ProviderDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'grid' : 'grid-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AIEstimator" 
        component={AIPriceEstimatorScreen}
        options={{
          title: 'AI Price',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons 
              name={focused ? 'robot' : 'robot-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Listings" 
        component={ListingsStackNavigator}
        options={{
          title: 'Listings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingManagementScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ProviderTabNavigator;
