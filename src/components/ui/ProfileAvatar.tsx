/**
 * ProfileAvatar - Circle Avatar dengan Edit Overlay
 */

import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight } from '../../theme';

interface ProfileAvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  editable?: boolean;
  onEdit?: () => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  uri,
  name,
  size = 100,
  editable = false,
  onEdit,
}) => {
  const { theme } = useTheme();

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0]?.toUpperCase() || '?';
  };

  const renderContent = () => {
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.4 },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {editable && onEdit && (
        <TouchableOpacity
          onPress={onEdit}
          style={[
            styles.editButton,
            {
              backgroundColor: theme.colors.primary,
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Ionicons
            name="camera"
            size={size * 0.15}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});

export default ProfileAvatar;
