/**
 * PropertyDetailScreen
 * 
 * Dark theme design sesuai rentverse web
 * - Hero image slider dengan pagination
 * - Photo gallery section
 * - Stats grid dengan border white/5
 * - Provider profile card
 * - Amenities grid
 * - Bottom action bar dengan backdrop blur
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../../types';
import { getPropertyById, toggleFavorite } from '../../services/propertyService';
import { formatCurrency } from '../../utils/formatting';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

type RootStackParamList = {
  PropertyDetail: { propertyId: string };
  Booking: { propertyId: string };
};

type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}> = ({ icon, value, label }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={24} color={Colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Amenity Item Component
 */
const AmenityItem: React.FC<{ name: string; icon: string }> = ({ name, icon }) => (
  <View style={styles.amenityItem}>
    <View style={styles.amenityIcon}>
      <Ionicons name={icon as any} size={20} color={Colors.dark.textSecondary} />
    </View>
    <Text style={styles.amenityText}>{name}</Text>
  </View>
);

export function PropertyDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PropertyDetailRouteProp>();
  const { propertyId } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  
  const imageSliderRef = useRef<ScrollView>(null);
  const gallerySliderRef = useRef<ScrollView>(null);

  const fetchProperty = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPropertyById(propertyId);
      setProperty(data);
      setIsFavorite(data.isFavorite || false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const handleFavoriteToggle = async () => {
    if (!property || isFavoriteLoading) return;
    try {
      setIsFavoriteLoading(true);
      await toggleFavorite(property.id);
      setIsFavorite(!isFavorite);
    } catch {
      Alert.alert('Error', 'Failed to update favorite');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleCall = () => {
    if (property?.owner?.phone) {
      Linking.openURL(`tel:${property.owner.phone}`);
    }
  };

  const handleChat = () => {
    Alert.alert('Chat', `Starting chat with ${property?.owner?.name || 'owner'}`);
  };

  const handleRentNow = () => {
    if (property) {
      navigation.navigate('Booking', { propertyId: property.id });
    }
  };

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    const totalImages = property?.images?.length || 1;
    if (index >= 0 && index < totalImages) {
      setActiveImageIndex(index);
    }
  };

  const scrollToImage = (index: number) => {
    imageSliderRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveImageIndex(index);
  };

  const scrollToGalleryImage = (index: number) => {
    gallerySliderRef.current?.scrollTo({ x: index * width, animated: true });
    setGalleryStartIndex(index);
  };

  const openGallery = (index: number = 0) => {
    setGalleryStartIndex(index);
    setShowGalleryModal(true);
  };

  const closeGallery = () => {
    setShowGalleryModal(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Property not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProperty}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images?.length ? property.images : ['https://picsum.photos/800/600'];
  const location = [property.city, property.state].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Slider */}
        <View style={styles.heroContainer}>
          <ScrollView
            ref={imageSliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="start"
            style={styles.heroSlider}
          >
            {images.map((item, index) => (
              <TouchableOpacity 
                key={`hero-${index}`}
                activeOpacity={0.95}
                onPress={() => openGallery(index)}
                style={{ width: width }}
              >
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)', Colors.dark.background]}
            locations={[0, 0.4, 0.75, 1]}
            style={styles.heroOverlay}
          />
          
          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="share-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, isFavorite && styles.headerButtonFavorite]} 
                onPress={handleFavoriteToggle}
                disabled={isFavoriteLoading}
              >
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isFavorite ? Colors.error : Colors.white} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Counter Badge */}
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={14} color={Colors.white} />
            <Text style={styles.imageCountText}>{activeImageIndex + 1}/{images.length}</Text>
          </View>

          {/* Image Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => scrollToImage(i)}
                  style={[styles.paginationDot, i === activeImageIndex && styles.paginationDotActive]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Rating */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{property.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.dark.textSecondary} />
                <Text style={styles.location}>{location || 'Location not specified'}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>{property.rating || '4.9'}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard icon="bed-outline" value={property.bedrooms} label="Bed" />
            <StatCard icon="water-outline" value={property.bathrooms} label="Bath" />
            <StatCard icon="resize-outline" value={`${property.areaSqm || 0}`} label="sqm" />
          </View>

          {/* Photo Gallery Section */}
          {images.length > 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                <TouchableOpacity onPress={() => openGallery(0)}>
                  <Text style={styles.seeAllText}>See All ({images.length})</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContainer}
              >
                {images.slice(0, 6).map((img, index) => (
                  <TouchableOpacity 
                    key={`gallery-${index}`}
                    style={styles.galleryItem}
                    onPress={() => openGallery(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                    {index === 5 && images.length > 6 && (
                      <View style={styles.galleryOverlay}>
                        <Text style={styles.galleryOverlayText}>+{images.length - 6}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Provider Card */}
          <View style={styles.providerCard}>
            <View style={styles.providerInfo}>
              <View style={styles.providerAvatarContainer}>
                <Image 
                  source={{ uri: property.owner?.profilePicture || 'https://picsum.photos/100' }}
                  style={styles.providerAvatar}
                />
                {property.owner && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.providerName}>{property.owner?.name || 'Property Owner'}</Text>
                <Text style={styles.providerLabel}>Property Provider</Text>
              </View>
            </View>
            <View style={styles.providerActions}>
              <TouchableOpacity style={styles.providerButton} onPress={handleChat}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.providerButton} onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>Description</Text>
            <Text style={styles.description}>
              {property.description || 'Experience luxury living in this spacious property. Featuring modern finishes and top-tier amenities.'}
            </Text>
          </View>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenity, i) => (
                  <AmenityItem 
                    key={amenity.id || i} 
                    name={amenity.name} 
                    icon={getAmenityIcon(amenity.name)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price per day</Text>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>
        </View>
        <TouchableOpacity style={styles.rentButton} onPress={handleRentNow}>
          <Text style={styles.rentButtonText}>Rent Now</Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Gallery Modal */}
      <Modal
        visible={showGalleryModal}
        transparent
        animationType="fade"
        onRequestClose={closeGallery}
      >
        <View style={styles.galleryModal}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Modal Header */}
          <View style={styles.galleryModalHeader}>
            <TouchableOpacity style={styles.galleryCloseButton} onPress={closeGallery}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.galleryModalTitle}>
              {galleryStartIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Gallery Image Slider */}
          <ScrollView
            ref={gallerySliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              if (index >= 0 && index < images.length) {
                setGalleryStartIndex(index);
              }
            }}
            scrollEventThrottle={16}
            snapToInterval={width}
            snapToAlignment="start"
            contentOffset={{ x: galleryStartIndex * width, y: 0 }}
          >
            {images.map((item, index) => (
              <View key={`modal-${index}`} style={styles.galleryModalImageContainer}>
                <Image 
                  source={{ uri: item }} 
                  style={styles.galleryModalImage} 
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Thumbnail Strip */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailStrip}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={`thumb-${index}`}
                style={[
                  styles.thumbnailItem,
                  index === galleryStartIndex && styles.thumbnailItemActive
                ]}
                onPress={() => scrollToGalleryImage(index)}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getAmenityIcon = (name: string): string => {
  const icons: Record<string, string> = {
    'WiFi': 'wifi',
    'Parking': 'car',
    'Pool': 'water',
    'Gym': 'fitness',
    'Security': 'shield-checkmark',
    'AC': 'snow',
  };
  return icons[name] || 'checkmark-circle';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.dark.textSecondary,
    fontSize: FontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.error,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Hero
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroSlider: {
    flex: 1,
  },
  heroImage: {
    width: width,
    height: HERO_HEIGHT,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.7,
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerButtonFavorite: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  headerRight: {
    flexDirection: 'row',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageCountText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  pagination: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },

  // Content - starts overlapping hero image
  content: {
    paddingHorizontal: Spacing.lg,
    marginTop: -80,
    position: 'relative',
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  location: {
    marginLeft: 4,
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Provider
  providerCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
  },
  providerName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  providerLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
  },
  providerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  providerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    color: Colors.dark.textSecondary,
  },

  // Photo Gallery
  galleryContainer: {
    gap: Spacing.sm,
  },
  galleryItem: {
    width: 120,
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlayText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  // Gallery Modal
  galleryModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
  },
  galleryCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  galleryModalImageContainer: {
    width: width,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryModalImage: {
    width: width,
    height: '100%',
  },
  thumbnailStrip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  thumbnailItem: {
    width: 60,
    height: 45,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  thumbnailItemActive: {
    borderColor: Colors.primary,
    opacity: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  amenityIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  amenityText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  rentButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginLeft: Spacing.lg,
  },
  rentButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default PropertyDetailScreen;