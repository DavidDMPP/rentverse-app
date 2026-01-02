/**
 * BookingScreen - Rentverse Style
 * 
 * Dark theme dengan modern UI - Enhanced Design
 * Calendar picker dan price summary
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Property } from '../../types';
import { getPropertyById } from '../../services/propertyService';
import { createBooking, createBookingPayload, validateBookingDates } from '../../services/bookingService';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Booking: { propertyId: string };
  TenantTabs: undefined;
};

type BookingRouteProp = RouteProp<RootStackParamList, 'Booking'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


/**
 * Property Hero Card Component
 */
const PropertyHeroCard: React.FC<{ property: Property }> = ({ property }) => {
  const imageUri = property.images?.[0] || 'https://picsum.photos/seed/prop/400/300';

  return (
    <View style={styles.heroCard}>
      <Image source={{ uri: imageUri }} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
        style={styles.heroGradient}
      />
      <View style={styles.heroContent}>
        <View style={styles.heroInfo}>
          <Text style={styles.heroTitle} numberOfLines={2}>{property.title}</Text>
          <View style={styles.heroLocation}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.heroLocationText} numberOfLines={1}>
              {property.city}, {property.state}
            </Text>
          </View>
        </View>
        <View style={styles.heroPriceContainer}>
          <Text style={styles.heroPriceLabel}>Per Day</Text>
          <Text style={styles.heroPrice}>{formatCurrency(property.price)}</Text>
        </View>
      </View>
      
      {/* Property Stats */}
      <View style={styles.heroStats}>
        <View style={styles.heroStatItem}>
          <Ionicons name="bed-outline" size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.heroStatText}>{property.bedrooms || 2} Beds</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStatItem}>
          <Ionicons name="water-outline" size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.heroStatText}>{property.bathrooms || 1} Baths</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStatItem}>
          <Ionicons name="expand-outline" size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.heroStatText}>{property.areaSqm || 50} m²</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Success Modal Component
 */
const SuccessModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.successIconContainer}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={40} color={Colors.white} />
            </View>
          </View>
        </View>
        <Text style={styles.successTitle}>Booking Submitted!</Text>
        <Text style={styles.successMessage}>
          Your booking request has been sent to the property owner. 
          You will be notified once they respond.
        </Text>
        <TouchableOpacity style={styles.successButton} onPress={onClose}>
          <Text style={styles.successButtonText}>View My Bookings</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);


export function BookingScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookingRouteProp>();
  const { propertyId } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  const [message, setMessage] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPropertyById(propertyId);
      setProperty(data);
    } catch (err) {
      setError('Failed to load property details. Please try again.');
      console.error('Error fetching property:', err);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate >= endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!property) return;

    const validation = validateBookingDates(startDate, endDate);
    if (!validation.isValid) {
      Alert.alert('Invalid Dates', validation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = createBookingPayload(
        property.id,
        startDate,
        endDate,
        message.trim() || undefined
      );
      await createBooking(payload);
      setShowSuccess(true);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to submit booking. Please try again.';
      Alert.alert('Booking Failed', errorMessage);
      console.error('Error creating booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.navigate('TenantTabs');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error || 'Property not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProperty}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate duration in days and format as months + days
  const calculateDuration = (start: Date, end: Date): { days: number; text: string } => {
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (totalDays < 30) {
      return { days: totalDays, text: `${totalDays} day${totalDays > 1 ? 's' : ''}` };
    }
    
    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    
    if (remainingDays === 0) {
      return { days: totalDays, text: `${months} month${months > 1 ? 's' : ''}` };
    }
    
    return { 
      days: totalDays, 
      text: `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}` 
    };
  };
  
  const duration = calculateDuration(startDate, endDate);
  const totalEstimate = property.price * duration.days;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Property</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Property Hero Card */}
        <PropertyHeroCard property={property} />

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Select Rental Period</Text>
          </View>
          
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateCard} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateCardLabel}>Check In</Text>
              <Text style={styles.dateCardValue}>{formatDate(startDate)}</Text>
              <View style={styles.dateCardIcon}>
                <Ionicons name="chevron-down" size={16} color={Colors.dark.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={20} color={Colors.dark.textTertiary} />
            </View>

            <TouchableOpacity style={styles.dateCard} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateCardLabel}>Check Out</Text>
              <Text style={styles.dateCardValue}>{formatDate(endDate)}</Text>
              <View style={styles.dateCardIcon}>
                <Ionicons name="chevron-down" size={16} color={Colors.dark.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={styles.durationText}>{duration.text} rental period</Text>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="chatbubble-ellipses" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Message to Owner</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Introduce yourself or ask questions about the property..."
              placeholderTextColor={Colors.dark.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>
        </View>

        {/* Booking Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="receipt" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Price Details</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Rent</Text>
              <Text style={styles.summaryValue}>{formatCurrency(property.price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{duration.text}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Estimated Total</Text>
              <Text style={styles.summaryTotalValue}>{formatCurrency(totalEstimate)}</Text>
            </View>
          </View>

          {/* Status Info */}
          <View style={styles.statusInfo}>
            <View style={styles.statusIcon}>
              <Ionicons name="information-circle" size={18} color="#FBBF24" />
            </View>
            <Text style={styles.statusText}>
              Your booking will be pending until the owner approves it
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPrice}>
          <Text style={styles.bottomBarPriceLabel}>Total Estimate</Text>
          <Text style={styles.bottomBarPriceValue}>{formatCurrency(totalEstimate)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <SuccessModal visible={showSuccess} onClose={handleSuccessClose} />
    </View>
  );
}


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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSpacer: {
    width: 40,
  },

  // Hero Card
  heroCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  heroImage: {
    width: '100%',
    height: 160,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
  },
  heroInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroLocationText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  heroPriceContainer: {
    alignItems: 'flex-end',
  },
  heroPriceLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surfaceLight,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.dark.border,
  },


  // Section
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(80, 72, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  optionalBadge: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Date Selection
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'relative',
  },
  dateCardLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateCardValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  dateCardIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80, 72, 229, 0.1)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: 6,
  },
  durationText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Message Input
  messageContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  messageInput: {
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.white,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    fontWeight: '500',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: '#FBBF24',
    fontWeight: '500',
  },


  // Bottom Bar
  bottomSpacer: {
    height: 20,
  },
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
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  bottomBarPrice: {
    flex: 1,
  },
  bottomBarPriceLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bottomBarPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  successIconContainer: {
    marginBottom: Spacing.lg,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  successMessage: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    gap: 8,
  },
  successButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default BookingScreen;
