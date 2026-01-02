/**
 * BookingManagementScreen
 * 
 * Provider screen for managing booking requests.
 * Features:
 * - Fetch bookings with role=owner
 * - Display pending bookings prominently
 * - Implement approve booking action
 * - Implement reject booking action with reason
 * - Display booking history
 * 
 * Requirements: 10.6, 10.7
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
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors, BorderRadius, Spacing, FontSize } from '../../theme';
import { Booking, BookingStatus } from '../../types';
import {
  getOwnerBookings,
  approveBooking,
  rejectBooking,
} from '../../services/bookingService';
import { BookingCard } from '../../components/BookingCard';
import { formatCurrency, formatDate } from '../../utils/formatting';

/**
 * Status filter tabs configuration
 * Requirements: 10.6
 */
const STATUS_TABS: Array<{ key: BookingStatus | 'ALL'; label: string; icon: string }> = [
  { key: 'ALL', label: 'All', icon: 'grid-outline' },
  { key: 'PENDING', label: 'Pending', icon: 'time-outline' },
  { key: 'ACTIVE', label: 'Active', icon: 'checkmark-circle-outline' },
  { key: 'REJECTED', label: 'Rejected', icon: 'close-circle-outline' },
];

/**
 * Screen Header Component
 */
const ScreenHeader: React.FC<{
  totalBookings: number;
  pendingCount: number;
}> = ({ totalBookings, pendingCount }) => (
  <View style={styles.screenHeader}>
    <View style={styles.screenHeaderTop}>
      <Text style={styles.screenTitle}>Bookings</Text>
      {pendingCount > 0 && (
        <View style={styles.pendingBadge}>
          <Ionicons name="notifications" size={14} color={Colors.white} />
          <Text style={styles.pendingBadgeText}>{pendingCount} new</Text>
        </View>
      )}
    </View>
    <Text style={styles.screenSubtitle}>
      Manage your property booking requests
    </Text>
    
    {/* Quick Stats */}
    <View style={styles.quickStats}>
      <View style={styles.quickStatItem}>
        <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
          <Ionicons name="calendar" size={18} color="#60A5FA" />
        </View>
        <View>
          <Text style={styles.quickStatValue}>{totalBookings}</Text>
          <Text style={styles.quickStatLabel}>Total</Text>
        </View>
      </View>
      <View style={styles.quickStatDivider} />
      <View style={styles.quickStatItem}>
        <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
          <Ionicons name="time" size={18} color="#FBBF24" />
        </View>
        <View>
          <Text style={styles.quickStatValue}>{pendingCount}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
      </View>
    </View>
  </View>
);

/**
 * Status Filter Tabs Component
 * Requirements: 10.6
 */
const StatusFilterTabs: React.FC<{
  selectedStatus: BookingStatus | 'ALL';
  onSelectStatus: (status: BookingStatus | 'ALL') => void;
  pendingCount: number;
  isDark: boolean;
}> = ({ selectedStatus, onSelectStatus, pendingCount, isDark }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {STATUS_TABS.map((tab) => {
        const isSelected = selectedStatus === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isSelected && styles.tabSelected,
            ]}
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
            {tab.key === 'PENDING' && pendingCount > 0 && (
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {pendingCount}
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
 * Empty State Component
 */
const EmptyState: React.FC<{ status: BookingStatus | 'ALL'; isDark: boolean }> = ({ status, isDark }) => {
  const getContent = () => {
    if (status === 'ALL') {
      return {
        icon: 'calendar-outline',
        title: 'No Bookings Yet',
        message: 'When tenants book your properties, they will appear here.',
        color: '#60A5FA',
      };
    }
    if (status === 'PENDING') {
      return {
        icon: 'time-outline',
        title: 'No Pending Requests',
        message: 'All caught up! No booking requests waiting for your response.',
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
    return {
      icon: 'close-circle-outline',
      title: 'No Rejected Bookings',
      message: 'Rejected bookings will appear here.',
      color: '#EF4444',
    };
  };

  const content = getContent();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${content.color}15` }]}>
        <Ionicons name={content.icon as any} size={48} color={content.color} />
      </View>
      <Text style={styles.emptyTitle}>{content.title}</Text>
      <Text style={styles.emptyMessage}>{content.message}</Text>
    </View>
  );
};

/**
 * Reject Booking Modal Component
 * Requirements: 10.7
 */
const RejectModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  isDark: boolean;
}> = ({ visible, onClose, onConfirm, isLoading, isDark }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]}>
          <Text style={[styles.modalTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>Reject Booking</Text>
          <Text style={[styles.modalSubtitle, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>
            Please provide a reason for rejecting this booking request.
          </Text>
          
          <TextInput
            style={[styles.reasonInput, { 
              borderColor: isDark ? Colors.dark.border : Colors.light.border,
              color: isDark ? Colors.dark.text : Colors.light.text,
              backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface,
            }]}
            placeholder="Enter rejection reason (optional)"
            placeholderTextColor={isDark ? Colors.dark.placeholder : Colors.light.placeholder}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isDark ? Colors.dark.surface : '#F3F4F6' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.modalCancelText, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.error }]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.modalRejectText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * BookingManagementScreen Component
 * 
 * Requirements: 10.6, 10.7
 */
export function BookingManagementScreen(): React.JSX.Element {
  const { theme, isDark } = useTheme();
  
  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<Booking | null>(null);

  // Approve modal state
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [bookingToApprove, setBookingToApprove] = useState<Booking | null>(null);

  // Result modal state (success/error)
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultModalType, setResultModalType] = useState<'success' | 'error'>('success');
  const [resultModalMessage, setResultModalMessage] = useState('');

  // Detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  /**
   * Count pending bookings
   */
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  /**
   * Fetch owner bookings
   * Requirements: 10.6
   */
  const fetchBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await getOwnerBookings();
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

  /**
   * Filter bookings by status (client-side)
   * Requirements: 10.6
   */
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      // Sort to show pending first
      const sorted = [...bookings].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setFilteredBookings(sorted);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === selectedStatus));
    }
  }, [bookings, selectedStatus]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * Handle status filter change
   * Requirements: 10.6
   */
  const handleStatusChange = (status: BookingStatus | 'ALL') => {
    setSelectedStatus(status);
  };

  /**
   * Handle approve booking
   * Requirements: 10.7
   */
  const handleApproveBooking = (booking: Booking) => {
    setBookingToApprove(booking);
    setApproveModalVisible(true);
  };

  /**
   * Confirm and execute booking approval
   * Requirements: 10.7
   */
  const confirmApproveBooking = async () => {
    if (!bookingToApprove) return;

    try {
      setProcessingId(bookingToApprove.id);
      setApproveModalVisible(false);
      
      await approveBooking(bookingToApprove.id);
      
      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToApprove.id ? { ...b, status: 'APPROVED' as BookingStatus } : b
        )
      );

      setBookingToApprove(null);
      setResultModalType('success');
      setResultModalMessage('Booking has been approved successfully.');
      setResultModalVisible(true);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to approve booking. Please try again.';
      setResultModalType('error');
      setResultModalMessage(errorMessage);
      setResultModalVisible(true);
      console.error('Error approving booking:', err);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Handle reject booking - show modal
   * Requirements: 10.7
   */
  const handleRejectBooking = (booking: Booking) => {
    setBookingToReject(booking);
    setRejectModalVisible(true);
  };

  /**
   * Confirm and execute booking rejection
   * Requirements: 10.7
   */
  const confirmRejectBooking = async (reason: string) => {
    if (!bookingToReject) return;

    try {
      setProcessingId(bookingToReject.id);
      setRejectModalVisible(false);
      
      await rejectBooking(bookingToReject.id, reason || undefined);
      
      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToReject.id
            ? { ...b, status: 'REJECTED' as BookingStatus, notes: reason || b.notes }
            : b
        )
      );

      setBookingToReject(null);
      setResultModalType('success');
      setResultModalMessage('Booking has been rejected.');
      setResultModalVisible(true);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to reject booking. Please try again.';
      setResultModalType('error');
      setResultModalMessage(errorMessage);
      setResultModalVisible(true);
      console.error('Error rejecting booking:', err);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Handle booking card press - show detail modal
   */
  const handleBookingPress = (booking: Booking) => {
    console.log('Selected booking:', JSON.stringify(booking, null, 2));
    console.log('Tenant data:', booking.tenant);
    setSelectedBooking(booking);
    setDetailModalVisible(true);
  };

  /**
   * Render booking item
   */
  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCardWrapper}>
      <BookingCard
        booking={item}
        role="owner"
        onPress={handleBookingPress}
        onApprove={handleApproveBooking}
        onReject={handleRejectBooking}
      />
    </View>
  );

  /**
   * Render list header
   */
  const renderHeader = () => (
    <View>
      <ScreenHeader 
        totalBookings={bookings.length} 
        pendingCount={pendingCount} 
      />
      <StatusFilterTabs
        selectedStatus={selectedStatus}
        onSelectStatus={handleStatusChange}
        pendingCount={pendingCount}
        isDark={isDark}
      />
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  // Error state
  if (error && bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
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
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState status={selectedStatus} isDark={isDark} />}
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

      {/* Loading overlay for processing */}
      {processingId && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingOverlayText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Reject Modal */}
      <RejectModal
        visible={rejectModalVisible}
        onClose={() => {
          setRejectModalVisible(false);
          setBookingToReject(null);
        }}
        onConfirm={confirmRejectBooking}
        isLoading={processingId === bookingToReject?.id}
        isDark={isDark}
      />

      {/* Approve Confirmation Modal */}
      <Modal
        visible={approveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApproveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.primary} />
            <Text style={styles.modalTitle}>Approve Booking</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to approve this booking request?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.dark.surfaceLight }]}
                onPress={() => {
                  setApproveModalVisible(false);
                  setBookingToApprove(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={confirmApproveBooking}
              >
                <Text style={styles.approveConfirmText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal (Success/Error) */}
      <Modal
        visible={resultModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name={resultModalType === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={56}
              color={resultModalType === 'success' ? Colors.secondary : Colors.error}
            />
            <Text style={styles.modalTitle}>
              {resultModalType === 'success' ? 'Success' : 'Error'}
            </Text>
            <Text style={styles.modalSubtitle}>{resultModalMessage}</Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { 
                  backgroundColor: resultModalType === 'success' ? Colors.primary : Colors.error,
                  width: '100%',
                }
              ]}
              onPress={() => setResultModalVisible(false)}
            >
              <Text style={styles.approveConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Property Info */}
                {selectedBooking.property && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Property</Text>
                    <View style={styles.propertyDetailCard}>
                      <Image
                        source={{ uri: selectedBooking.property.images?.[0] || 'https://picsum.photos/seed/prop/400/300' }}
                        style={styles.propertyDetailImage}
                      />
                      <View style={styles.propertyDetailInfo}>
                        <Text style={styles.propertyDetailTitle} numberOfLines={2}>
                          {selectedBooking.property.title}
                        </Text>
                        <View style={styles.propertyDetailLocation}>
                          <Ionicons name="location" size={14} color={Colors.dark.textTertiary} />
                          <Text style={styles.propertyDetailLocationText} numberOfLines={1}>
                            {selectedBooking.property.city}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Tenant Info */}
                {selectedBooking.tenant && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Tenant Information</Text>
                    <View style={styles.detailInfoCard}>
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={18} color={Colors.primary} />
                        <Text style={styles.detailLabel}>Name</Text>
                        <Text style={styles.detailValue}>
                          {selectedBooking.tenant.firstName || selectedBooking.tenant.name || ''} {selectedBooking.tenant.lastName || ''}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="mail" size={18} color={Colors.primary} />
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedBooking.tenant.email || '-'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={18} color={Colors.primary} />
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedBooking.tenant.phone || '-'}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Booking Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Booking Information</Text>
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={18} color={Colors.primary} />
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedBooking.startDate)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                      <Text style={styles.detailLabel}>End Date</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedBooking.endDate)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={18} color={Colors.primary} />
                      <Text style={styles.detailLabel}>Rent Amount</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedBooking.rentAmount)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="information-circle" size={18} color={Colors.primary} />
                      <Text style={styles.detailLabel}>Status</Text>
                      <View style={[
                        styles.statusBadge,
                        selectedBooking.status === 'PENDING' && { backgroundColor: 'rgba(251, 191, 36, 0.2)' },
                        selectedBooking.status === 'APPROVED' && { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
                        selectedBooking.status === 'ACTIVE' && { backgroundColor: 'rgba(96, 165, 250, 0.2)' },
                        selectedBooking.status === 'REJECTED' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          selectedBooking.status === 'PENDING' && { color: '#FBBF24' },
                          selectedBooking.status === 'APPROVED' && { color: '#22C55E' },
                          selectedBooking.status === 'ACTIVE' && { color: '#60A5FA' },
                          selectedBooking.status === 'REJECTED' && { color: '#EF4444' },
                        ]}>
                          {selectedBooking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Notes */}
                {selectedBooking.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Notes</Text>
                    <View style={styles.notesCard}>
                      <Text style={styles.notesText}>{selectedBooking.notes}</Text>
                    </View>
                  </View>
                )}

                {/* Actions */}
                {selectedBooking.status === 'PENDING' && (
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={[styles.detailActionButton, { backgroundColor: Colors.error }]}
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleRejectBooking(selectedBooking);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.white} />
                      <Text style={styles.detailActionText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.detailActionButton, { backgroundColor: Colors.primary }]}
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleApproveBooking(selectedBooking);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                      <Text style={styles.detailActionText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
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
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    textAlign: 'center',
    color: Colors.error,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Screen Header
  screenHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.dark.surface,
  },
  screenHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  quickStatLabel: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
    marginHorizontal: Spacing.md,
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
    marginRight: Spacing.sm,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  tabSelected: {
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
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextSelected: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flex: 1,
  },
  bookingCardWrapper: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 40,
  },
  emptyIconContainer: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    fontWeight: '500',
    color: Colors.white,
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
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
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
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  reasonInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.white,
    minHeight: 100,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  modalRejectText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  approveConfirmText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.md,
  },

  // Detail Modal
  detailModalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '90%',
    position: 'absolute',
    bottom: 0,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderBottomWidth: 0,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  propertyDetailCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  propertyDetailImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  propertyDetailInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  propertyDetailTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  propertyDetailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyDetailLocationText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textTertiary,
  },
  detailInfoCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  detailActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  detailActionText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default BookingManagementScreen;
