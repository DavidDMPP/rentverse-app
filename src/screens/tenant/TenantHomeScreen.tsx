/**
 * TenantHomeScreen - Rentverse Style
 * 
 * Search bar sticky, featured slider, property card list
 * Dark theme dengan modern UI - Enhanced Design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  getProperties,
  getFeaturedProperties,
  toggleFavorite,
  filterByPriceRange,
} from '../../services/propertyService';
import { Property, FurnishedType, FURNISHED_TYPES } from '../../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../theme';
import { formatCurrency } from '../../utils/formatting';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  PropertyDetail: { propertyId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: FurnishedType;
}


/**
 * Filter Modal Component
 */
const FilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}> = ({ visible, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const priceOptions = [
    { label: 'Any', value: undefined },
    { label: 'Rp 500K', value: 500000 },
    { label: 'Rp 1M', value: 1000000 },
    { label: 'Rp 2M', value: 2000000 },
    { label: 'Rp 5M', value: 5000000 },
  ];

  const bedroomOptions = [
    { label: 'Any', value: undefined },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4+', value: 4 },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={filterStyles.modalContainer}>
        <View style={filterStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={filterStyles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setLocalFilters({})}>
            <Text style={filterStyles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={filterStyles.modalContent}>
          <View style={filterStyles.filterSection}>
            <Text style={filterStyles.filterSectionTitle}>Min Price</Text>
            <View style={filterStyles.optionsRow}>
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={`min-${option.label}`}
                  style={[filterStyles.optionButton, localFilters.minPrice === option.value && filterStyles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, minPrice: option.value })}
                >
                  <Text style={[filterStyles.optionText, localFilters.minPrice === option.value && filterStyles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={filterStyles.filterSection}>
            <Text style={filterStyles.filterSectionTitle}>Max Price</Text>
            <View style={filterStyles.optionsRow}>
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={`max-${option.label}`}
                  style={[filterStyles.optionButton, localFilters.maxPrice === option.value && filterStyles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, maxPrice: option.value })}
                >
                  <Text style={[filterStyles.optionText, localFilters.maxPrice === option.value && filterStyles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={filterStyles.filterSection}>
            <Text style={filterStyles.filterSectionTitle}>Bedrooms</Text>
            <View style={filterStyles.optionsRow}>
              {bedroomOptions.map((option) => (
                <TouchableOpacity
                  key={`bed-${option.label}`}
                  style={[filterStyles.optionButton, localFilters.bedrooms === option.value && filterStyles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, bedrooms: option.value })}
                >
                  <Text style={[filterStyles.optionText, localFilters.bedrooms === option.value && filterStyles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={filterStyles.filterSection}>
            <Text style={filterStyles.filterSectionTitle}>Furnished</Text>
            <View style={filterStyles.optionsRow}>
              <TouchableOpacity
                style={[filterStyles.optionButton, localFilters.furnished === undefined && filterStyles.optionButtonSelected]}
                onPress={() => setLocalFilters({ ...localFilters, furnished: undefined })}
              >
                <Text style={[filterStyles.optionText, localFilters.furnished === undefined && filterStyles.optionTextSelected]}>Any</Text>
              </TouchableOpacity>
              {FURNISHED_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[filterStyles.optionButton, localFilters.furnished === type && filterStyles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, furnished: type })}
                >
                  <Text style={[filterStyles.optionText, localFilters.furnished === type && filterStyles.optionTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={filterStyles.modalFooter}>
          <TouchableOpacity style={filterStyles.applyButton} onPress={() => { onApply(localFilters); onClose(); }}>
            <Text style={filterStyles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const filterStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  resetText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadow.primary,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
});


/**
 * Featured Property Card - Enhanced Design
 */
const FeaturedCard: React.FC<{
  property: Property;
  onPress: () => void;
  onFavorite: () => void;
}> = ({ property, onPress, onFavorite }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/600/400';
  
  return (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: imageUri }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      
      {/* Top Row - Badge & Favorite */}
      <View style={styles.featuredTopRow}>
        <View style={styles.featuredBadge}>
          <Ionicons name="sparkles" size={12} color="#FBBF24" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
        <TouchableOpacity 
          style={styles.featuredFavorite}
          onPress={(e) => { e.stopPropagation?.(); onFavorite(); }}
        >
          <Ionicons 
            name={property.isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color={property.isFavorite ? "#EF4444" : Colors.white} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Bottom Content */}
      <View style={styles.featuredContent}>
        <View style={styles.featuredPriceRow}>
          <Text style={styles.featuredPrice}>{formatCurrency(property.price)}</Text>
          <Text style={styles.featuredPriceUnit}>/day</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={1}>{property.title}</Text>
        <View style={styles.featuredLocation}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.featuredLocationText} numberOfLines={1}>
            {property.city || property.address || 'Location'}
          </Text>
        </View>
        
        {/* Amenities Row */}
        <View style={styles.featuredAmenities}>
          <View style={styles.featuredAmenityItem}>
            <Ionicons name="bed-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.featuredAmenityText}>{property.bedrooms || 2}</Text>
          </View>
          <View style={styles.featuredAmenityItem}>
            <Ionicons name="water-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.featuredAmenityText}>{property.bathrooms || 1}</Text>
          </View>
          <View style={styles.featuredAmenityItem}>
            <Ionicons name="expand-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.featuredAmenityText}>{property.areaSqm || 50}m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


/**
 * Property Card for Explore Section - Enhanced Design
 */
const ExploreCard: React.FC<{
  property: Property;
  onPress: () => void;
  onFavorite: () => void;
}> = ({ property, onPress, onFavorite }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/600/400';
  const isAvailable = property.isAvailable !== false;
  
  return (
    <TouchableOpacity 
      style={styles.exploreCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.exploreImageContainer}>
        <Image source={{ uri: imageUri }} style={styles.exploreImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.exploreImageGradient}
        />
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: isAvailable ? 'rgba(34, 197, 94, 0.9)' : 'rgba(251, 191, 36, 0.9)' }
        ]}>
          <Ionicons 
            name={isAvailable ? "checkmark-circle" : "time"} 
            size={10} 
            color={Colors.white} 
          />
          <Text style={styles.statusBadgeText}>
            {isAvailable ? 'Available' : 'Pending'}
          </Text>
        </View>
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => { e.stopPropagation?.(); onFavorite(); }}
        >
          <View style={styles.favoriteButtonInner}>
            <Ionicons 
              name={property.isFavorite ? "heart" : "heart-outline"} 
              size={16} 
              color={property.isFavorite ? "#EF4444" : Colors.white} 
            />
          </View>
        </TouchableOpacity>
        
        {/* Rating Badge on Image */}
        <View style={styles.ratingOnImage}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.ratingOnImageText}>{property.rating || '4.8'}</Text>
        </View>
      </View>
      
      {/* Content Section */}
      <View style={styles.exploreContent}>
        <Text style={styles.exploreTitle} numberOfLines={1}>{property.title}</Text>
        
        <View style={styles.exploreLocation}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.exploreLocationText} numberOfLines={1}>
            {property.city || property.address || 'Location'}
          </Text>
        </View>
        
        {/* Amenities */}
        <View style={styles.exploreAmenities}>
          <View style={styles.amenityChip}>
            <Ionicons name="bed-outline" size={12} color={Colors.dark.textSecondary} />
            <Text style={styles.amenityChipText}>{property.bedrooms || 2} Beds</Text>
          </View>
          <View style={styles.amenityChip}>
            <Ionicons name="water-outline" size={12} color={Colors.dark.textSecondary} />
            <Text style={styles.amenityChipText}>{property.bathrooms || 1} Baths</Text>
          </View>
          <View style={styles.amenityChip}>
            <Ionicons name="expand-outline" size={12} color={Colors.dark.textSecondary} />
            <Text style={styles.amenityChipText}>{property.areaSqm || 50} m²</Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.exploreFooter}>
          <View>
            <Text style={styles.priceLabel}>Daily Rent</Text>
            <View style={styles.priceRow}>
              <Text style={styles.explorePrice}>{formatCurrency(property.price)}</Text>
              <Text style={styles.perDay}>/day</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};


/**
 * Search Result Card (Compact) - Enhanced
 */
const SearchResultCard: React.FC<{
  property: Property;
  onPress: () => void;
  onFavorite: () => void;
}> = ({ property, onPress, onFavorite }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/600/400';
  
  return (
    <TouchableOpacity 
      style={styles.searchCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.searchImageContainer}>
        <Image source={{ uri: imageUri }} style={styles.searchImage} />
        <TouchableOpacity 
          style={styles.searchFavorite}
          onPress={(e) => { e.stopPropagation?.(); onFavorite(); }}
        >
          <Ionicons 
            name={property.isFavorite ? "heart" : "heart-outline"} 
            size={14} 
            color={property.isFavorite ? "#EF4444" : Colors.white} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContent}>
        <Text style={styles.searchTitle} numberOfLines={1}>{property.title}</Text>
        <View style={styles.searchLocationRow}>
          <Ionicons name="location" size={12} color={Colors.dark.textTertiary} />
          <Text style={styles.searchLocation} numberOfLines={1}>
            {property.city || property.address || 'Location'}
          </Text>
        </View>
        <View style={styles.searchAmenities}>
          <Text style={styles.searchAmenityText}>{property.bedrooms || 2} bed</Text>
          <View style={styles.searchDot} />
          <Text style={styles.searchAmenityText}>{property.bathrooms || 1} bath</Text>
          <View style={styles.searchDot} />
          <Text style={styles.searchAmenityText}>{property.areaSqm || 50}m²</Text>
        </View>
        <View style={styles.searchFooter}>
          <Text style={styles.searchPrice}>{formatCurrency(property.price)}</Text>
          <View style={styles.searchRating}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.searchRatingText}>{property.rating || '4.8'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconOuter}>
      <View style={styles.emptyIconInner}>
        <Ionicons name="search-outline" size={40} color={Colors.primary} />
      </View>
    </View>
    <Text style={styles.emptyTitle}>No results found</Text>
    <Text style={styles.emptyText}>
      We couldn't find any properties matching "{query}". Try a different keyword.
    </Text>
  </View>
);


/**
 * TenantHomeScreen Component
 */
export function TenantHomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const fetchProperties = useCallback(async () => {
    try {
      let featured: Property[] = [];
      try {
        const featuredResult = await getFeaturedProperties(6);
        featured = Array.isArray(featuredResult) ? featuredResult : [];
      } catch {
        const response = await getProperties({ limit: 6 });
        featured = Array.isArray(response?.data) ? response.data : [];
      }
      setFeaturedProperties(featured);

      const allResponse = await getProperties({ limit: 50 });
      const all = Array.isArray(allResponse?.data) ? allResponse.data : [];
      setAllProperties(all);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProperties();
  }, [fetchProperties]);

  const filteredProperties = useMemo(() => {
    let result = allProperties;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(prop =>
        prop.title.toLowerCase().includes(query) ||
        (prop.city && prop.city.toLowerCase().includes(query)) ||
        (prop.address && prop.address.toLowerCase().includes(query))
      );
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      result = filterByPriceRange(result, filters.minPrice, filters.maxPrice);
    }

    if (filters.bedrooms !== undefined) {
      result = result.filter(p => p.bedrooms >= filters.bedrooms!);
    }

    if (filters.furnished !== undefined) {
      result = result.filter(p => p.furnished === filters.furnished);
    }

    return result;
  }, [searchQuery, allProperties, filters]);

  const handlePropertyPress = useCallback((property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  }, [navigation]);

  const handleFavoritePress = useCallback(async (property: Property) => {
    try {
      await toggleFavorite(property.id);
      const updateFavorite = (props: Property[]) =>
        props.map(p => p.id === property.id ? { ...p, isFavorite: !p.isFavorite } : p);
      setFeaturedProperties(updateFavorite);
      setAllProperties(updateFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, []);

  const getUserFirstName = (): string => {
    if (user?.firstName) return user.firstName;
    if (user?.name) return user.name.split(' ')[0];
    return 'Guest';
  };

  const isSearching = searchQuery.trim().length > 0 || Object.keys(filters).some(k => filters[k as keyof FilterState] !== undefined);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.bedrooms !== undefined) count++;
    if (filters.furnished !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.primary, '#818CF8']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={18} color={Colors.white} />
            </LinearGradient>
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.userName}>{getUserFirstName()}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.dark.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area or property..."
              placeholderTextColor={Colors.dark.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={18} color={Colors.dark.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={22} color={Colors.white} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!isSearching ? (
          <>
            {/* Featured Properties */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Featured Properties</Text>
                  <Text style={styles.sectionSubtitle}>Handpicked for you</Text>
                </View>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={featuredProperties}
                renderItem={({ item }) => (
                  <FeaturedCard
                    property={item}
                    onPress={() => handlePropertyPress(item)}
                    onFavorite={() => handleFavoritePress(item)}
                  />
                )}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
              />
            </View>

            {/* Explore Nearby */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Explore Nearby</Text>
                  <Text style={styles.sectionSubtitle}>Properties in your area</Text>
                </View>
              </View>
              {allProperties.slice(0, 6).map(property => (
                <ExploreCard
                  key={property.id}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                  onFavorite={() => handleFavoritePress(property)}
                />
              ))}
            </View>
          </>
        ) : (
          /* Search Results */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <Text style={styles.sectionSubtitle}>{filteredProperties.length} properties found</Text>
              </View>
            </View>
            
            {filteredProperties.length > 0 ? (
              filteredProperties.map(property => (
                <SearchResultCard
                  key={property.id}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                  onFavorite={() => handleFavoritePress(property)}
                />
              ))
            ) : (
              <EmptyState query={searchQuery} />
            )}
          </View>
        )}
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApply={setFilters}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  section: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  featuredList: {
    paddingRight: Spacing.md,
  },


  // Featured Card Styles
  featuredCard: {
    width: width * 0.8,
    maxWidth: 320,
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
    backgroundColor: Colors.dark.surfaceLight,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  featuredFavorite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  featuredPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  featuredLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  featuredAmenities: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredAmenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredAmenityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },


  // Explore Card Styles
  exploreCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  exploreImageContainer: {
    height: 180,
    position: 'relative',
  },
  exploreImage: {
    width: '100%',
    height: '100%',
  },
  exploreImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
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
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  favoriteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingOnImage: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  ratingOnImageText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  exploreContent: {
    padding: Spacing.md,
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  exploreLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  exploreLocationText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  exploreAmenities: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  amenityChipText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  exploreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  explorePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  perDay: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.dark.textTertiary,
    marginLeft: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  viewButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },


  // Search Card Styles
  searchCard: {
    flexDirection: 'row',
    padding: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  searchImageContainer: {
    position: 'relative',
  },
  searchImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  searchFavorite: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  searchTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  searchLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchLocation: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    flex: 1,
  },
  searchAmenities: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchAmenityText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  searchDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textTertiary,
  },
  searchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  searchRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(80, 72, 229, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(80, 72, 229, 0.15)',
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
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },
});

export default TenantHomeScreen;
