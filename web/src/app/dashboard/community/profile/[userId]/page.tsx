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
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'about'>('posts');

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ user: UserProfile }>(`/api/users/${userId}/profile`);
      if (res.success && res.data) {
        setProfile(res.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get<{ posts: Post[] }>(`/api/social/feed?userId=${userId}`);
      if (res.success && res.data) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchPosts()]).finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;

    // Optimistic update
    setProfile({
      ...profile,
      isFollowing: !profile.isFollowing,
      followerCount: profile.isFollowing ? profile.followerCount - 1 : profile.followerCount + 1,
    });

    try {
      await api.post(`/api/social/users/${userId}/follow`);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Revert
      setProfile({
        ...profile,
        isFollowing: profile.isFollowing,
        followerCount: profile.followerCount,
      });
    }
  };

  const handleMessage = async () => {
    try {
      const res = await api.post<{ conversation: { id: string } }>('/api/messages/conversations', {
        body: { participantId: userId },
      });
      if (res.success && res.data) {
        router.push('/dashboard/messages');
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
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

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">User not found</h1>
        <p className="text-gray-500 mt-2">This user may have been deleted.</p>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar
                src={profile.avatar || undefined}
                alt={profile.firstName}
                fallback={profile.firstName[0]}
                size="xl"
                className="ring-4 ring-white"
              />
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-gray-500">@{profile.username}</p>
              </div>
            </div>
            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  variant={profile.isFollowing ? 'outline' : 'primary'}
                  className={profile.isFollowing ? '' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                >
                  {profile.isFollowing ? (
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
                <Button variant="outline" onClick={handleMessage}>
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 text-center sm:text-left">
            <div>
              <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-sm text-gray-500">Posts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{profile.followerCount}</div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{profile.followingCount}</div>
              <div className="text-sm text-gray-500">Following</div>
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}

          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <CalendarIcon className="w-4 h-4" />
            <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </Card>

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
          onClick={() => setTab('about')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'about'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          About
        </button>
      </div>

      {/* Content */}
      {tab === 'posts' ? (
        posts.length === 0 ? (
          <Card className="p-10 text-center">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
            <p className="text-gray-500 mt-1">
              {isOwnProfile ? "You haven't posted anything yet" : `${profile.firstName} hasn't posted anything yet`}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
                  <Avatar
                    src={profile.avatar || undefined}
                    alt={profile.firstName}
                    fallback={profile.firstName[0]}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {profile.firstName} {profile.lastName}
                      <span className="font-normal text-gray-500 ml-2 text-sm">@{profile.username}</span>
                    </div>
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
            ))}
          </div>
        )
      ) : (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">About {profile.firstName}</h3>
          <div className="space-y-4">
            {profile.bio ? (
              <div>
                <label className="text-sm text-gray-500">Bio</label>
                <p className="text-gray-900 mt-1">{profile.bio}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No bio provided</p>
            )}
            <div>
              <label className="text-sm text-gray-500">Member since</label>
              <p className="text-gray-900 mt-1">
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
