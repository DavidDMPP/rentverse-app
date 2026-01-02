/**
 * Tenant Tab Navigator - Rentverse Style
 * 
 * Dark theme bottom tab navigation for tenant users.
 * Tabs: Home, Search, Bookings, Saved, Profile
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

// Import screens
import { TenantHomeScreen } from '../screens/tenant/TenantHomeScreen';
import { SearchScreen } from '../screens/tenant/SearchScreen';
import { SavedScreen } from '../screens/tenant/SavedScreen';
import { TenantBookingsScreen } from '../screens/tenant/TenantBookingsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

export type TenantTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Saved: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TenantTabParamList>();

type TabIconName = 'home' | 'home-outline' | 'search' | 'search-outline' | 
                   'heart' | 'heart-outline' | 'person' | 'person-outline' |
                   'calendar' | 'calendar-outline';

const getTabIcon = (routeName: string, focused: boolean): TabIconName => {
  const icons: Record<string, { focused: TabIconName; unfocused: TabIconName }> = {
    Home: { focused: 'home', unfocused: 'home-outline' },
    Search: { focused: 'search', unfocused: 'search-outline' },
    Bookings: { focused: 'calendar', unfocused: 'calendar-outline' },
    Saved: { focused: 'heart', unfocused: 'heart-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };
  
  const iconSet = icons[routeName];
  return iconSet ? (focused ? iconSet.focused : iconSet.unfocused) : 'home-outline';
};

const TenantTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
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
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={TenantHomeScreen}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={TenantBookingsScreen}
        options={{
          title: 'Bookings',
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen}
        options={{
          title: 'Saved',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default TenantTabNavigator;
