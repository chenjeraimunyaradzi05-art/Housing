import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES = {
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

export default function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const dimensions = SIZES[size];
  const fontSizeValue = FONT_SIZES[size];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const containerStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
  };

  // Handle URL string
  if (typeof source === 'string' && source) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={{ uri: source }}
          style={[styles.image, containerStyle]}
        />
      </View>
    );
  }

  // Handle ImageSourcePropType
  if (source && typeof source !== 'string') {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={source}
          style={[styles.image, containerStyle]}
        />
      </View>
    );
  }

  // Fallback to initials
  return (
    <View style={[styles.container, styles.placeholder, containerStyle, style]}>
      <Text style={[styles.initials, { fontSize: fontSizeValue }]}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.roseSoft,
  },
  initials: {
    fontWeight: '700',
    color: colors.rose,
  },
});
