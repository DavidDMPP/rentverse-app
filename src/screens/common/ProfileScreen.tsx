/**
 * ProfileScreen
 * 
 * Dark theme design sesuai rentverse web
 * - Profile header dengan gradient
 * - Stats row
 * - Menu groups
 * - Logout button
 * 
 * Requirements: 1.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { getMyProperties } from '../../services/propertyService';
import { getOwnerBookings, getTenantBookings } from '../../services/bookingService';
import { getFavorites } from '../../services/propertyService';

const menuGroups = [
  {
    title: 'Account Settings',
    items: [
      { icon: 'person-outline', label: 'Personal Information', color: '#60A5FA' },
      { icon: 'shield-checkmark-outline', label: 'Security & Password', color: '#A78BFA' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { icon: 'receipt-outline', label: 'My Bookings', color: '#FB923C' },
      { icon: 'time-outline', label: 'Recently Viewed', color: '#818CF8' },
      { icon: 'star-outline', label: 'Reviews & Ratings', color: '#FBBF24' },
    ],
  },
  {
    title: 'Support & About',
    items: [
      { icon: 'information-circle-outline', label: 'About Rentverse', color: '#94A3B8' },
    ],
  },
];

/**
 * Menu Item Component
 */
const MenuItem: React.FC<{
  icon: string;
  label: string;
  color: string;
  onPress?: () => void;
}> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIcon, { backgroundColor: Colors.dark.background }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.dark.textTertiary} />
  </TouchableOpacity>
);

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  
  // State for personal info modal
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    stat1Value: '0',
    stat1Label: 'Listings',
    stat2Value: '0',
    stat2Label: 'Bookings',
    stat3Value: '0',
    stat3Label: 'Saved',
  });

  const isProvider = user?.role === 'ADMIN';

  // Fetch real stats data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      setStatsLoading(true);
      try {
        if (isProvider) {
          // Provider stats: Listings, Bookings received, Active bookings
          const [propertiesRes, bookingsRes] = await Promise.all([
            getMyProperties(user.id),
            getOwnerBookings(undefined, 1, 100),
          ]);
          
          const totalListings = propertiesRes.properties.length;
          const totalBookings = bookingsRes.pagination?.total || bookingsRes.data.length;
          const activeBookings = bookingsRes.data.filter(
            b => b.status === 'APPROVED' || b.status === 'ACTIVE'
          ).length;
          
          setStats({
            stat1Value: totalListings.toString(),
            stat1Label: 'Listings',
            stat2Value: totalBookings.toString(),
            stat2Label: 'Bookings',
            stat3Value: activeBookings.toString(),
            stat3Label: 'Active',
          });
        } else {
          // Tenant stats: Bookings, Saved, Pending
          const [bookingsRes, favoritesRes] = await Promise.all([
            getTenantBookings(),
            getFavorites(),
          ]);
          
          const totalBookings = bookingsRes.pagination?.total || bookingsRes.data.length;
          const savedCount = favoritesRes.length;
          const pendingBookings = bookingsRes.data.filter(b => b.status === 'PENDING').length;
          
          setStats({
            stat1Value: totalBookings.toString(),
            stat1Label: 'Bookings',
            stat2Value: savedCount.toString(),
            stat2Label: 'Saved',
            stat3Value: pendingBookings.toString(),
            stat3Label: 'Pending',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id, isProvider]);

  const handleLogout = async () => {
    await logout();
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) return user.name;
    return 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  const handleOpenPersonalInfo = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPhone(user?.phone || '');
    setShowPersonalInfoModal(true);
  };

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      // Update user info via AuthContext
      if (updateUser) {
        await updateUser({
          firstName,
          lastName,
          phone,
        });
      }
      setShowPersonalInfoModal(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuPress = (label: string) => {
    if (label === 'Personal Information') {
      handleOpenPersonalInfo();
    }
    // Add other menu handlers here
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient} />
        
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.profilePicture || `https://picsum.photos/seed/${user?.id || 'user'}/200` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="pencil" size={12} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <Text style={styles.userName}>{getUserName()}</Text>
        <Text style={styles.userEmail}>{getUserEmail()}</Text>
        
        {/* Badge */}
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>
            {isProvider ? 'Premium Provider' : 'Gold Tenant'}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        {statsLoading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.stat1Value}</Text>
              <Text style={styles.statLabel}>{stats.stat1Label}</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statValue}>{stats.stat2Value}</Text>
              <Text style={styles.statLabel}>{stats.stat2Label}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.stat3Value}</Text>
              <Text style={styles.statLabel}>{stats.stat3Label}</Text>
            </View>
          </>
        )}
      </View>

      {/* Menu Groups */}
      <View style={styles.menuContainer}>
        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <View style={styles.menuCard}>
              {group.items.map((item, itemIndex) => (
                <MenuItem
                  key={itemIndex}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                  onPress={() => handleMenuPress(item.label)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Rentverse App v2.0.1</Text>
          <Text style={styles.footerSubtext}>Made with precision for modern living.</Text>
        </View>
      </View>

      {/* Personal Information Modal */}
      <Modal
        visible={showPersonalInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonalInfoModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Information</Text>
              <TouchableOpacity 
                onPress={() => setShowPersonalInfoModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>First Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.dark.textTertiary}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.dark.textTertiary}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={getUserEmail()}
                  editable={false}
                  placeholderTextColor={Colors.dark.textTertiary}
                />
                <Text style={styles.formHint}>Email cannot be changed</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.dark.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPersonalInfoModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSavePersonalInfo}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentContainer: {
    paddingBottom: 120,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: Spacing.xxl,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: `${Colors.primary}33`,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: Colors.dark.surface,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.dark.border,
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
    fontWeight: '500',
    marginTop: 4,
  },
  statsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  // Menu
  menuContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  menuGroup: {
    marginBottom: Spacing.xxl,
  },
  menuGroupTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.error}1A`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}33`,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footerSubtext: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  formInputDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.dark.background,
  },
  formHint: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    marginTop: Spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ProfileScreen;