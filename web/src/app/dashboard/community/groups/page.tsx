'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner, Input, Modal } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  PlusIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  isMember: boolean;
  isOwner: boolean;
  owner: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: string;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState<'joined' | 'my' | 'discover'>('joined');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ groups: Group[] }>(`/api/groups?filter=${filter}`);
      if (res.success && res.data) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filter]);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ group: Group }>('/api/groups', {
        body: newGroup,
      });
      if (res.success && res.data) {
        setGroups([res.data.group, ...groups]);
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', isPrivate: false });
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await api.post(`/api/groups/${groupId}/join`);
      setGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g))
      );
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/api/groups/${groupId}/leave`);
      if (filter === 'joined') {
        setGroups(prev => prev.filter(g => g.id !== groupId));
      } else {
        setGroups(prev =>
          prev.map(g => (g.id === groupId ? { ...g, isMember: false, memberCount: g.memberCount - 1 } : g))
        );
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const filteredGroups = groups.filter(g => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-500">Connect with communities that share your interests</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('joined')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'joined' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Joined
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Groups
        </button>
        <button
          onClick={() => setFilter('discover')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'discover' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Discover
        </button>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner size="lg" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-10 text-center">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900">
            {filter === 'joined'
              ? 'No groups joined yet'
              : filter === 'my'
              ? 'No groups created yet'
              : 'No groups to discover'}
          </h3>
          <p className="text-gray-500 mt-1">
            {filter === 'joined'
              ? 'Discover and join groups that interest you!'
              : filter === 'my'
              ? 'Create a group to bring people together'
              : 'Check back later for new groups'}
          </p>
          {filter === 'joined' && (
            <Button onClick={() => setFilter('discover')} className="mt-4" variant="outline">
              Discover Groups
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGroups.map(group => (
            <Card key={group.id} className="overflow-hidden">
              <Link href={`/dashboard/community/groups/${group.id}`}>
                <div className="h-24 bg-gradient-to-br from-purple-500 to-indigo-600 relative">
                  {group.avatar && (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  {group.isPrivate && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <LockClosedIcon className="w-3 h-3" />
                      Private
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/dashboard/community/groups/${group.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-purple-600">{group.name}</h3>
                </Link>
                {group.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{group.memberCount} members</span>
                    <span>•</span>
                    <span>{group.postCount} posts</span>
                  </div>
                  {group.isOwner ? (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">Owner</span>
                  ) : group.isMember ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLeaveGroup(group.id);
                      }}
                    >
                      Leave
                    </Button>
                  ) : (
                    !group.isPrivate && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleJoinGroup(group.id);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Join
                      </Button>
                    )
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create a Group">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
            <Input
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="e.g., Women in Real Estate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              placeholder="What's this group about?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPrivate"
              checked={newGroup.isPrivate}
              onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Make this group private (members only)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroup.name.trim() || creating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
