/**
 * CategoryFilter Component
 * 
 * Displays horizontal scrollable category chips for filtering properties
 * by property type.
 * 
 * Requirements: 2.3
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyTypeName, PROPERTY_TYPES } from '../types';

interface CategoryItem {
  id: string;
  name: PropertyTypeName | 'All';
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'apartment', name: 'Apartment', icon: 'business-outline' },
  { id: 'condominium', name: 'Condominium', icon: 'home-outline' },
  { id: 'service-residence', name: 'Service Residence', icon: 'bed-outline' },
  { id: 'townhouse', name: 'Townhouse', icon: 'storefront-outline' },
];

interface CategoryFilterProps {
  selectedCategory: PropertyTypeName | 'All' | null;
  onSelectCategory: (category: PropertyTypeName | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps): React.JSX.Element {
  const handlePress = (category: CategoryItem) => {
    if (category.name === 'All') {
      onSelectCategory(null);
    } else {
      onSelectCategory(category.name as PropertyTypeName);
    }
  };

  const isSelected = (category: CategoryItem): boolean => {
    if (category.name === 'All') {
      return selectedCategory === null || selectedCategory === 'All';
    }
    return selectedCategory === category.name;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.chip,
              isSelected(category) && styles.chipSelected,
            ]}
            onPress={() => handlePress(category)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon}
              size={18}
              color={isSelected(category) ? '#FFFFFF' : '#666'}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.chipText,
                isSelected(category) && styles.chipTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#2563EB',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});

export default CategoryFilter;
