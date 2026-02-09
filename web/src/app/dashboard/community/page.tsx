'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Post } from '@/types/social';
import Link from 'next/link';
import { HandThumbUpIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createContent, setCreateContent] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchFeed = async () => {
    try {
      const res = await api.get<{ posts: Post[], nextCursor?: string }>('/api/social/feed');
      if (res.success && res.data) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async () => {
    if (!createContent.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ post: Post }>('/api/social/posts', {
        body: { content: createContent }
      });
      if (res.success && res.data) {
        setPosts([res.data.post, ...posts]);
        setCreateContent('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
       if (p.id === postId) {
           return {
               ...p,
               isLiked: !isLiked,
               likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1
           };
       }
       return p;
    }));

    try {
        await api.post(`/api/social/posts/${postId}/like`);
    } catch (err) {
        // Revert on error (omitted for brevity)
        console.error('Like failed', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
           <p className="text-gray-500">Connect with other investors and members</p>
        </div>
      </div>

      {/* Create Post */}
      <Card className="p-4">
        <div className="flex gap-4">
           <Avatar src={user?.profileImage || undefined} alt={user?.firstName} fallback={user?.firstName?.[0]} />
           <div className="flex-1 space-y-3">
              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                placeholder="Share your thoughts, investment wins, or questions..."
                className="w-full border-none focus:ring-0 bg-gray-50 rounded-lg p-3 resize-none text-gray-900 placeholder-gray-400"
                rows={3}
              />
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-500">📷 Photo</Button>
                      <Button variant="ghost" size="sm" className="text-gray-500">🎥 Video</Button>
                  </div>
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

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="lg" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-500">
           No posts yet. Be the first to share!
        </div>
      ) : (
        <div className="space-y-6">
           {posts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
                    <Avatar
                        src={post.author.avatar || undefined}
                        alt={post.author.username}
                        fallback={post.author.firstName[0]}
                    />
                    <div>
                        <div className="font-semibold text-gray-900">
                            {post.author.firstName} {post.author.lastName}
                            <span className="font-normal text-gray-500 ml-2 text-sm">@{post.author.username}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                 </div>

                 <div className="p-4 text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                 </div>

                 {post.mediaUrls.length > 0 && (
                     <div className="bg-gray-100">
                        <img src={post.mediaUrls[0]} alt="Post content" className="w-full h-auto max-h-96 object-cover" />
                     </div>
                 )}

                 <div className="p-3 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <button
                        onClick={() => handleLike(post.id, post.isLiked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors ${post.isLiked ? 'text-red-500' : ''}`}
                    >
                        {post.isLiked ? <HandThumbUpIconSolid className="w-5 h-5" /> : <HandThumbUpIcon className="w-5 h-5" />}
                        <span>{post.likeCount} Likes</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span>{post.commentCount} Comments</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                        <ShareIcon className="w-5 h-5" />
                        <span>Share</span>
                    </button>
                 </div>
              </Card>
           ))}
        </div>
      )}
    </div>
  );
}
