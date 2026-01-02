/**
 * AppCard - Reusable Card Component
 * Soft shadow, rounded 16, padding konsisten
 */

import React, { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Spacing, Shadow } from '../../theme';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  style,
  padding = 'md',
  shadow = 'md',
}) => {
  const { theme, isDark } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return Spacing.sm;
      case 'lg': return Spacing.lg;
      default: return Spacing.md;
    }
  };

  const getShadow = () => {
    if (isDark || shadow === 'none') return {};
    switch (shadow) {
      case 'sm': return Shadow.sm;
      case 'lg': return Shadow.lg;
      default: return Shadow.md;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: BorderRadius.lg,
    padding: getPadding(),
    ...getShadow(),
    ...(isDark && { borderWidth: 1, borderColor: theme.colors.border }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({});

export default AppCard;
