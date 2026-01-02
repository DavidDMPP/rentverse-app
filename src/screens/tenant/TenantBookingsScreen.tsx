/**
 * TenantBookingsScreen - Rentverse Style
 * 
 * Dark theme dengan modern UI
 * Displays tenant's booking history with status filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '../../types';
import { getTenantBookings, cancelBooking } from '../../services/bookingService';
import { BookingCard } from '../../components/BookingCard';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';

const STATUS_TABS: Array<{ key: BookingStatus | 'ALL'; label: string; icon: string }> = [
  { key: 'ALL', label: 'All', icon: 'grid-outline' },
  { key: 'PENDING', label: 'Pending', icon: 'time-outline' },
  { key: 'APPROVED', label: 'Approved', icon: 'checkmark-circle-outline' },
  { key: 'ACTIVE', label: 'Active', icon: 'home-outline' },
  { key: 'COMPLETED', label: 'Done', icon: 'checkmark-done-outline' },
];

/**
 * Screen Header with Stats
 */
const ScreenHeader: React.FC<{
  totalBookings: number;
  pendingCount: number;
  activeCount: number;
}> = ({ totalBookings, pendingCount, activeCount }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Track your rental requests</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.headerBadge}>
            <Ionicons name="hourglass-outline" size={14} color={Colors.dark.background} />
            <Text style={styles.headerBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>
    </View>
    
    {/* Quick Stats - Full Width */}
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
          <Ionicons name="calendar" size={18} color="#60A5FA" />
        </View>
        <Text style={styles.statValue}>{totalBookings}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
          <Ionicons name="time" size={18} color="#FBBF24" />
        </View>
        <Text style={styles.statValue}>{pendingCount}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
          <Ionicons name="home" size={18} color="#22C55E" />
        </View>
        <Text style={styles.statValue}>{activeCount}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
    </View>
  </View>
);

/**
 * Status Filter Tabs
 */
const StatusFilterTabs: React.FC<{
  selectedStatus: BookingStatus | 'ALL';
  onSelectStatus: (status: BookingStatus | 'ALL') => void;
  counts: Record<string, number>;
}> = ({ selectedStatus, onSelectStatus, counts }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {STATUS_TABS.map((tab) => {
        const isSelected = selectedStatus === tab.key;
        const count = tab.key === 'ALL' ? null : counts[tab.key] || 0;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isSelected && styles.tabActive]}
            onPress={() => onSelectStatus(tab.key)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={isSelected ? Colors.white : Colors.dark.textSecondary} 
            />
            <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {count !== null && count > 0 && (
              <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

/**
 * Empty State
 */
const EmptyState: React.FC<{ status: BookingStatus | 'ALL' }> = ({ status }) => {
  const getContent = () => {
    if (status === 'ALL') {
      return {
        icon: 'calendar-outline',
        title: 'No Bookings Yet',
        message: 'Start exploring properties and make your first booking!',
        color: '#60A5FA',
      };
    }
    if (status === 'PENDING') {
      return {
        icon: 'time-outline',
        title: 'No Pending Bookings',
        message: 'All your booking requests have been processed.',
        color: '#FBBF24',
      };
    }
    if (status === 'APPROVED') {
      return {
        icon: 'checkmark-circle-outline',
        title: 'No Approved Bookings',
        message: 'Approved bookings will appear here.',
        color: '#22C55E',
      };
    }
    if (status === 'ACTIVE') {
      return {
        icon: 'home-outline',
        title: 'No Active Rentals',
        message: 'Your current rentals will appear here.',
        color: '#A78BFA',
      };
    }
    return {
      icon: 'checkmark-done-outline',
      title: 'No Completed Bookings',
      message: 'Your rental history will appear here.',
      color: '#94A3B8',
    };
  };

  const content = getContent();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${content.color}15` }]}>
        <Ionicons name={content.icon as any} size={48} color={content.color} />
      </View>
      <Text style={styles.emptyTitle}>{content.title}</Text>
      <Text style={styles.emptyMessage}>{content.message}</Text>
    </View>
  );
};

export function TenantBookingsScreen(): React.JSX.Element {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate counts for each status
  const statusCounts = {
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
    ACTIVE: bookings.filter(b => b.status === 'ACTIVE').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  const fetchBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await getTenantBookings();
      setBookings(response.data || []);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load bookings. Please try again.';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStatus === 'ALL') {
      // Sort by date, newest first
      const sorted = [...bookings].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFilteredBookings(sorted);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === selectedStatus));
    }
  }, [bookings, selectedStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = (status: BookingStatus | 'ALL') => {
    setSelectedStatus(status);
  };

  const handleCancelBooking = (booking: Booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      setShowCancelModal(false);
      setCancellingId(bookingToCancel.id);
      
      await cancelBooking(bookingToCancel.id, { reason: 'Cancelled by tenant' });
      
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id ? { ...b, status: 'CANCELLED' as BookingStatus } : b
        )
      );

      setShowSuccessModal(true);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to cancel booking. Please try again.';
      setErrorMessage(errMsg);
      setShowErrorModal(true);
      console.error('Error cancelling booking:', err);
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  const handleBookingPress = (booking: Booking) => {
    console.log('Booking pressed:', booking.id);
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <BookingCard
      booking={item}
      role="tenant"
      onPress={handleBookingPress}
      onCancel={handleCancelBooking}
    />
  );

  const renderHeader = () => (
    <View>
      <ScreenHeader 
        totalBookings={bookings.length}
        pendingCount={statusCounts.PENDING}
        activeCount={statusCounts.ACTIVE + statusCounts.APPROVED}
      />
      <StatusFilterTabs
        selectedStatus={selectedStatus}
        onSelectStatus={handleStatusChange}
        counts={statusCounts}
      />
      {/* Spacer for first card */}
      <View style={{ height: Spacing.md }} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        </View>
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptyMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState status={selectedStatus} />}
        contentContainerStyle={[
          styles.listContent,
          filteredBookings.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchBookings(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading overlay */}
      {cancellingId && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingOverlayText}>Cancelling booking...</Text>
          </View>
        </View>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this booking?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmCancelBooking}
              >
                <Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>
              Booking has been cancelled successfully.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { marginTop: Spacing.md }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="close-circle" size={48} color={Colors.error} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { marginTop: Spacing.md }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonConfirmText}>OK</Text>
            </TouchableOpacity>
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
    padding: Spacing.lg,
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
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

  // Header
  header: {
    backgroundColor: Colors.dark.surface,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.background,
  },

  // Stats Row - Full Width
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.dark.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surfaceLight,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: Colors.dark.border,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingBottom: 120,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  loadingOverlayText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },

  // Modal
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
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
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
  },
  modalButtonCancel: {
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalButtonCancelText: {
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonConfirmText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});

export default TenantBookingsScreen;
