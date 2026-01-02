/**
 * SearchBar Component
 * 
 * A text input with search icon for filtering properties.
 * Implements onSearch callback for parent components.
 * 
 * Requirements: 2.2
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onChangeText?: (text: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search properties...',
  value,
  onSearch,
  onChangeText,
  autoFocus = false,
}: SearchBarProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState('');
  
  const currentValue = value !== undefined ? value : internalValue;

  const handleChangeText = useCallback((text: string) => {
    if (value === undefined) {
      setInternalValue(text);
    }
    onChangeText?.(text);
  }, [value, onChangeText]);

  const handleSubmit = useCallback(() => {
    onSearch(currentValue);
  }, [onSearch, currentValue]);

  const handleClear = useCallback(() => {
    if (value === undefined) {
      setInternalValue('');
    }
    onChangeText?.('');
    onSearch('');
  }, [value, onChangeText, onSearch]);

  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={20}
        color="#666"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={currentValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {currentValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
});

export default SearchBar;
