/**
 * SearchScreen - Rentverse Style
 * 
 * Dark theme dengan modern UI
 * Search input dengan debounce
 * Filter options dan category tabs
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  TextInput,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  getProperties,
  toggleFavorite,
  filterBySearch,
  filterByCategory,
  filterByPriceRange,
} from '../../services/propertyService';
import { Property, PropertyTypeName, FurnishedType, FURNISHED_TYPES } from '../../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../theme';
import { formatCurrency } from '../../utils/formatting';

type RootStackParamList = {
  PropertyDetail: { propertyId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: FurnishedType;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const categories = ['All', 'Apartment', 'House', 'Studio', 'Condo'];
const trendingSearches = ['Kuningan', 'Menteng', 'Near MRT', 'Pet Friendly', 'Jakarta Pusat'];

/**
 * Search Result Card
 */
const SearchResultCard: React.FC<{
  property: Property;
  onPress: () => void;
}> = ({ property, onPress }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/400/300';
  
  return (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.resultImageContainer}>
        <Image source={{ uri: imageUri }} style={styles.resultImage} />
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{property.propertyType?.name || 'Property'}</Text>
        </View>
      </View>
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#EAB308" />
            <Text style={styles.ratingText}>{property.rating || '4.8'}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={Colors.dark.textTertiary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.city || property.address || 'Location'}
          </Text>
        </View>
        <View style={styles.resultFooter}>
          <View style={styles.bedsInfo}>
            <Ionicons name="bed" size={14} color={Colors.primary} />
            <Text style={styles.bedsText}>{property.bedrooms || 1} Beds</Text>
          </View>
          <Text style={styles.priceText}>
            {formatCurrency(property.price)}
            <Text style={styles.perDay}>/day</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Empty State
 */
const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="search-outline" size={40} color={Colors.dark.textTertiary} />
    </View>
    <Text style={styles.emptyTitle}>No properties found</Text>
    <Text style={styles.emptyText}>
      We couldn't find any properties matching "{query}". Try different keywords.
    </Text>
  </View>
);

/**
 * Filter Modal
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
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setLocalFilters({})}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Min Price</Text>
            <View style={styles.optionsRow}>
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={`min-${option.label}`}
                  style={[styles.optionButton, localFilters.minPrice === option.value && styles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, minPrice: option.value })}
                >
                  <Text style={[styles.optionText, localFilters.minPrice === option.value && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Max Price</Text>
            <View style={styles.optionsRow}>
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={`max-${option.label}`}
                  style={[styles.optionButton, localFilters.maxPrice === option.value && styles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, maxPrice: option.value })}
                >
                  <Text style={[styles.optionText, localFilters.maxPrice === option.value && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Bedrooms</Text>
            <View style={styles.optionsRow}>
              {bedroomOptions.map((option) => (
                <TouchableOpacity
                  key={`bed-${option.label}`}
                  style={[styles.optionButton, localFilters.bedrooms === option.value && styles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, bedrooms: option.value })}
                >
                  <Text style={[styles.optionText, localFilters.bedrooms === option.value && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Furnished</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionButton, localFilters.furnished === undefined && styles.optionButtonSelected]}
                onPress={() => setLocalFilters({ ...localFilters, furnished: undefined })}
              >
                <Text style={[styles.optionText, localFilters.furnished === undefined && styles.optionTextSelected]}>Any</Text>
              </TouchableOpacity>
              {FURNISHED_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionButton, localFilters.furnished === type && styles.optionButtonSelected]}
                  onPress={() => setLocalFilters({ ...localFilters, furnished: type })}
                >
                  <Text style={[styles.optionText, localFilters.furnished === type && styles.optionTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.applyButton} onPress={() => { onApply(localFilters); onClose(); }}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export function SearchScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await getProperties({ limit: 100 });
      setAllProperties(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setAllProperties([]);
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
    let result = Array.isArray(allProperties) ? [...allProperties] : [];

    if (debouncedSearchQuery.trim()) {
      result = filterBySearch(result, debouncedSearchQuery);
    }

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.propertyType?.name === selectedCategory);
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
  }, [allProperties, debouncedSearchQuery, selectedCategory, filters]);

  const handlePropertyPress = useCallback((property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  }, [navigation]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.bedrooms !== undefined) count++;
    if (filters.furnished !== undefined) count++;
    return count;
  }, [filters]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner fullScreen message="Loading properties..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      
      {/* Search Header */}
      <View style={styles.header}>
        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.dark.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search area, city or property..."
            placeholderTextColor={Colors.dark.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={16} color={Colors.dark.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Filter Button */}
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options-outline" size={18} color={Colors.primary} />
            <Text style={styles.filterButtonText}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
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
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {searchQuery || selectedCategory !== 'All' ? 'Search Results' : 'Recommended for You'}
          </Text>
          <Text style={styles.resultsCount}>{filteredProperties.length} Properties found</Text>
        </View>

        {/* Results */}
        {filteredProperties.length > 0 ? (
          filteredProperties.map(property => (
            <SearchResultCard
              key={property.id}
              property={property}
              onPress={() => handlePropertyPress(property)}
            />
          ))
        ) : searchQuery ? (
          <EmptyState query={searchQuery} />
        ) : null}

        {/* Trending Searches */}
        {!searchQuery && selectedCategory === 'All' && (
          <View style={styles.trendingSection}>
            <Text style={styles.trendingTitle}>Trending Searches</Text>
            <View style={styles.trendingTags}>
              {trendingSearches.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.trendingTag}
                  onPress={() => setSearchQuery(tag)}
                >
                  <Text style={styles.trendingTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginRight: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.primary,
  },
  categoryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(80, 72, 229, 0.1)',
    gap: 4,
  },
  filterButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    paddingTop: Spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resultsTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  resultsCount: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    fontWeight: FontWeight.medium,
  },
  // Result Card
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  resultImageContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    flex: 1,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  bedsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bedsText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.medium,
  },
  priceText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  perDay: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.dark.textTertiary,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    maxWidth: 200,
  },
  // Trending
  trendingSection: {
    marginTop: Spacing.xl,
  },
  trendingTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  trendingTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  trendingTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.dark.textSecondary,
  },
  // Modal
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

export default SearchScreen;
