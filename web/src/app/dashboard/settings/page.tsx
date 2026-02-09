'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input, Switch, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  investmentAlerts: boolean;
  propertyUpdates: boolean;
  communityDigest: boolean;
  profileVisibility: 'public' | 'members' | 'private';
  showInvestments: boolean;
  showActivity: boolean;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  investmentAlerts: true,
  propertyUpdates: true,
  communityDigest: true,
  profileVisibility: 'members',
  showInvestments: false,
  showActivity: true,
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get<{ settings: UserSettings }>('/api/users/me/settings');
      if (response.data?.settings) {
        setSettings({ ...defaultSettings, ...response.data.settings });
      }
    } catch (err) {
      // Use default settings if none exist
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof UserSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleVisibilityChange = async (visibility: UserSettings['profileVisibility']) => {
    const newSettings = { ...settings, profileVisibility: visibility };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings: UserSettings) => {
    setIsSaving(true);
    setError('');

    try {
      await api.put('/api/users/me/settings', newSettings);
      setSuccess('Settings saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      // Revert on error
      loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.put('/api/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) return;

    setIsDeleting(true);

    try {
      await api.delete('/api/users/me');
      logout();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your notifications, privacy, and account preferences.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Notifications
        </h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive push notifications on your devices
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
              disabled={isSaving}
            />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Investment Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified about investment opportunities and updates
              </p>
            </div>
            <Switch
              checked={settings.investmentAlerts}
              onChange={() => handleToggle('investmentAlerts')}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Property Updates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Updates about properties you&apos;ve invested in or saved
              </p>
            </div>
            <Switch
              checked={settings.propertyUpdates}
              onChange={() => handleToggle('propertyUpdates')}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Community Digest</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weekly digest of community activity and discussions
              </p>
            </div>
            <Switch
              checked={settings.communityDigest}
              onChange={() => handleToggle('communityDigest')}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Marketing Emails</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive news, tips, and promotional content
              </p>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onChange={() => handleToggle('marketingEmails')}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Privacy
        </h2>
        <div className="space-y-6">
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-3">Profile Visibility</p>
            <div className="space-y-2">
              {[
                { value: 'public', label: 'Public', description: 'Anyone can view your profile' },
                { value: 'members', label: 'Members Only', description: 'Only VÖR members can view' },
                { value: 'private', label: 'Private', description: 'Only you can view your profile' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    settings.profileVisibility === option.value
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="profileVisibility"
                    value={option.value}
                    checked={settings.profileVisibility === option.value}
                    onChange={() => handleVisibilityChange(option.value as UserSettings['profileVisibility'])}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                  {settings.profileVisibility === option.value && (
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Show Investments</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow others to see your investment activity
              </p>
            </div>
            <Switch
              checked={settings.showInvestments}
              onChange={() => handleToggle('showInvestments')}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Show Activity</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Show your recent activity on your profile
              </p>
            </div>
            <Switch
              checked={settings.showActivity}
              onChange={() => handleToggle('showActivity')}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Security
        </h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Password</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Change your account password
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage devices where you&apos;re signed in
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              View Sessions
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError('');
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">
              <strong>Warning:</strong> This action cannot be undone. All your data, including investments,
              properties, and profile information will be permanently deleted.
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            To confirm, please type your email address: <strong>{user.email}</strong>
          </p>

          <Input
            type="email"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Enter your email"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== user.email || isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
