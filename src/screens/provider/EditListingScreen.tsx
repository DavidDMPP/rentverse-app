/**
 * EditListingScreen
 * 
 * Form screen for editing an existing property listing.
 * Loads existing property data and allows modifications.
 * 
 * Requirements: 6.2
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  getPropertyById,
  updateProperty,
  getPropertyTypes,
  getAmenities,
  validateListingData,
  ValidationResult,
} from '../../services/propertyService';
import {
  Property,
  CreatePropertyRequest,
  PropertyType,
  Amenity,
  FURNISHED_TYPES,
  FurnishedType,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme';

// Route params type
type EditListingRouteParams = {
  EditListing: { propertyId: string };
};

/**
 * Form state interface
 */
interface FormState {
  title: string;
  description: string;
  propertyTypeId: string;
  propertyTypeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  furnished: FurnishedType;
  images: string[];
  amenityIds: string[];
}

/**
 * FormField Component
 */
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, error, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * SelectField Component - Custom dropdown selector
 */
interface SelectFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder: string;
  options: { id: string; name: string }[];
  onSelect: (id: string, name: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required,
  error,
  value,
  placeholder,
  options,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, isDark } = useTheme();

  return (
    <FormField label={label} required={required} error={error}>
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.inputError,
          { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectButtonText, { color: theme.colors.text }, !value && { color: theme.colors.placeholder }] }>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => {
                    onSelect(item.id, item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item.name}</Text>
                  {value === item.name && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </FormField>
  );
};

/**
 * AmenityChip Component
 */
interface AmenityChipProps {
  amenity: Amenity;
  selected: boolean;
  onToggle: () => void;
}

const AmenityChip: React.FC<AmenityChipProps> = ({ amenity, selected, onToggle }) => {
  const { theme, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.amenityChip,
        selected && styles.amenityChipSelected,
        { backgroundColor: selected ? Colors.primary : (isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight), borderColor: selected ? Colors.primary : theme.colors.border },
      ]}
      onPress={onToggle}
    >
      <Text style={[styles.amenityChipText, { color: selected ? Colors.white : theme.colors.textSecondary }, selected && styles.amenityChipTextSelected]}>
        {amenity.name}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={16} color={Colors.white} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
};


/**
 * EditListingScreen Component
 * 
 * Requirements: 6.2
 */
export function EditListingScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditListingRouteParams, 'EditListing'>>();
  const { propertyId } = route.params;
  const { theme, isDark } = useTheme();

  // State
  const [form, setForm] = useState<FormState | null>(null);
  const [originalProperty, setOriginalProperty] = useState<Property | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  /**
   * Fetch property data and form options
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [property, typesData, amenitiesData] = await Promise.all([
          getPropertyById(propertyId),
          getPropertyTypes(),
          getAmenities(),
        ]);

        setOriginalProperty(property);
        setPropertyTypes(typesData as PropertyType[]);
        setAmenities(amenitiesData as Amenity[]);

        // Convert furnished value to FurnishedType
        let furnishedValue: FurnishedType = 'Unfurnished';
        if (typeof property.furnished === 'string') {
          furnishedValue = property.furnished as FurnishedType;
        } else if (property.furnished === true) {
          furnishedValue = 'Fully Furnished';
        }

        // Pre-fill form with existing data
        setForm({
          title: property.title || '',
          description: property.description || '',
          propertyTypeId: property.propertyTypeId || '',
          propertyTypeName: property.propertyType?.name || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zipCode: property.zipCode || '',
          price: property.price?.toString() || '',
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          areaSqm: property.areaSqm?.toString() || '',
          furnished: furnishedValue,
          images: property.images || [],
          amenityIds: property.amenities?.map(a => a.id) || [],
        });
      } catch (err) {
        console.error('Error fetching property data:', err);
        Alert.alert('Error', 'Failed to load property data. Please try again.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [propertyId, navigation]);

  /**
   * Update form field
   */
  const updateField = useCallback((field: keyof FormState, value: string | string[]) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Toggle amenity selection
   */
  const toggleAmenity = useCallback((amenityId: string) => {
    setForm(prev => {
      if (!prev) return null;
      const newAmenityIds = prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter(id => id !== amenityId)
        : [...prev.amenityIds, amenityId];
      return { ...prev, amenityIds: newAmenityIds };
    });
  }, []);

  /**
   * Add image URL
   */
  const addImageUrl = useCallback(() => {
    setShowAddImageModal(true);
  }, []);

  const handleConfirmAddImage = useCallback(() => {
    const url = newImageUrl.trim();
    if (url) {
      setForm(prev => prev ? ({
        ...prev,
        images: [...prev.images, url].slice(0, 10),
      }) : null);
    }
    setNewImageUrl('');
    setShowAddImageModal(false);
  }, [newImageUrl]);

  const handleCancelAddImage = useCallback(() => {
    setNewImageUrl('');
    setShowAddImageModal(false);
  }, []);

  /**
   * Remove image
   */
  const removeImage = useCallback((index: number) => {
    setForm(prev => prev ? {
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    } : null);
  }, []);

  /**
   * Validate and submit form
   * Requirements: 6.2
   */
  const handleSubmit = useCallback(async () => {
    if (!form) {
      console.log('Form is null, cannot submit');
      return;
    }

    console.log('Current form state:', JSON.stringify(form, null, 2));

    // Build request data
    const requestData: CreatePropertyRequest = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      propertyTypeId: form.propertyTypeId,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode?.trim() || '',
      price: parseFloat(form.price) || 0,
      bedrooms: parseInt(form.bedrooms, 10) || 0,
      bathrooms: parseInt(form.bathrooms, 10) || 0,
      areaSqm: parseFloat(form.areaSqm) || 0,
      furnished: form.furnished === 'Fully Furnished' || form.furnished === 'Partially Furnished',
      images: form.images,
      amenityIds: form.amenityIds,
    };

    // Validate
    console.log('Form data before validation:', JSON.stringify(form, null, 2));
    console.log('Request data for validation:', JSON.stringify(requestData, null, 2));
    const validation: ValidationResult = validateListingData(requestData);
    console.log('Validation result:', JSON.stringify(validation, null, 2));
    if (!validation.isValid) {
      setErrors(validation.errors);
      console.log('Validation errors:', validation.errors);
      if (Platform.OS === 'web') {
        window.alert('Please fill in all required fields correctly.');
      } else {
        Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Updating property data:', JSON.stringify(requestData, null, 2));
      await updateProperty(propertyId, requestData);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      console.error('Update property error:', err);
      const error = err as { status?: number; message?: string; data?: unknown };
      console.error('Error details:', JSON.stringify(error, null, 2));
      let errorMessage = 'Failed to update listing. Please try again.';
      
      if (error.status === 404) {
        errorMessage = 'Update listing feature is not available yet. Backend endpoint not implemented.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalErrorMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, propertyId, navigation]);

  // Loading state
  if (isLoading || !form) {
    return <LoadingSpinner fullScreen message="Loading property..." />;
  }

  // Furnished options for select
  const furnishedOptions = FURNISHED_TYPES.map(type => ({ id: type, name: type }));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }] }>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Listing</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Basic Information Section */}
        <View style={[styles.section, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>

          <FormField label="Title" required error={errors.title}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                errors.title && { borderColor: Colors.error },
              ]}
              value={form.title}
              onChangeText={(v: string) => updateField('title', v)}
              placeholder="e.g., Modern 2BR Apartment in KL"
              placeholderTextColor={theme.colors.placeholder}
            />
          </FormField>

          <FormField label="Description">
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              value={form.description}
              onChangeText={(v: string) => updateField('description', v)}
              placeholder="Describe your property..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </FormField>

          <SelectField
            label="Property Type"
            required
            error={errors.propertyTypeId}
            value={form.propertyTypeName}
            placeholder="Select property type"
            options={propertyTypes.map(t => ({ id: t.id, name: t.name }))}
            onSelect={(id, name) => {
              updateField('propertyTypeId', id);
              updateField('propertyTypeName', name);
            }}
          />
        </View>

        {/* Location Section */}
        <View style={[styles.section, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>

          <FormField label="Address" required error={errors.address}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                errors.address && { borderColor: Colors.error },
              ]}
              value={form.address}
              onChangeText={(v: string) => updateField('address', v)}
              placeholder="Street address"
              placeholderTextColor={theme.colors.placeholder}
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField label="City" required error={errors.city}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                    errors.city && { borderColor: Colors.error },
                  ]}
                  value={form.city}
                  onChangeText={(v: string) => updateField('city', v)}
                  placeholder="City"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </FormField>
            </View>
            <View style={styles.halfField}>
              <FormField label="State" required error={errors.state}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                    errors.state && { borderColor: Colors.error },
                  ]}
                  value={form.state}
                  onChangeText={(v: string) => updateField('state', v)}
                  placeholder="State"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </FormField>
            </View>
          </View>

          <FormField label="Zip Code" required error={errors.zipCode}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                errors.zipCode && { borderColor: Colors.error },
              ]}
              value={form.zipCode}
              onChangeText={(v: string) => updateField('zipCode', v)}
              placeholder="e.g., 50000"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numeric"
            />
          </FormField>
        </View>

        {/* Property Details Section */}
        <View style={[styles.section, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Property Details</Text>

          <FormField label="Daily Rent (RM)" required error={errors.price}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                errors.price && { borderColor: Colors.error },
              ]}
              value={form.price}
              onChangeText={(v: string) => updateField('price', v)}
              placeholder="0"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numeric"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <FormField label="Bedrooms" required error={errors.bedrooms}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                    errors.bedrooms && { borderColor: Colors.error },
                  ]}
                  value={form.bedrooms}
                  onChangeText={(v: string) => updateField('bedrooms', v)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </FormField>
            </View>
            <View style={styles.thirdField}>
              <FormField label="Bathrooms" required error={errors.bathrooms}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                    errors.bathrooms && { borderColor: Colors.error },
                  ]}
                  value={form.bathrooms}
                  onChangeText={(v: string) => updateField('bathrooms', v)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </FormField>
            </View>
            <View style={styles.thirdField}>
              <FormField label="Area (sqm)" required error={errors.areaSqm}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text },
                    errors.areaSqm && { borderColor: Colors.error },
                  ]}
                  value={form.areaSqm}
                  onChangeText={(v: string) => updateField('areaSqm', v)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </FormField>
            </View>
          </View>

          <SelectField
            label="Furnished Status"
            required
            value={form.furnished}
            placeholder="Select furnished status"
            options={furnishedOptions}
            onSelect={(id) => updateField('furnished', id)}
          />
        </View>


        {/* Images Section */}
        <View style={[styles.section, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Photos</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Add up to 10 photos of your property</Text>

          <View style={styles.imagesContainer}>
            {form.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {form.images.length < 10 && (
              <TouchableOpacity style={[styles.addImageButton, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border }]} onPress={addImageUrl}>
                <Ionicons name="camera-outline" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.addImageText, { color: theme.colors.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Amenities Section */}
        <View style={[styles.section, { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amenities</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Select available amenities</Text>

          <View style={styles.amenitiesContainer}>
            {amenities.map(amenity => (
              <AmenityChip
                key={amenity.id}
                amenity={amenity}
                selected={form.amenityIds.includes(amenity.id)}
                onToggle={() => toggleAmenity(amenity.id)}
              />
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { backgroundColor: theme.colors.textSecondary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={[styles.submitButtonText, { color: Colors.white }]}>Update Listing</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={[styles.alertModalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.alertModalContent, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.secondary} />
            <Text style={[styles.alertModalTitle, { color: theme.colors.text }]}>Success</Text>
            <Text style={[styles.alertModalMessage, { color: theme.colors.textSecondary }]}>
              Your listing has been updated successfully!
            </Text>
            <TouchableOpacity
              style={[styles.alertModalButton, { backgroundColor: Colors.primary }]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={[styles.alertModalButtonText, { color: Colors.white }]}>OK</Text>
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
        <View style={[styles.alertModalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.alertModalContent, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="close-circle" size={48} color={Colors.error} />
            <Text style={[styles.alertModalTitle, { color: theme.colors.text }]}>Error</Text>
            <Text style={[styles.alertModalMessage, { color: theme.colors.textSecondary }]}>{modalErrorMessage}</Text>
            <TouchableOpacity
              style={[styles.alertModalButton, { backgroundColor: Colors.error }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={[styles.alertModalButtonText, { color: Colors.white }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Image Modal */}
      <Modal
        visible={showAddImageModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAddImage}
      >
        <View style={[styles.alertModalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.alertModalContent, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="link" size={32} color={Colors.primary} />
            <Text style={[styles.alertModalTitle, { color: theme.colors.text }]}>Add Image URL</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? theme.colors.surfaceLight : theme.colors.surfaceLight, borderColor: theme.colors.border, color: theme.colors.text, width: '100%', marginTop: 12 },
              ]}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={theme.colors.placeholder}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', width: '100%', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: Colors.primary, flex: 1, marginRight: 8 }]}
                onPress={handleConfirmAddImage}
              >
                <Text style={[styles.alertModalButtonText, { color: Colors.white }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: Colors.dark.surfaceLight, flex: 1, marginLeft: 8 }]}
                onPress={handleCancelAddImage}
              >
                <Text style={[styles.alertModalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.dark.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  halfField: {
    flex: 1,
    paddingHorizontal: 6,
  },
  thirdField: {
    flex: 1,
    paddingHorizontal: 6,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amenityChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  amenityChipText: {
    fontSize: 13,
    color: '#374151',
  },
  amenityChipTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Alert Modal Styles
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  alertModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  alertModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertModalButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  alertModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EditListingScreen;
