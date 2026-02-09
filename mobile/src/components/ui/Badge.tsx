import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'rose';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`${size}Size`], style]}>
      <Text style={[styles.label, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },

  // Sizes
  smSize: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mdSize: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Variants - backgrounds
  default: {
    backgroundColor: colors.gray100,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  info: {
    backgroundColor: colors.infoLight,
  },
  rose: {
    backgroundColor: colors.roseSoft,
  },

  // Text
  label: {
    fontWeight: '600',
  },
  smText: {
    fontSize: fontSize.xs,
  },
  mdText: {
    fontSize: fontSize.sm,
  },

  // Text colors
  defaultText: {
    color: colors.textSecondary,
  },
  successText: {
    color: colors.success,
  },
  warningText: {
    color: colors.warning,
  },
  errorText: {
    color: colors.error,
  },
  infoText: {
    color: colors.info,
  },
  roseText: {
    color: colors.rose,
  },
});
