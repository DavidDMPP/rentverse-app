/**
 * PropertyCard Component
 * 
 * Image top, price badge overlay, rating star, favorite icon
 * Card modern dengan animasi press dan shadow halus
 * 
 * Requirements: 2.1, 3.1
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../types';
import { formatCurrency } from '../utils/formatting';
import { useTheme } from '../context/ThemeContext';
import { FavoriteButton, RatingStars } from './ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface PropertyCardProps {
  property: Property;
  onPress: (property: Property) => void;
  onFavoritePress?: (property: Property) => void;
  isFavorite?: boolean;
  fullWidth?: boolean;
}

export function PropertyCard({
  property,
  onPress,
  onFavoritePress,
  isFavorite = false,
  fullWidth = false,
}: PropertyCardProps): React.JSX.Element {
  const { theme, isDark } = useTheme();
  
  const imageSource = property.images?.[0]
    ? { uri: property.images[0] }
    : require('../../assets/icon.png');

  const location = [property.city, property.state]
    .filter(Boolean)
    .join(', ');

  const cardWidth = fullWidth ? '100%' : CARD_WIDTH;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: cardWidth as any,
          backgroundColor: theme.colors.card,
          ...(isDark ? { borderWidth: 1, borderColor: theme.colors.border } : Shadow.md),
        },
      ]}
      onPress={() => onPress(property)}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={[styles.image, fullWidth && styles.imageFull]}
          resizeMode="cover"
        />
        
        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {formatCurrency(property.price)}
          </Text>
          <Text style={styles.priceUnit}>/mo</Text>
        </View>
        
        {/* Favorite Button */}
        {onFavoritePress && (
          <View style={styles.favoriteContainer}>
            <FavoriteButton
              isFavorite={isFavorite}
              onPress={() => onFavoritePress(property)}
              size={20}
            />
          </View>
        )}
        
        {/* Property Type Badge */}
        {property.propertyType && (
          <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.typeText}>
              {property.propertyType.name}
            </Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text 
          style={[styles.title, { color: theme.colors.text }]} 
          numberOfLines={1}
        >
          {property.title}
        </Text>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons 
            name="location-outline" 
            size={14} 
            color={theme.colors.textSecondary} 
          />
          <Text 
            style={[styles.location, { color: theme.colors.textSecondary }]} 
            numberOfLines={1}
          >
            {location || 'Location not specified'}
          </Text>
        </View>
        
        {/* Specs & Rating Row */}
        <View style={styles.bottomRow}>
          <View style={styles.specsRow}>
            <View style={styles.spec}>
              <Ionicons 
                name="bed-outline" 
                size={14} 
                color={theme.colors.textSecondary} 
              />
              <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>
                {property.bedrooms}
              </Text>
            </View>
            <View style={styles.spec}>
              <Ionicons 
                name="water-outline" 
                size={14} 
                color={theme.colors.textSecondary} 
              />
              <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>
                {property.bathrooms}
              </Text>
            </View>
            {property.areaSqm && (
              <View style={styles.spec}>
                <Ionicons 
                  name="resize-outline" 
                  size={14} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>
                  {property.areaSqm}
                </Text>
              </View>
            )}
          </View>
          
          {property.rating !== undefined && property.rating > 0 && (
            <RatingStars rating={property.rating} size={12} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
  },
  imageFull: {
    height: 160,
  },
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priceText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 2,
  },
  favoriteContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  typeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#FFFFFF',
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  location: {
    fontSize: FontSize.sm,
    marginLeft: 4,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  specText: {
    fontSize: FontSize.sm,
    marginLeft: 4,
  },
});

export default PropertyCard;
