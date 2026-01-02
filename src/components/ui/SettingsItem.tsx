/**
 * SettingsItem - Settings List Item Component
 * Icon + text, switch atau arrow
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, FontSize, FontWeight, BorderRadius, Colors } from '../../theme';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type?: 'arrow' | 'switch' | 'value';
  value?: string | boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  iconColor?: string;
  danger?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  type = 'arrow',
  value,
  onPress,
  onValueChange,
  iconColor,
  danger = false,
}) => {
  const { theme } = useTheme();

  const getIconColor = () => {
    if (danger) return Colors.error;
    if (iconColor) return iconColor;
    return theme.colors.primary;
  };

  const renderRight = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight,
            }}
            thumbColor={value ? theme.colors.primary : theme.colors.textSecondary}
          />
        );
      case 'value':
        return (
          <View style={styles.valueContainer}>
            <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
              {value as string}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textTertiary}
            />
          </View>
        );
      default:
        return (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        );
    }
  };

  const Container = type === 'switch' ? View : TouchableOpacity;

  return (
    <Container
      onPress={type !== 'switch' ? onPress : undefined}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getIconColor()}15` },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={getIconColor()}
        />
      </View>
      
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: danger ? Colors.error : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {renderRight()}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: FontSize.sm,
    marginRight: Spacing.xs,
  },
});

export default SettingsItem;
