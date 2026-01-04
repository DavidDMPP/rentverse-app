/**
 * BookingDetailScreen - Rentverse Style
 * 
 * Dark theme dengan modern UI
 * Displays detailed booking information
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Booking, BookingStatus } from '../../types';
import { getBookingById, cancelBooking } from '../../services/bookingService';
import { formatCurrency, formatDate, formatDateRange } from '../../utils/formatting';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type BookingDetailRouteProp = RouteProp<RootStackParamList, 'BookingDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  PENDING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', icon: 'time-outline', label: 'Pending Approval' },
  APPROVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', icon: 'checkmark-circle-outline', label: 'Approved' },
  ACTIVE: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA', icon: 'home-outline', label: 'Active Rental' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', icon: 'close-circle-outline', label: 'Rejected' },
  CANCELLED: { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748B', icon: 'ban-outline', label: 'Cancelled' },
  COMPLETED: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', icon: 'checkmark-done-outline', label: 'Completed' },
};

export function BookingDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookingDetailRouteProp>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load booking details');
      console.error('Error fetching booking:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!booking) return;
    try {
      setIsCancelling(true);
      await cancelBooking(booking.id, { reason: 'Cancelled by tenant' });
      setBooking({ ...booking, status: 'REJECTED' as BookingStatus });
      setShowCancelModal(false);
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleViewProperty = () => {
    if (booking?.propertyId) {
      navigation.navigate('PropertyDetail', { propertyId: booking.propertyId });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error || 'Booking not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBooking}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const property = booking.property;
  const landlord = booking.landlord;
  
  // Show CANCELLED for tenant if status is REJECTED (tenant cancelled)
  const displayStatus = booking.status === 'REJECTED' ? 'CANCELLED' : booking.status;
  const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.PENDING;
  
  const canCancel = ['PENDING'].includes(booking.status);
  const imageUri = property?.images?.[0] || 'https://picsum.photos/seed/prop/400/300';
  
  // Calculate days and total
  const bookingStartDate = new Date(booking.startDate);
  const bookingEndDate = new Date(booking.endDate);
  const days = Math.ceil((bookingEndDate.getTime() - bookingStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const pricePerDay = property?.price || 0;
  // Calculate total: use rentAmount if it looks correct (> pricePerDay), otherwise calculate
  const totalAmount = booking.rentAmount > pricePerDay ? booking.rentAmount : pricePerDay * days;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon as any} size={24} color={statusConfig.text} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </View>

        {/* Property Card */}
        <TouchableOpacity style={styles.propertyCard} onPress={handleViewProperty} activeOpacity={0.8}>
          <Image source={{ uri: imageUri }} style={styles.propertyImage} />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>{property?.title || 'Property'}</Text>
            <View style={styles.propertyLocation}>
              <Ionicons name="location" size={14} color={Colors.dark.textTertiary} />
              <Text style={styles.propertyLocationText} numberOfLines={1}>
                {property?.city}, {property?.state}
              </Text>
            </View>
            <Text style={styles.propertyPrice}>{formatCurrency(property?.price || 0)}/day</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.dark.textTertiary} />
        </TouchableOpacity>

        {/* Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Check-in</Text>
                  <Text style={styles.infoValue}>{formatDate(booking.startDate)}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Check-out</Text>
                  <Text style={styles.infoValue}>{formatDate(booking.endDate)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="today-outline" size={20} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{days} days</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="pricetag-outline" size={20} color={Colors.dark.textTertiary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Price/Day</Text>
                  <Text style={styles.infoValue}>{formatCurrency(property?.price || 0)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={20} color={Colors.success} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Total Amount</Text>
                  <Text style={[styles.infoValue, { color: Colors.success, fontSize: FontSize.lg }]}>
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
              </View>
              {booking.securityDeposit && (
                <View style={styles.infoItem}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accent} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Security Deposit</Text>
                    <Text style={styles.infoValue}>{formatCurrency(booking.securityDeposit)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Message</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Landlord Info */}
        {landlord && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Owner</Text>
            <View style={styles.landlordCard}>
              <View style={styles.landlordInfo}>
                <View style={styles.landlordAvatar}>
                  {landlord.profilePicture ? (
                    <Image source={{ uri: landlord.profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color={Colors.dark.textTertiary} />
                  )}
                </View>
                <View style={styles.landlordDetails}>
                  <Text style={styles.landlordName}>
                    {landlord.firstName} {landlord.lastName}
                  </Text>
                  {landlord.email && (
                    <Text style={styles.landlordContact}>{landlord.email}</Text>
                  )}
                  {landlord.phone && (
                    <Text style={styles.landlordContact}>{landlord.phone}</Text>
                  )}
                </View>
              </View>
              <View style={styles.contactButtons}>
                {landlord.phone && (
                  <TouchableOpacity 
                    style={styles.contactButton} 
                    onPress={() => handleCall(landlord.phone!)}
                  >
                    <Ionicons name="call" size={20} color={Colors.success} />
                  </TouchableOpacity>
                )}
                {landlord.email && (
                  <TouchableOpacity 
                    style={styles.contactButton} 
                    onPress={() => handleEmail(landlord.email)}
                  >
                    <Ionicons name="mail" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Booking Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Booking Created</Text>
                <Text style={styles.timelineDate}>{formatDate(booking.createdAt)}</Text>
              </View>
            </View>
            {booking.updatedAt !== booking.createdAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: statusConfig.text }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Last Updated</Text>
                  <Text style={styles.timelineDate}>{formatDate(booking.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cancel Button */}
      {canCancel && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setShowCancelModal(true)}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                <Text style={styles.modalButtonSecondaryText}>No, Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonDangerText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.dark.textSecondary,
    fontSize: FontSize.md,
  },
  errorTitle: {
    marginTop: Spacing.md,
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  errorMessage: {
    marginTop: Spacing.sm,
    color: Colors.dark.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  propertyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginBottom: 4,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  propertyLocationText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
  },
  propertyPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  notesCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  landlordCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  landlordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  landlordAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  landlordDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  landlordName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  landlordContact: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  timelineCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  timelineDate: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  modalMessage: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalButtonSecondaryText: {
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  modalButtonDanger: {
    backgroundColor: Colors.error,
  },
  modalButtonDangerText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});

export default BookingDetailScreen;
