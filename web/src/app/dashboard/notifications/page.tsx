'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner } from '@/components/ui';
import Link from 'next/link';
import {
  BellIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  HomeIcon,
  CheckIcon,
  TrashIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPrefs {
  email: {
    marketing: boolean;
    updates: boolean;
    security: boolean;
    investmentAlerts: boolean;
    communityActivity: boolean;
  };
  push: {
    enabled: boolean;
    investmentAlerts: boolean;
    messages: boolean;
  };
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: { marketing: true, updates: true, security: true, investmentAlerts: true, communityActivity: true },
  push: { enabled: true, investmentAlerts: true, messages: true },
};

const notificationIcons: Record<string, React.ReactNode> = {
  like: <HeartIcon className="w-5 h-5 text-red-500" />,
  comment: <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />,
  follow: <UserPlusIcon className="w-5 h-5 text-purple-500" />,
  message: <ChatBubbleLeftIcon className="w-5 h-5 text-green-500" />,
  investment: <CurrencyDollarIcon className="w-5 h-5 text-amber-500" />,
  group_invite: <UserGroupIcon className="w-5 h-5 text-indigo-500" />,
  property: <HomeIcon className="w-5 h-5 text-teal-500" />,
  default: <BellIcon className="w-5 h-5 text-gray-500" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeView, setActiveView] = useState<'notifications' | 'preferences'>('notifications');
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const unreadOnly = filter === 'unread';
      const res = await api.get<{ notifications: Notification[] }>(
        `/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`
      );
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await api.get<{ settings: { notifications: NotificationPrefs } }>('/api/users/me/settings');
      if (res.success && res.data) {
        setPrefs(res.data.settings.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'preferences') {
      fetchPrefs();
    }
  }, [activeView, fetchPrefs]);

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    setPrefsSaved(false);
    try {
      await api.put('/api/users/me/settings', { notifications: prefs });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleEmailPref = (key: keyof NotificationPrefs['email']) => {
    setPrefs(prev => ({ ...prev, email: { ...prev.email, [key]: !prev.email[key] } }));
  };

  const togglePushPref = (key: keyof NotificationPrefs['push']) => {
    setPrefs(prev => ({ ...prev, push: { ...prev.push, [key]: !prev.push[key] } }));
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: Notification): string | null => {
    const { type, data } = notification;
    if (!data) return null;

    switch (type) {
      case 'like':
      case 'comment':
        return data.postId ? `/dashboard/community/${data.postId}` : null;
      case 'follow':
        return data.userId ? `/dashboard/community/profile/${data.userId}` : null;
      case 'message':
        return data.conversationId ? `/dashboard/messages` : null;
      case 'group_invite':
        return data.groupId ? `/dashboard/community/groups/${data.groupId}` : null;
      case 'investment':
        return data.poolId ? `/dashboard/co-invest/${data.poolId}` : null;
      case 'property':
        return data.propertyId ? `/dashboard/properties/${data.propertyId}` : null;
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            {activeView === 'preferences'
              ? 'Manage your notification preferences'
              : unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'preferences' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveView(activeView === 'preferences' ? 'notifications' : 'preferences')}
          >
            <Cog6ToothIcon className="w-4 h-4 mr-1" />
            {activeView === 'preferences' ? 'Back to Notifications' : 'Preferences'}
          </Button>
          {activeView === 'notifications' && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckIcon className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          {activeView === 'notifications' && notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-600">
              <TrashIcon className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {activeView === 'preferences' ? (
        <div className="space-y-6">
          {/* Email Notifications */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Email Notifications</h2>
            <p className="text-sm text-gray-500 mb-4">Choose which emails you&apos;d like to receive</p>
            <div className="space-y-3">
              {([
                { key: 'marketing' as const, label: 'Marketing & Promotions', desc: 'New features, tips, and special offers' },
                { key: 'updates' as const, label: 'Platform Updates', desc: 'Important changes and announcements' },
                { key: 'security' as const, label: 'Security Alerts', desc: 'Login attempts and account security' },
                { key: 'investmentAlerts' as const, label: 'Investment Alerts', desc: 'Price changes, new opportunities, and portfolio updates' },
                { key: 'communityActivity' as const, label: 'Community Digest', desc: 'Weekly summary of community activity' },
              ]).map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleEmailPref(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      prefs.email[item.key] ? 'bg-rose-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      prefs.email[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </Card>

          {/* Push Notifications */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Push Notifications</h2>
            <p className="text-sm text-gray-500 mb-4">Manage real-time push notifications</p>
            <div className="space-y-3">
              {([
                { key: 'enabled' as const, label: 'Enable Push Notifications', desc: 'Receive real-time alerts on your device' },
                { key: 'investmentAlerts' as const, label: 'Investment Alerts', desc: 'Instant alerts for investment activity' },
                { key: 'messages' as const, label: 'New Messages', desc: 'Get notified when you receive a message' },
              ]).map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePushPref(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      prefs.push[item.key] ? 'bg-rose-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      prefs.push[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleSavePrefs} disabled={prefsSaving}>
              {prefsSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            {prefsSaved && <span className="text-sm text-green-600 font-medium">Preferences saved!</span>}
          </div>
        </div>
      ) : (
        <>
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <BellIconSolid className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-gray-500 mt-1">
            {filter === 'unread'
              ? "You're all caught up!"
              : "When you get notifications, they'll show up here"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => {
            const link = getNotificationLink(notification);
            const icon = notificationIcons[notification.type] || notificationIcons.default;

            const NotificationContent = (
              <div
                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                  notification.isRead ? 'bg-white' : 'bg-purple-50'
                } hover:bg-gray-50 border border-gray-200`}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-purple-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Mark as read"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );

            return link ? (
              <Link
                key={notification.id}
                href={link}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              >
                {NotificationContent}
              </Link>
            ) : (
              <div key={notification.id}>{NotificationContent}</div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
