'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio?: string;
  isFollowing?: boolean;
  followerCount?: number;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  isMember: boolean;
}

export default function DiscoverPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'people' | 'groups'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = async () => {
    try {
      const res = await api.get<{ users: User[] }>(`/api/users/discover${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (res.success && res.data) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get<{ groups: Group[] }>('/api/groups?filter=discover');
      if (res.success && res.data) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'people') {
      fetchPeople().finally(() => setLoading(false));
    } else {
      fetchGroups().finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'people') {
      const debounce = setTimeout(() => {
        setLoading(true);
        fetchPeople().finally(() => setLoading(false));
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery]);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    // Optimistic update
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              isFollowing: !isFollowing,
              followerCount: (u.followerCount || 0) + (isFollowing ? -1 : 1),
            }
          : u
      )
    );

    try {
      await api.post(`/api/social/users/${userId}/follow`);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Revert on error
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                isFollowing,
                followerCount: (u.followerCount || 0) + (isFollowing ? 1 : -1),
              }
            : u
        )
      );
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await api.post(`/api/groups/${groupId}/join`);
      setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g)));
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const filteredGroups = groups.filter(g => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <p className="text-gray-500">Find new people and groups to connect with</p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={`Search ${tab === 'people' ? 'people' : 'groups'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('people')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'people'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          People
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'groups'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner size="lg" />
        </div>
      ) : tab === 'people' ? (
        users.length === 0 ? (
          <Card className="p-10 text-center">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-500 mt-1">Try a different search term</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {users.map(user => (
              <Card key={user.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Link href={`/dashboard/community/profile/${user.id}`}>
                    <Avatar
                      src={user.avatar || undefined}
                      alt={user.firstName}
                      fallback={user.firstName[0]}
                      size="lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/community/profile/${user.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-purple-600">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </Link>
                    {user.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>}
                    {user.followerCount !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        {user.followerCount} follower{user.followerCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {user.id !== currentUser?.id && (
                    <Button
                      variant={user.isFollowing ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleFollow(user.id, !!user.isFollowing)}
                      className={user.isFollowing ? '' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserMinusIcon className="w-4 h-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-4 h-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredGroups.length === 0 ? (
        <Card className="p-10 text-center">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900">No groups found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'All groups have been joined!'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGroups.map(group => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start gap-4">
                <Link href={`/dashboard/community/groups/${group.id}`}>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      group.name[0]
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/community/groups/${group.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-purple-600">{group.name}</h3>
                  </Link>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>{group.memberCount} members</span>
                    <span>{group.postCount} posts</span>
                  </div>
                </div>
                {!group.isMember && !group.isPrivate && (
                  <Button
                    size="sm"
                    onClick={() => handleJoinGroup(group.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Join
                  </Button>
                )}
                {group.isPrivate && !group.isMember && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Private</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
