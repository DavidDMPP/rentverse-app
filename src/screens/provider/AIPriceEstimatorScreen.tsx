/**
 * AIPriceEstimatorScreen
 * 
 * Dark theme design sesuai rentverse web
 * - Property type selector
 * - Location input
 * - Bedrooms/Bathrooms counter
 * - Square footage slider
 * - Analyze button
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { predictPrice, formatPredictionResult } from '../../services/aiService';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

const PROPERTY_TYPES = ['Apartment', 'Condominium', 'Service Residence', 'Townhouse'];

/**
 * Counter Component
 */
const Counter: React.FC<{
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}> = ({ label, value, onIncrement, onDecrement }) => (
  <View style={styles.counterContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.counter}>
      <TouchableOpacity style={styles.counterButton} onPress={onDecrement}>
        <Ionicons name="remove" size={20} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.counterValue}>{value}</Text>
      <TouchableOpacity style={styles.counterButton} onPress={onIncrement}>
        <Ionicons name="add" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

export function AIPriceEstimatorScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'Apartment',
    location: '',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
  });

  const handleAnalyze = async () => {
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const response = await predictPrice({
        property_type: formData.type as any,
        location: formData.location,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.sqft,
        furnished: 'No',
      });
      setResult(response);
    } catch (error) {
      Alert.alert('Error', 'Could not complete analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      type: 'Apartment',
      location: '',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 850,
    });
  };

  // Loading overlay
  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <MaterialCommunityIcons 
            name="brain" 
            size={40} 
            color={Colors.primary} 
            style={styles.loadingIcon}
          />
        </View>
        <Text style={styles.loadingTitle}>Rentverse Intelligence...</Text>
        <Text style={styles.loadingSubtitle}>
          Analyzing hyper-local market trends in {formData.location}
        </Text>
      </View>
    );
  }

  // Result view
  if (result) {
    const formatted = formatPredictionResult(result);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleReset}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Result</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultCard}>
            <MaterialCommunityIcons name="robot-happy" size={48} color={Colors.success} />
            <Text style={styles.resultLabel}>Recommended Price</Text>
            <Text style={styles.resultPrice}>{formatted.predictedPrice}</Text>
            <Text style={styles.resultPeriod}>per day</Text>
          </View>

          <View style={styles.rangeCard}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Min Price</Text>
              <Text style={styles.rangeValue}>{formatted.priceRange.min}</Text>
            </View>
            <View style={styles.rangeDivider} />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Max Price</Text>
              <Text style={styles.rangeValue}>{formatted.priceRange.max}</Text>
            </View>
          </View>

          <View style={styles.confidenceCard}>
            <Ionicons name="analytics-outline" size={20} color={Colors.dark.textSecondary} />
            <Text style={styles.confidenceLabel}>Confidence Score:</Text>
            <Text style={styles.confidenceValue}>{formatted.confidence}</Text>
          </View>

          <TouchableOpacity style={styles.newButton} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
            <Text style={styles.newButtonText}>New Estimation</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Price Estimator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Estimate Rental Value</Text>
          <Text style={styles.subtitle}>
            Use our dedicated Rentverse AI to find the optimal listing price based on real-time market data.
          </Text>
        </View>

        {/* Property Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Type</Text>
          <View style={styles.typeSelector}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.type === type && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type })}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === type && styles.typeButtonTextActive,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location / City</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location" size={20} color={Colors.dark.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sudirman, Jakarta"
              placeholderTextColor={Colors.dark.textTertiary}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>
        </View>

        {/* Bedrooms & Bathrooms */}
        <View style={styles.counterRow}>
          <Counter
            label="Bedrooms"
            value={formData.bedrooms}
            onIncrement={() => setFormData({ ...formData, bedrooms: formData.bedrooms + 1 })}
            onDecrement={() => setFormData({ ...formData, bedrooms: Math.max(0, formData.bedrooms - 1) })}
          />
          <Counter
            label="Bathrooms"
            value={formData.bathrooms}
            onIncrement={() => setFormData({ ...formData, bathrooms: formData.bathrooms + 1 })}
            onDecrement={() => setFormData({ ...formData, bathrooms: Math.max(0, formData.bathrooms - 1) })}
          />
        </View>

        {/* Square Footage */}
        <View style={styles.inputGroup}>
          <View style={styles.sliderHeader}>
            <Text style={styles.inputLabel}>Square Footage</Text>
            <Text style={styles.sliderValue}>{formData.sqft} sq ft</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(formData.sqft / 5000) * 100}%` }]} />
          </View>
          <View style={styles.sliderButtons}>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setFormData({ ...formData, sqft: Math.max(100, formData.sqft - 50) })}
            >
              <Ionicons name="remove" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setFormData({ ...formData, sqft: Math.min(5000, formData.sqft + 50) })}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Ionicons name="analytics" size={24} color={Colors.white} />
          <Text style={styles.analyzeButtonText}>Analyze with Rentverse AI</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },

  // Title
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

  // Input Group
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },

  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.dark.background,
  },
  typeButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.dark.textTertiary,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },

  // Text Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.white,
  },

  // Counter
  counterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  counterContainer: {
    flex: 1,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  counterButton: {
    padding: Spacing.xs,
  },
  counterValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  // Slider
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sliderValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Analyze Button
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  analyzeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  // Loading
  loadingOverlay: {
    flex: 1,
    backgroundColor: `${Colors.dark.background}E6`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingSpinner: {
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  loadingIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
  loadingTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },

  // Result
  resultContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  resultCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  resultLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  resultPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  resultPeriod: {
    fontSize: FontSize.sm,
    color: Colors.dark.textTertiary,
  },
  rangeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: Spacing.md,
  },
  rangeLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
  },
  rangeValue: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 4,
  },
  confidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  confidenceLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
  confidenceValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  newButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default AIPriceEstimatorScreen;