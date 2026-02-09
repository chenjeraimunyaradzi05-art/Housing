'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Post, Comment } from '@/types/social';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  TrashIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchPost = async () => {
    try {
      // Fetch feed with userId filter to get the post
      const res = await api.get<{ posts: Post[] }>(`/api/social/feed?limit=1&userId=${postId}`);
      // This is a workaround - ideally there'd be a GET /posts/:id endpoint
      // For now we'll just fetch comments which confirms the post exists
    } catch (err) {
      console.error('Failed to fetch post:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get<{ comments: Comment[] }>(`/api/social/posts/${postId}/comments`);
      if (res.success && res.data) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  // Simulated post fetch - in production would have a proper endpoint
  const fetchPostDetails = async () => {
    try {
      // For now, we create a placeholder - in a real app, there would be a GET /posts/:id endpoint
      // Let's try to fetch comments which will tell us if post exists
      await fetchComments();

      // Create a mock post structure for now
      // In production, the backend would return full post details
      setPost({
        id: postId,
        content: null,
        mediaUrls: [],
        authorId: '',
        author: {
          id: '',
          username: 'user',
          firstName: 'Loading',
          lastName: '...',
          avatar: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: comments.length,
        isLiked: false,
      });
    } catch (err) {
      console.error('Failed to fetch post details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    setPost({
      ...post,
      isLiked: !post.isLiked,
      likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
    });
    try {
      await api.post(`/api/social/posts/${postId}/like`);
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ comment: Comment }>(`/api/social/posts/${postId}/comments`, {
        body: { content: newComment },
      });
      if (res.success && res.data) {
        setComments([res.data.comment, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ comment: Comment }>(`/api/social/posts/${postId}/comments`, {
        body: { content: replyContent, parentId },
      });
      if (res.success && res.data) {
        // Add reply to parent comment's children
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? { ...c, children: [...(c.children || []), res.data!.comment] }
              : c
          )
        );
        setReplyingTo(null);
        setReplyContent('');
      }
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/api/social/posts/${postId}`);
      router.back();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Post */}
      {post && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <Link href={`/dashboard/community/profile/${post.author.id}`}>
                <Avatar
                  src={post.author.avatar || undefined}
                  alt={post.author.username}
                  fallback={post.author.firstName[0]}
                />
              </Link>
              <div>
                <Link
                  href={`/dashboard/community/profile/${post.author.id}`}
                  className="font-semibold text-gray-900 hover:text-purple-600"
                >
                  {post.author.firstName} {post.author.lastName}
                </Link>
                <span className="font-normal text-gray-500 ml-2 text-sm">@{post.author.username}</span>
                <div className="text-xs text-gray-400">{formatTime(post.createdAt)}</div>
              </div>
            </div>
            {post.authorId === user?.id && (
              <button
                onClick={handleDeletePost}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {post.content && (
            <div className="p-4 text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
              {post.content}
            </div>
          )}

          {post.mediaUrls.length > 0 && (
            <div className="bg-gray-100">
              <img
                src={post.mediaUrls[0]}
                alt="Post content"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          )}

          <div className="p-4 bg-gray-50 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors ${
                post.isLiked ? 'text-red-500' : ''
              }`}
            >
              {post.isLiked ? (
                <HandThumbUpIconSolid className="w-6 h-6" />
              ) : (
                <HandThumbUpIcon className="w-6 h-6" />
              )}
              <span>{post.likeCount} Likes</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2">
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span>{comments.length} Comments</span>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <ShareIcon className="w-6 h-6" />
              <span>Share</span>
            </button>
          </div>
        </Card>
      )}

      {/* Add Comment */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar src={user?.profileImage || undefined} alt={user?.firstName} fallback={user?.firstName?.[0]} />
          <div className="flex-1 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Comments ({comments.length})</h3>

        {comments.length === 0 ? (
          <Card className="p-8 text-center">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </Card>
        ) : (
          comments.map(comment => (
            <Card key={comment.id} className="p-4">
              <div className="flex gap-3">
                <Link href={`/dashboard/community/profile/${comment.author.id}`}>
                  <Avatar
                    src={comment.author.avatar || undefined}
                    alt={comment.author.firstName}
                    fallback={comment.author.firstName[0]}
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Link
                      href={`/dashboard/community/profile/${comment.author.id}`}
                      className="font-semibold text-gray-900 hover:text-purple-600 text-sm"
                    >
                      {comment.author.firstName} {comment.author.lastName}
                    </Link>
                    <p className="text-gray-800 mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{formatTime(comment.createdAt)}</span>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="hover:text-purple-600"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(comment.id)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Reply
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.children && comment.children.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
                      {comment.children.map((reply: any) => (
                        <div key={reply.id} className="flex gap-3">
                          <Link href={`/dashboard/community/profile/${reply.author.id}`}>
                            <Avatar
                              src={reply.author.avatar || undefined}
                              alt={reply.author.firstName}
                              fallback={reply.author.firstName[0]}
                              size="sm"
                            />
                          </Link>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <Link
                                href={`/dashboard/community/profile/${reply.author.id}`}
                                className="font-semibold text-gray-900 hover:text-purple-600 text-sm"
                              >
                                {reply.author.firstName} {reply.author.lastName}
                              </Link>
                              <p className="text-gray-800 text-sm mt-1">{reply.content}</p>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTime(reply.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
