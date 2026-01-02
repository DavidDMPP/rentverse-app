/**
 * ListingsScreen
 * 
 * Displays provider's property listings with status indicators.
 * Allows navigation to add new listing and edit existing listings.
 * 
 * Requirements: 6.3
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getMyProperties } from '../../services/propertyService';
import { formatCurrency } from '../../utils/formatting';
import { Property, ListingStatus } from '../../types';
import { Colors, BorderRadius, Shadow, Spacing, FontSize } from '../../theme';

// Navigation types
type ListingsStackParamList = {
  Listings: undefined;
  AddListing: undefined;
  EditListing: { propertyId: string };
};

type ListingsNavigationProp = NativeStackNavigationProp<ListingsStackParamList>;

/**
 * Get status badge color based on listing status
 */
const getStatusColor = (status: ListingStatus): string => {
  switch (status) {
    case 'APPROVED':
      return Colors.secondary;
    case 'PENDING_REVIEW':
      return Colors.accent;
    case 'REJECTED':
      return Colors.error;
    default:
      return Colors.light.textSecondary;
  }
};

/**
 * Get status display text
 */
const getStatusText = (status: ListingStatus): string => {
  switch (status) {
    case 'APPROVED':
      return 'Active';
    case 'PENDING_REVIEW':
      return 'Pending';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
};

/**
 * ListingCard Component
 * Displays a single property listing with status indicator
 */
interface ListingCardProps {
  property: Property;
  onPress: () => void;
  onEditPress: () => void;
  isDark: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ property, onPress, onEditPress, isDark }) => {
  const imageSource = property.images?.[0]
    ? { uri: property.images[0] }
    : require('../../../assets/icon.png');

  const location = [property.city, property.state].filter(Boolean).join(', ');
  const statusColor = getStatusColor(property.status);
  const statusText = getStatusText(property.status);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Availability Badge */}
      <View style={[
        styles.availabilityBadge,
        { backgroundColor: property.isAvailable ? Colors.secondary : Colors.error }
      ]}>
        <Text style={styles.availabilityText}>
          {property.isAvailable ? 'Available' : 'Rented'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]} numberOfLines={1}>
          {property.title}
        </Text>
        
        <Text style={[styles.cardPrice, { color: Colors.primary }]}>
          {formatCurrency(property.price)}/day
        </Text>

        <View style={styles.cardLocation}>
          <Ionicons name="location-outline" size={14} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
          <Text style={[styles.cardLocationText, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]} numberOfLines={1}>
            {location || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.cardSpecs}>
          <View style={styles.spec}>
            <Ionicons name="bed-outline" size={14} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
            <Text style={[styles.specText, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>{property.bedrooms} bed</Text>
          </View>
          <View style={styles.spec}>
            <Ionicons name="water-outline" size={14} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
            <Text style={[styles.specText, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>{property.bathrooms} bath</Text>
          </View>
          {property.areaSqm && (
            <View style={styles.spec}>
              <Ionicons name="resize-outline" size={14} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
              <Text style={[styles.specText, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>{property.areaSqm} sqm</Text>
            </View>
          )}
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: isDark ? Colors.primaryDark + '30' : Colors.primaryLight + '20' }]}
          onPress={onEditPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
          <Text style={[styles.editButtonText, { color: Colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};


/**
 * EmptyListings Component
 */
interface EmptyListingsProps {
  onAddPress: () => void;
  isDark: boolean;
}

const EmptyListings: React.FC<EmptyListingsProps> = ({ onAddPress, isDark }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="home-outline" size={64} color={isDark ? Colors.dark.textTertiary : '#D1D5DB'} />
    <Text style={[styles.emptyTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>No Listings Yet</Text>
    <Text style={[styles.emptySubtitle, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>
      Start by adding your first property listing
    </Text>
    <TouchableOpacity style={[styles.emptyButton, { backgroundColor: Colors.primary }]} onPress={onAddPress}>
      <Ionicons name="add" size={20} color={Colors.white} />
      <Text style={styles.emptyButtonText}>Add Listing</Text>
    </TouchableOpacity>
  </View>
);

/**
 * ListingsScreen Component
 * 
 * Requirements: 6.3
 */
export function ListingsScreen(): React.JSX.Element {
  const navigation = useNavigation<ListingsNavigationProp>();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  // State
  const [listings, setListings] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch provider's listings
   */
  const fetchListings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      console.log('Fetching listings for user:', user.id);
      
      // Use getMyProperties which fetches all statuses for owner
      const response = await getMyProperties(user.id);
      const myListings = response.properties;
      console.log('My listings:', myListings.length, 'properties');
      
      // Sort by creation date (newest first)
      myListings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setListings(myListings);
    } catch (err) {
      setError('Failed to load listings. Please try again.');
      console.error('Error fetching listings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Fetch listings when screen is focused (auto-refresh)
  useFocusEffect(
    useCallback(() => {
      console.log('ListingsScreen focused, refreshing...');
      fetchListings();
    }, [fetchListings])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchListings();
  }, [fetchListings]);

  /**
   * Navigate to add listing screen
   */
  const handleAddListing = useCallback(() => {
    navigation.navigate('AddListing');
  }, [navigation]);

  /**
   * Navigate to edit listing screen
   */
  const handleEditListing = useCallback((propertyId: string) => {
    navigation.navigate('EditListing', { propertyId });
  }, [navigation]);

  /**
   * Navigate to property detail
   */
  const handleViewListing = useCallback((propertyId: string) => {
    // Navigate to property detail in the root stack
    (navigation as any).navigate('PropertyDetail', { propertyId });
  }, [navigation]);

  /**
   * Render listing item
   */
  const renderItem = useCallback(({ item }: { item: Property }) => (
    <ListingCard
      property={item}
      onPress={() => handleViewListing(item.id)}
      onEditPress={() => handleEditListing(item.id)}
      isDark={isDark}
    />
  ), [handleViewListing, handleEditListing, isDark]);

  /**
   * Render list header with stats
   */
  const renderHeader = useCallback(() => {
    const activeCount = listings.filter(l => l.status === 'APPROVED').length;
    const pendingCount = listings.filter(l => l.status === 'PENDING_REVIEW').length;
    const rentedCount = listings.filter(l => !l.isAvailable).length;

    return (
      <View style={[styles.statsContainer, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? Colors.dark.text : Colors.light.text }]}>{listings.length}</Text>
          <Text style={[styles.statLabel, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.secondary }]}>{activeCount}</Text>
          <Text style={[styles.statLabel, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.accent }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>{rentedCount}</Text>
          <Text style={[styles.statLabel, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>Rented</Text>
        </View>
      </View>
    );
  }, [listings, isDark]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading listings..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
          <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>{error}</Text>
        </View>
      )}

      {listings.length === 0 ? (
        <EmptyListings onAddPress={handleAddListing} isDark={isDark} />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      {listings.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.primary }]}
          onPress={handleAddListing}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  errorContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadow.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  availabilityBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  availabilityText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardPrice: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardLocationText: {
    fontSize: FontSize.md,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  cardSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  specText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  editButtonText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
  },
});

export default ListingsScreen;
