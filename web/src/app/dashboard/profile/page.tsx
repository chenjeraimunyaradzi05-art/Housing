'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input, Textarea, Badge, Avatar, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/api/users/me', formData);
      await refreshUser();
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || '',
    });
    setIsEditing(false);
    setError('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/me/avatar`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Upload failed');
      }

      await refreshUser();
      setSuccess('Profile photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.profileImage) return;

    setIsUploadingAvatar(true);
    setError('');

    try {
      await api.delete('/api/users/me/avatar');
      await refreshUser();
      setSuccess('Profile photo removed!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const profileCompletion = [
    { label: 'Email verified', done: user.emailVerified },
    { label: 'Phone number', done: !!user.phone },
    { label: 'Profile photo', done: !!user.profileImage },
    { label: 'Bio', done: !!user.bio },
    { label: 'Location', done: !!user.location },
  ];

  const completedCount = profileCompletion.filter((item) => item.done).length;
  const completionPercent = Math.round((completedCount / profileCompletion.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your personal information and settings.
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

      {/* Profile Completion */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Completion
          </h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {completionPercent}% complete
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {profileCompletion.map((item) => (
            <Badge
              key={item.label}
              variant={item.done ? 'success' : 'secondary'}
            >
              {item.done ? '✓' : '○'} {item.label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Profile Photo */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Photo
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                <Spinner size="md" />
              </div>
            )}
            <Avatar
              src={user.profileImage || undefined}
              alt={`${user.firstName} ${user.lastName}`}
              size="xl"
              fallback={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
              className="w-24 h-24 text-2xl"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a photo to personalize your profile. Max 5MB, JPG/PNG/GIF.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                {user.profileImage ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {user.profileImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State/Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself and your investment goals..."
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Max 500 characters
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">First Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.lastName}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                {user.emailVerified ? (
                  <Badge variant="success" size="sm">Verified</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Not verified</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.phone || <span className="text-gray-400">Not provided</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.location || <span className="text-gray-400">Not provided</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
              <p className="text-gray-900 dark:text-white">
                {user.bio || <span className="text-gray-400">No bio yet</span>}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Account Information
        </h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Membership Level</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.membershipLevel === 'premium' ? 'primary' : 'secondary'}>
                  {user.membershipLevel.charAt(0).toUpperCase() + user.membershipLevel.slice(1)}
                </Badge>
              </div>
            </div>
            {user.membershipLevel === 'free' && (
              <Button size="sm">Upgrade</Button>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.accountStatus === 'active' ? 'success' : 'warning'}>
                {user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
