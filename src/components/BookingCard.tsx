/**
 * BookingCard Component - Rentverse Style
 * 
 * Dark theme dengan modern UI
 * Displays booking information with action buttons
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '../types';
import { formatCurrency, formatDateRange } from '../utils/formatting';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../theme';

interface BookingCardProps {
  booking: Booking;
  role: 'tenant' | 'owner';
  onPress?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onApprove?: (booking: Booking) => void;
  onReject?: (booking: Booking) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(245, 158, 11, 0.2)', text: Colors.accent },
  APPROVED: { bg: 'rgba(34, 197, 94, 0.2)', text: Colors.success },
  ACTIVE: { bg: 'rgba(34, 197, 94, 0.2)', text: Colors.success },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.2)', text: Colors.error },
  CANCELLED: { bg: 'rgba(100, 116, 139, 0.2)', text: Colors.dark.textTertiary },
  COMPLETED: { bg: 'rgba(80, 72, 229, 0.2)', text: Colors.primary },
};

export function BookingCard({
  booking,
  role,
  onPress,
  onCancel,
  onApprove,
  onReject,
}: BookingCardProps): React.JSX.Element {
  const property = booking.property;
  
  // Calculate effective status based on dates
  const getEffectiveStatus = (): BookingStatus => {
    if (booking.status === 'APPROVED') {
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      if (now >= startDate && now <= endDate) {
        return 'ACTIVE';
      }
      if (now > endDate) {
        return 'COMPLETED';
      }
    }
    return booking.status;
  };
  
  const effectiveStatus = getEffectiveStatus();
  
  // Display label (show CANCELLED for tenant-cancelled bookings)
  const getDisplayStatus = (): string => {
    if (effectiveStatus === 'REJECTED' && role === 'tenant') {
      // If it's rejected and we're viewing as tenant, it might be cancelled by tenant
      return 'CANCELLED';
    }
    return effectiveStatus;
  };
  
  const displayStatus = getDisplayStatus();
  const statusColor = STATUS_COLORS[displayStatus] || STATUS_COLORS[effectiveStatus] || STATUS_COLORS.PENDING;
  
  const imageUri = property?.images?.[0] || 'https://picsum.photos/seed/prop/400/300';

  const canCancel = role === 'tenant' && booking.status === 'PENDING';
  
  const canApproveReject = role === 'owner' && booking.status === 'PENDING';

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(booking)}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {property?.title || 'Property'}
          </Text>
          <Text style={styles.price}>
            {formatCurrency(property?.price || 0)}/day
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={Colors.dark.textTertiary} />
            <Text style={styles.location} numberOfLines={1}>
              {property?.city}, {property?.state}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar" size={16} color={Colors.dark.textTertiary} />
          <Text style={styles.dateText}>
            {formatDateRange(booking.startDate, booking.endDate)}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {displayStatus}
          </Text>
        </View>
      </View>

      {booking.notes && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message:</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      )}

      {(canCancel || canApproveReject) && (
        <View style={styles.actions}>
          {canCancel && onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={(e) => {
                e.stopPropagation();
                onCancel(booking);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          {canApproveReject && (
            <>
              {onReject && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onReject(booking);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              )}
              {onApprove && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onApprove(booking);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginBottom: 4,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  messageContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  messageLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  cancelButton: {
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    ...Shadow.primary,
  },
  approveButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});

export default BookingCard;
