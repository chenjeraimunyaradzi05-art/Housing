'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Post } from '@/types/social';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CogIcon,
  UserGroupIcon,
  LockClosedIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

interface GroupMember {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  joinedAt: string;
}

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  owner: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  isMember: boolean;
  isOwner: boolean;
  memberRole: string | null;
  recentMembers: GroupMember[];
  createdAt: string;
}

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'members'>('posts');
  const [createContent, setCreateContent] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroup = async () => {
    try {
      const res = await api.get<{ group: GroupDetails }>(`/api/groups/${groupId}`);
      if (res.success && res.data) {
        setGroup(res.data.group);
      }
    } catch (err) {
      console.error('Failed to fetch group:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get<{ posts: Post[] }>(`/api/groups/${groupId}/posts`);
      if (res.success && res.data) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get<{ members: GroupMember[] }>(`/api/groups/${groupId}/members`);
      if (res.success && res.data) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGroup(), fetchPosts()]).finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    if (tab === 'members' && members.length === 0) {
      fetchMembers();
    }
  }, [tab]);

  const handleJoin = async () => {
    try {
      await api.post(`/api/groups/${groupId}/join`);
      setGroup(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/api/groups/${groupId}/leave`);
      setGroup(prev => prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null);
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!createContent.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ post: Post }>('/api/social/posts', {
        body: { content: createContent, groupId },
      });
      if (res.success && res.data) {
        setPosts([res.data.post, ...posts]);
        setCreateContent('');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !isLiked, likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
    try {
      await api.post(`/api/social/posts/${postId}/like`);
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">Group not found</h1>
        <p className="text-gray-500 mt-2">This group may have been deleted or you don't have access.</p>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const canPost = group.isMember;
  const canViewContent = !group.isPrivate || group.isMember;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="relative">
        <button onClick={() => router.back()} className="absolute left-4 top-4 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg relative">
          {group.avatar && (
            <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-lg opacity-50" />
          )}
        </div>
        <div className="px-6 pb-4">
          <div className="flex items-end justify-between -mt-8">
            <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-3xl font-bold text-purple-600 border-4 border-white">
              {group.avatar ? (
                <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                group.name[0]
              )}
            </div>
            <div className="flex gap-2">
              {group.isOwner ? (
                <Button variant="outline" size="sm">
                  <CogIcon className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              ) : group.isMember ? (
                <Button variant="outline" size="sm" onClick={handleLeave}>
                  Leave Group
                </Button>
              ) : (
                !group.isPrivate && (
                  <Button size="sm" onClick={handleJoin} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Join Group
                  </Button>
                )
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.isPrivate && <LockClosedIcon className="w-5 h-5 text-gray-400" />}
            </div>
            {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <UserGroupIcon className="w-4 h-4" />
                {group.memberCount} members
              </span>
              <span>{group.postCount} posts</span>
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {!canViewContent ? (
        <Card className="p-10 text-center">
          <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">Private Group</h3>
          <p className="text-gray-500 mt-1">Join this group to see posts and members</p>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setTab('posts')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'posts'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setTab('members')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'members'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Members ({group.memberCount})
            </button>
          </div>

          {tab === 'posts' ? (
            <div className="space-y-6">
              {/* Create Post */}
              {canPost && (
                <Card className="p-4">
                  <div className="flex gap-4">
                    <Avatar src={user?.profileImage || undefined} alt={user?.firstName} fallback={user?.firstName?.[0]} />
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={createContent}
                        onChange={(e) => setCreateContent(e.target.value)}
                        placeholder="Share something with the group..."
                        className="w-full border-none focus:ring-0 bg-gray-50 rounded-lg p-3 resize-none text-gray-900 placeholder-gray-400"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleCreatePost}
                          disabled={!createContent.trim() || creating}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {creating ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Posts List */}
              {posts.length === 0 ? (
                <Card className="p-10 text-center">
                  <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                  <p className="text-gray-500 mt-1">Be the first to share something!</p>
                </Card>
              ) : (
                posts.map(post => (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
                      <Link href={`/dashboard/community/profile/${post.author.id}`}>
                        <Avatar
                          src={post.author.avatar || undefined}
                          alt={post.author.username}
                          fallback={post.author.firstName[0]}
                        />
                      </Link>
                      <div>
                        <Link href={`/dashboard/community/profile/${post.author.id}`} className="font-semibold text-gray-900 hover:text-purple-600">
                          {post.author.firstName} {post.author.lastName}
                        </Link>
                        <div className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()} at{' '}
                          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/community/${post.id}`}>
                      <div className="p-4 text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</div>
                    </Link>
                    {post.mediaUrls.length > 0 && (
                      <div className="bg-gray-100">
                        <img src={post.mediaUrls[0]} alt="Post content" className="w-full h-auto max-h-96 object-cover" />
                      </div>
                    )}
                    <div className="p-3 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(post.id, post.isLiked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors ${
                          post.isLiked ? 'text-red-500' : ''
                        }`}
                      >
                        {post.isLiked ? <HandThumbUpIconSolid className="w-5 h-5" /> : <HandThumbUpIcon className="w-5 h-5" />}
                        <span>{post.likeCount} Likes</span>
                      </button>
                      <Link
                        href={`/dashboard/community/${post.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span>{post.commentCount} Comments</span>
                      </Link>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                        <ShareIcon className="w-5 h-5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {members.length === 0 ? (
                <div className="col-span-2 flex justify-center p-10">
                  <Spinner />
                </div>
              ) : (
                members.map(member => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/dashboard/community/profile/${member.id}`}>
                        <Avatar src={member.avatar || undefined} alt={member.firstName} fallback={member.firstName[0]} size="lg" />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/dashboard/community/profile/${member.id}`} className="font-semibold text-gray-900 hover:text-purple-600">
                          {member.firstName} {member.lastName}
                        </Link>
                        <p className="text-sm text-gray-500">@{member.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {member.role === 'admin' && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Admin</span>
                          )}
                          <span className="text-xs text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
