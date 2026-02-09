import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

interface SettingItem {
  key: string;
  label: string;
  description?: string;
  type: 'toggle' | 'link' | 'action';
  value?: boolean;
  icon?: string;
  action?: () => void;
  destructive?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingItem[];
}

const SETTINGS_STORAGE_KEY = '@vor_settings';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    marketingEmails: false,
    biometricAuth: false,
    darkMode: false,
    autoSync: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const sections: SettingsSection[] = [
    {
      title: 'Notifications',
      items: [
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          description: 'Receive alerts on your device',
          type: 'toggle',
          value: settings.pushNotifications,
          icon: '🔔',
        },
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Receive updates via email',
          type: 'toggle',
          value: settings.emailNotifications,
          icon: '📧',
        },
        {
          key: 'marketingEmails',
          label: 'Marketing Emails',
          description: 'Receive promotional content',
          type: 'toggle',
          value: settings.marketingEmails,
          icon: '📢',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          key: 'biometricAuth',
          label: 'Biometric Authentication',
          description: 'Use Face ID or fingerprint',
          type: 'toggle',
          value: settings.biometricAuth,
          icon: '🔐',
        },
        {
          key: 'changePassword',
          label: 'Change Password',
          type: 'link',
          icon: '🔑',
          action: () => Alert.alert('Coming Soon', 'Password change will be available soon.'),
        },
        {
          key: 'twoFactor',
          label: 'Two-Factor Authentication',
          type: 'link',
          icon: '🛡️',
          action: () => Alert.alert('Coming Soon', '2FA will be available soon.'),
        },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          type: 'toggle',
          value: settings.darkMode,
          icon: '🌙',
        },
        {
          key: 'autoSync',
          label: 'Auto Sync',
          description: 'Automatically sync your data',
          type: 'toggle',
          value: settings.autoSync,
          icon: '🔄',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          key: 'version',
          label: 'App Version',
          description: '1.0.0',
          type: 'link',
          icon: 'ℹ️',
        },
        {
          key: 'termsOfService',
          label: 'Terms of Service',
          type: 'link',
          icon: '📄',
          action: () => Alert.alert('Terms of Service', 'Opening Terms of Service...'),
        },
        {
          key: 'privacyPolicy',
          label: 'Privacy Policy',
          type: 'link',
          icon: '🔒',
          action: () => Alert.alert('Privacy Policy', 'Opening Privacy Policy...'),
        },
        {
          key: 'support',
          label: 'Contact Support',
          type: 'link',
          icon: '💬',
          action: () => Alert.alert('Support', 'Email us at support@vor.io'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          key: 'logout',
          label: 'Sign Out',
          type: 'action',
          icon: '🚪',
          action: handleLogout,
        },
        {
          key: 'deleteAccount',
          label: 'Delete Account',
          type: 'action',
          icon: '⚠️',
          action: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.settingItem}
        onPress={item.type === 'toggle' ? undefined : item.action}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>{item.icon}</Text>
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, item.destructive && styles.destructiveText]}>
            {item.label}
          </Text>
          {item.description && (
            <Text style={styles.settingDescription}>{item.description}</Text>
          )}
        </View>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={() => toggleSetting(item.key as keyof typeof settings)}
            trackColor={{ false: colors.gray300, true: colors.rose + '80' }}
            thumbColor={item.value ? colors.rose : colors.gray100}
          />
        )}
        {item.type === 'link' && (
          <Text style={styles.chevron}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Info Card */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Sections */}
        {sections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.rose,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  editProfileButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.rose + '10',
    borderRadius: borderRadius.full,
  },
  editProfileText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.rose,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.gray900,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.rose,
  },
  chevron: {
    fontSize: 24,
    color: colors.gray400,
    marginLeft: spacing.sm,
  },
});
