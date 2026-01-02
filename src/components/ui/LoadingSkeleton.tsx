/**
 * LoadingSkeleton - Shimmer Animation Component
 * Skeleton loader untuk list dan detail screen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Property Card Skeleton
export const PropertyCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.propertyCard,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <Skeleton height={160} borderRadius={BorderRadius.lg} />
      <View style={styles.propertyContent}>
        <Skeleton width="70%" height={18} style={styles.mb8} />
        <Skeleton width="50%" height={14} style={styles.mb8} />
        <View style={styles.row}>
          <Skeleton width={60} height={14} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </View>
  );
};

// Detail Screen Skeleton
export const DetailSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.detailContainer, { backgroundColor: theme.colors.background }]}>
      <Skeleton height={300} borderRadius={0} />
      <View style={styles.detailContent}>
        <Skeleton width="80%" height={24} style={styles.mb16} />
        <Skeleton width="60%" height={16} style={styles.mb16} />
        <View style={styles.row}>
          <Skeleton width={80} height={32} borderRadius={BorderRadius.md} />
          <Skeleton width={80} height={32} borderRadius={BorderRadius.md} />
          <Skeleton width={80} height={32} borderRadius={BorderRadius.md} />
        </View>
        <Skeleton height={100} style={styles.mt16} />
      </View>
    </View>
  );
};

// Dashboard Stats Skeleton
export const StatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={BorderRadius.md} style={styles.mb8} />
          <Skeleton width="60%" height={24} style={styles.mb8} />
          <Skeleton width="80%" height={14} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  propertyCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  propertyContent: {
    padding: Spacing.md,
  },
  listContainer: {
    padding: Spacing.md,
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    padding: Spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mb8: {
    marginBottom: Spacing.sm,
  },
  mb16: {
    marginBottom: Spacing.md,
  },
  mt16: {
    marginTop: Spacing.md,
  },
});

export default Skeleton;
