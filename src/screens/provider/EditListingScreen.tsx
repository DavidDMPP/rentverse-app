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

const FormField: React.FC<FormFieldProps> = ({ label, required, error, children }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

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

  return (
    <FormField label={label} required={required} error={error}>
      <TouchableOpacity
        style={[styles.selectButton, error && styles.inputError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectButtonText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(item.id, item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                  {value === item.name && (
                    <Ionicons name="checkmark" size={20} color="#6200ee" />
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

const AmenityChip: React.FC<AmenityChipProps> = ({ amenity, selected, onToggle }) => (
  <TouchableOpacity
    style={[styles.amenityChip, selected && styles.amenityChipSelected]}
    onPress={onToggle}
  >
    <Text style={[styles.amenityChipText, selected && styles.amenityChipTextSelected]}>
      {amenity.name}
    </Text>
    {selected && (
      <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
    )}
  </TouchableOpacity>
);


/**
 * EditListingScreen Component
 * 
 * Requirements: 6.2
 */
export function EditListingScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditListingRouteParams, 'EditListing'>>();
  const { propertyId } = route.params;

  // State
  const [form, setForm] = useState<FormState | null>(null);
  const [originalProperty, setOriginalProperty] = useState<Property | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    Alert.prompt(
      'Add Image URL',
      'Enter the URL of the property image',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (url?: string) => {
            if (url && url.trim() && form) {
              setForm(prev => prev ? {
                ...prev,
                images: [...prev.images, url.trim()].slice(0, 10),
              } : null);
            }
          },
        },
      ],
      'plain-text'
    );
  }, [form]);

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
    if (!form) return;

    // Build request data
    const requestData: CreatePropertyRequest = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      propertyTypeId: form.propertyTypeId,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      price: parseFloat(form.price) || 0,
      bedrooms: parseInt(form.bedrooms, 10) || 0,
      bathrooms: parseInt(form.bathrooms, 10) || 0,
      areaSqm: parseFloat(form.areaSqm) || 0,
      furnished: form.furnished,
      images: form.images,
      amenityIds: form.amenityIds,
    };

    // Validate
    const validation: ValidationResult = validateListingData(requestData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProperty(propertyId, requestData);
      Alert.alert(
        'Success',
        'Your listing has been updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update listing. Please try again.';
      Alert.alert('Error', errorMessage);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <FormField label="Title" required error={errors.title}>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={form.title}
              onChangeText={(v: string) => updateField('title', v)}
              placeholder="e.g., Modern 2BR Apartment in KL"
              placeholderTextColor="#9CA3AF"
            />
          </FormField>

          <FormField label="Description">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v: string) => updateField('description', v)}
              placeholder="Describe your property..."
              placeholderTextColor="#9CA3AF"
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <FormField label="Address" required error={errors.address}>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={form.address}
              onChangeText={(v: string) => updateField('address', v)}
              placeholder="Street address"
              placeholderTextColor="#9CA3AF"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField label="City" required error={errors.city}>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  value={form.city}
                  onChangeText={(v: string) => updateField('city', v)}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                />
              </FormField>
            </View>
            <View style={styles.halfField}>
              <FormField label="State" required error={errors.state}>
                <TextInput
                  style={[styles.input, errors.state && styles.inputError]}
                  value={form.state}
                  onChangeText={(v: string) => updateField('state', v)}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                />
              </FormField>
            </View>
          </View>
        </View>

        {/* Property Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <FormField label="Daily Rent (RM)" required error={errors.price}>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              value={form.price}
              onChangeText={(v: string) => updateField('price', v)}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <FormField label="Bedrooms" required error={errors.bedrooms}>
                <TextInput
                  style={[styles.input, errors.bedrooms && styles.inputError]}
                  value={form.bedrooms}
                  onChangeText={(v: string) => updateField('bedrooms', v)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </FormField>
            </View>
            <View style={styles.thirdField}>
              <FormField label="Bathrooms" required error={errors.bathrooms}>
                <TextInput
                  style={[styles.input, errors.bathrooms && styles.inputError]}
                  value={form.bathrooms}
                  onChangeText={(v: string) => updateField('bathrooms', v)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </FormField>
            </View>
            <View style={styles.thirdField}>
              <FormField label="Area (sqm)" required error={errors.areaSqm}>
                <TextInput
                  style={[styles.input, errors.areaSqm && styles.inputError]}
                  value={form.areaSqm}
                  onChangeText={(v: string) => updateField('areaSqm', v)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Add up to 10 photos of your property</Text>

          <View style={styles.imagesContainer}>
            {form.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {form.images.length < 10 && (
              <TouchableOpacity style={styles.addImageButton} onPress={addImageUrl}>
                <Ionicons name="camera-outline" size={32} color="#6B7280" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Amenities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <Text style={styles.sectionSubtitle}>Select available amenities</Text>

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
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Update Listing</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
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
    backgroundColor: '#6200ee',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default EditListingScreen;
