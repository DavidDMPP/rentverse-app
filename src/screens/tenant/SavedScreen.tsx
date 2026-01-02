/**
 * SavedScreen - Rentverse Style
 * 
 * Dark theme dengan modern UI
 * Displays user's favorite/saved properties
 * Empty state dengan CTA
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getFavorites, toggleFavorite } from '../../services/propertyService';
import { Property } from '../../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatting';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  PropertyDetail: { propertyId: string };
  Search: undefined;
  TenantHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Screen Header with Stats
 */
const ScreenHeader: React.FC<{
  totalSaved: number;
  availableCount: number;
  onClearAll: () => void;
}> = ({ totalSaved, availableCount, onClearAll }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Saved Homes</Text>
          <Text style={styles.headerSubtitle}>Your favorite properties</Text>
        </View>
        {totalSaved > 0 && (
          <TouchableOpacity style={styles.headerBadge} onPress={onClearAll}>
            <Ionicons name="trash-outline" size={14} color={Colors.white} />
            <Text style={styles.headerBadgeText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    
    {/* Quick Stats - Full Width */}
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Ionicons name="heart" size={18} color="#EF4444" />
        </View>
        <Text style={styles.statValue}>{totalSaved}</Text>
        <Text style={styles.statLabel}>Saved</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
        </View>
        <Text style={styles.statValue}>{availableCount}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
          <Ionicons name="home" size={18} color="#60A5FA" />
        </View>
        <Text style={styles.statValue}>{totalSaved > 0 ? Math.round(availableCount / totalSaved * 100) : 0}%</Text>
        <Text style={styles.statLabel}>Ready</Text>
      </View>
    </View>
  </View>
);

/**
 * Saved Property Card - Enhanced Design
 */
const SavedPropertyCard: React.FC<{
  property: Property;
  onPress: () => void;
  onRemove: () => void;
}> = ({ property, onPress, onRemove }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/400/300';
  const isAvailable = property.isAvailable !== false;
  
  return (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.propertyImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
        >
          <View style={styles.favoriteButtonInner}>
            <Ionicons name="heart" size={18} color="#EF4444" />
          </View>
        </TouchableOpacity>
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: isAvailable ? 'rgba(34, 197, 94, 0.9)' : 'rgba(251, 191, 36, 0.9)' }
        ]}>
          <Ionicons 
            name={isAvailable ? "checkmark-circle" : "time"} 
            size={12} 
            color={Colors.white} 
          />
          <Text style={styles.statusBadgeText}>
            {isAvailable ? 'Available' : 'Pending'}
          </Text>
        </View>

        {/* Price on Image */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatCurrency(property.price)}</Text>
          <Text style={styles.priceUnit}>/day</Text>
        </View>
      </View>
      
      {/* Content Section */}
      <View style={styles.cardContent}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.city || property.address || 'Location'}
          </Text>
        </View>
        
        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          <View style={styles.amenityItem}>
            <View style={styles.amenityIcon}>
              <Ionicons name="bed-outline" size={14} color={Colors.dark.textSecondary} />
            </View>
            <Text style={styles.amenityText}>{property.bedrooms || 1} Beds</Text>
          </View>
          <View style={styles.amenityItem}>
            <View style={styles.amenityIcon}>
              <Ionicons name="water-outline" size={14} color={Colors.dark.textSecondary} />
            </View>
            <Text style={styles.amenityText}>{property.bathrooms || 1} Baths</Text>
          </View>
          <View style={styles.amenityItem}>
            <View style={styles.amenityIcon}>
              <Ionicons name="expand-outline" size={14} color={Colors.dark.textSecondary} />
            </View>
            <Text style={styles.amenityText}>{property.areaSqm || 50} m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Empty State - Enhanced
 */
const EmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <View style={styles.emptyIconOuter}>
        <View style={styles.emptyIconInner}>
          <Ionicons name="heart-outline" size={48} color="#EF4444" />
        </View>
      </View>
    </View>
    <Text style={styles.emptyTitle}>No Saved Homes Yet</Text>
    <Text style={styles.emptyText}>
      Start exploring and tap the heart icon to save properties you love
    </Text>
    <TouchableOpacity style={styles.browseButton} onPress={onBrowse}>
      <Ionicons name="search" size={18} color={Colors.white} />
      <Text style={styles.browseButtonText}>Browse Properties</Text>
    </TouchableOpacity>
  </View>
);

export function SavedScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Calculate stats
  const availableCount = favorites.filter(p => p.isAvailable !== false).length;

  const fetchFavorites = useCallback(async () => {
    try {
      setError(null);
      const data = await getFavorites();
      const safeData = Array.isArray(data) ? data : [];
      const favoritesWithFlag = safeData.map(p => ({ ...p, isFavorite: true }));
      setFavorites(favoritesWithFlag);
    } catch (err) {
      setError('Failed to load saved properties. Please try again.');
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handlePropertyPress = useCallback((property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  }, [navigation]);

  const handleRemoveFavorite = useCallback(async (property: Property) => {
    try {
      await toggleFavorite(property.id);
      setFavorites(prev => prev.filter(p => p.id !== property.id));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  }, []);

  const handleBrowse = useCallback(() => {
    try {
      navigation.navigate('TenantHome');
    } catch {
      navigation.navigate('Search');
    }
  }, [navigation]);

  const handleClearAll = useCallback(async () => {
    setShowClearModal(false);
    try {
      for (const property of favorites) {
        await toggleFavorite(property.id);
      }
      setFavorites([]);
    } catch (err) {
      console.error('Error clearing favorites:', err);
    }
  }, [favorites]);

  const renderHeader = () => (
    <View>
      <ScreenHeader 
        totalSaved={favorites.length}
        availableCount={availableCount}
        onClearAll={() => setShowClearModal(true)}
      />
      {/* Spacer for first card */}
      <View style={{ height: Spacing.md }} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner fullScreen message="Loading saved properties..." />
      </View>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <View style={[styles.emptyIconInner, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        </View>
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />

      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <SavedPropertyCard
            property={item}
            onPress={() => handlePropertyPress(item)}
            onRemove={() => handleRemoveFavorite(item)}
          />
        )}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState onBrowse={handleBrowse} />}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty,
        ]}
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

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="trash-outline" size={32} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>Clear All Saved?</Text>
            <Text style={styles.modalMessage}>
              This will remove all {favorites.length} properties from your saved list. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleClearAll}
              >
                <Text style={styles.modalButtonConfirmText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  // Header
  header: {
    backgroundColor: Colors.dark.surface,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },

  // Stats Row - Full Width
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.dark.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },

  // List
  listContent: {
    paddingBottom: 120,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Property Card
  propertyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  favoriteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 2,
  },
  cardContent: {
    padding: Spacing.md,
  },
  propertyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: Spacing.lg,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 40,
  },
  emptyIconContainer: {
    marginBottom: Spacing.lg,
  },
  emptyIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  browseButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dark.background,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalButtonCancelText: {
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.error,
  },
  modalButtonConfirmText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});

export default SavedScreen;
