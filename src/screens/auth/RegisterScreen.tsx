/**
 * Register Screen
 * 
 * Multi input form dengan dropdown role
 * Password strength indicator dan validasi error
 * 
 * Requirements: 1.4
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { RegisterRequest } from '../../types';
import { AppButton, AppInput, AppCard, AppHeader } from '../../components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

type UserRole = 'USER' | 'ADMIN';

/**
 * Password Strength Indicator
 */
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const { theme } = useTheme();
  
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const getStrengthLabel = () => {
    if (strength <= 1) return { label: 'Weak', color: Colors.error };
    if (strength <= 2) return { label: 'Fair', color: Colors.warning };
    if (strength <= 3) return { label: 'Good', color: Colors.accent };
    return { label: 'Strong', color: Colors.success };
  };

  const { label, color } = getStrengthLabel();

  if (!password) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthBar,
              {
                backgroundColor: strength >= level ? color : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
};

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register: registerUser, isLoading } = useAuth();
  const { theme } = useTheme();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError(null);

    try {
      const userData: RegisterRequest = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        phone: data.phone.trim(),
        role: selectedRole,
      };

      const response = await registerUser(userData);

      if (!response.success) {
        setRegisterError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setRegisterError(errorMessage);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
      const err = error as { status?: number; message?: string; code?: string };

      if (err.code === 'VALIDATION_ERROR') {
        return err.message || 'Please check your input';
      }

      switch (err.status) {
        case 409:
          return 'Email already registered';
        case 400:
          return err.message || 'Invalid registration data';
        case 500:
          return 'Server error. Please try again later';
        default:
          return err.message || 'Registration failed. Please try again';
      }
    }
    return 'An unexpected error occurred';
  };

  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader title="Create Account" showBack />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Text */}
          <View style={styles.header}>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign up to get started with Rentverse
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              I want to register as
            </Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: selectedRole === 'USER' ? Colors.primary : theme.colors.border,
                  },
                  selectedRole === 'USER' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('USER')}
                disabled={isLoading}
              >
                <View style={[styles.roleIcon, { backgroundColor: `${Colors.primary}15` }]}>
                  <Ionicons name="person" size={24} color={Colors.primary} />
                </View>
                <Text style={[styles.roleTitle, { color: theme.colors.text }]}>
                  Tenant
                </Text>
                <Text style={[styles.roleDesc, { color: theme.colors.textSecondary }]}>
                  Looking for a place
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: selectedRole === 'ADMIN' ? Colors.secondary : theme.colors.border,
                  },
                  selectedRole === 'ADMIN' && styles.roleCardActiveProvider,
                ]}
                onPress={() => setSelectedRole('ADMIN')}
                disabled={isLoading}
              >
                <View style={[styles.roleIcon, { backgroundColor: `${Colors.secondary}15` }]}>
                  <Ionicons name="business" size={24} color={Colors.secondary} />
                </View>
                <Text style={[styles.roleTitle, { color: theme.colors.text }]}>
                  Provider
                </Text>
                <Text style={[styles.roleDesc, { color: theme.colors.textSecondary }]}>
                  List properties
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Card */}
          <AppCard padding="lg" style={styles.formCard}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Controller
                  control={control}
                  name="firstName"
                  rules={{
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <AppInput
                      label="First Name"
                      value={value}
                      onChangeText={onChange}
                      placeholder="John"
                      icon="person-outline"
                      error={errors.firstName?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </View>
              <View style={styles.halfInput}>
                <Controller
                  control={control}
                  name="lastName"
                  rules={{
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <AppInput
                      label="Last Name"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Doe"
                      error={errors.lastName?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </View>
            </View>

            {/* Email */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email format',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  placeholder="john@example.com"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Phone */}
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone is required',
                pattern: {
                  value: /^[0-9+\-\s()]{8,}$/,
                  message: 'Invalid phone number',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  placeholder="+60 12 345 6789"
                  icon="call-outline"
                  keyboardType="phone-pad"
                  error={errors.phone?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Date of Birth */}
            <View style={styles.dateContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Date of Birth
              </Text>
              {Platform.OS === 'web' ? (
                <AppInput
                  label=""
                  value={dateOfBirth.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const parsed = new Date(text);
                    if (!isNaN(parsed.getTime())) {
                      setDateOfBirth(parsed);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  icon="calendar-outline"
                  disabled={isLoading}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { 
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isLoading}
                  >
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                    <Text style={[styles.dateText, { color: theme.colors.text }]}>
                      {formatDate(dateOfBirth)}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dateOfBirth}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                    />
                  )}
                </>
              )}
            </View>

            {/* Password */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <AppInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Create a password"
                    icon="lock-closed-outline"
                    secureTextEntry
                    error={errors.password?.message}
                    disabled={isLoading}
                  />
                  <PasswordStrength password={value} />
                </>
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Please confirm password',
                validate: (value) => value === password || 'Passwords do not match',
              }}
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Confirm your password"
                  icon="lock-closed-outline"
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Error Message */}
            {registerError && (
              <View style={[styles.errorContainer, { backgroundColor: `${Colors.error}15` }]}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={[styles.errorText, { color: Colors.error }]}>
                  {registerError}
                </Text>
              </View>
            )}

            {/* Register Button */}
            <AppButton
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              icon="person-add-outline"
            />
          </AppCard>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={[styles.loginLink, { color: Colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  roleSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleCardActive: {
    backgroundColor: `${Colors.primary}08`,
  },
  roleCardActiveProvider: {
    backgroundColor: `${Colors.secondary}08`,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  roleTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  dateContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.md,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FontSize.md,
  },
  loginLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});

export default RegisterScreen;
