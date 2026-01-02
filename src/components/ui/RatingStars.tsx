/**
 * RatingStars - Star Rating Component
 * Interactive dan read-only mode
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, FontSize } from '../../theme';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  showValue = false,
  reviewCount,
}) => {
  const { theme } = useTheme();

  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const filled = index < Math.floor(rating);
    const halfFilled = !filled && index < rating;
    
    const iconName = filled
      ? 'star'
      : halfFilled
      ? 'star-half'
      : 'star-outline';

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
      <StarComponent
        key={index}
        onPress={() => handlePress(index)}
        style={styles.star}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName}
          size={size}
          color={Colors.accent}
        />
      </StarComponent>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }).map((_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={[styles.ratingText, { color: theme.colors.text }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      {reviewCount !== undefined && (
        <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    marginLeft: Spacing.xs,
  },
});

export default RatingStars;
