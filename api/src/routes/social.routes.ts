import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { SuccessResponses, ErrorResponses } from '../utils/response';
import { createPostSchema, createCommentSchema, getFeedSchema, updatePostSchema, reportContentSchema } from '../schemas/social.schema';
import {
  parseContent,
  upsertHashtags,
  findMentionedUsers,
  updateHashtagCounts,
  getTrendingHashtags,
  createMentionNotifications,
} from '../lib/contentParser';

const router = Router();

// ==================== POSTS ====================

/**
 * POST /social/posts
 * Create a new post with hashtag and mention support
 */
router.post('/posts', authenticate, validate(createPostSchema), async (req: Request, res: Response) => {
  try {
    const { content, mediaUrls, groupId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    // Parse hashtags and mentions from content
    const { hashtags, mentions } = parseContent(content);

    // Create or get hashtag records
    const hashtagIds = await upsertHashtags(prisma, hashtags);

    // Find mentioned users
    const mentionedUsers = await findMentionedUsers(prisma, mentions);

    // Create the post with hashtags and mentions
    const post = await prisma.post.create({
      data: {
        content,
        mediaUrls: mediaUrls || [],
        authorId: userId,
        groupId,
        hashtags: hashtagIds.length > 0 ? {
          create: hashtagIds.map((hashtagId) => ({
            hashtagId,
          })),
        } : undefined,
        mentions: mentionedUsers.size > 0 ? {
          create: Array.from(mentionedUsers.values()).map((mentionedUserId) => ({
            mentionedUserId,
            mentionerId: userId,
          })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    // Update hashtag counts
    if (hashtagIds.length > 0) {
      await updateHashtagCounts(prisma, hashtagIds, true);
    }

    // Create mention notifications
    if (mentionedUsers.size > 0) {
      await createMentionNotifications(
        prisma,
        post.id,
        userId,
        Array.from(mentionedUsers.values()),
        content || ''
      );
    }

    return SuccessResponses.created(res, {
      post: {
        ...post,
        hashtags: post.hashtags.map((ph) => ph.hashtag.name),
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /social/feed
 * Get social feed (posts from followed users + own posts)
 */
router.get('/feed', authenticate, validate(getFeedSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;
    const profileId = req.query.userId as string | undefined;

    // Determine whose posts to fetch
    let authorFilter: string | { in: string[] } = userId;

    if (profileId) {
      // Fetch specific user's posts
      authorFilter = profileId;
    } else {
      // Fetch feed: Followed users + Self
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);

      authorFilter = {
        in: [...followingIds, userId],
      };
    }

    const posts = await prisma.post.findMany({
      take: limit + 1, // Fetch 1 extra to determine next cursor
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        authorId: authorFilter,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId },
          select: { userId: true }, // Check if current user liked
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    // Format posts to include "isLiked" boolean
    const formattedPosts = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined, // Remove the array
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    }));

    return SuccessResponses.ok(res, {
      posts: formattedPosts,
      nextCursor,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /social/posts/:id
 * Get a single post by ID
 */
router.get('/posts/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
        mentions: {
          include: {
            mentionedUser: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!post) {
      return ErrorResponses.notFound(res, 'Post');
    }

    return SuccessResponses.ok(res, {
      post: {
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        hashtags: post.hashtags.map((ph) => ph.hashtag.name),
        mentions: post.mentions.map((m) => ({
          id: m.mentionedUser.id,
          username: m.mentionedUser.username,
          name: `${m.mentionedUser.firstName} ${m.mentionedUser.lastName}`,
        })),
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * PUT /social/posts/:id
 * Edit a post (only content can be updated)
 */
router.put('/posts/:id', authenticate, validate(updatePostSchema), async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const { content } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        hashtags: true,
      },
    });

    if (!existingPost) {
      return ErrorResponses.notFound(res, 'Post');
    }

    if (existingPost.authorId !== userId) {
      return ErrorResponses.forbidden(res, 'Unauthorized to edit this post');
    }

    // Parse new hashtags and mentions
    const { hashtags: newHashtags, mentions: newMentions } = parseContent(content);
    const newHashtagIds = await upsertHashtags(prisma, newHashtags);
    const newMentionedUsers = await findMentionedUsers(prisma, newMentions);

    // Get old hashtag IDs for count update
    const oldHashtagIds = existingPost.hashtags.map((h) => h.hashtagId);

    // Update post with transaction
    const post = await prisma.$transaction(async (tx) => {
      // Delete old hashtag associations
      await tx.postHashtag.deleteMany({
        where: { postId },
      });

      // Delete old mention associations
      await tx.mention.deleteMany({
        where: { postId },
      });

      // Update post
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          content,
          hashtags: newHashtagIds.length > 0 ? {
            create: newHashtagIds.map((hashtagId) => ({
              hashtagId,
            })),
          } : undefined,
          mentions: newMentionedUsers.size > 0 ? {
            create: Array.from(newMentionedUsers.values()).map((mentionedUserId) => ({
              mentionedUserId,
              mentionerId: userId,
            })),
          } : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      });

      return updatedPost;
    });

    // Update hashtag counts
    if (oldHashtagIds.length > 0) {
      await updateHashtagCounts(prisma, oldHashtagIds, false);
    }
    if (newHashtagIds.length > 0) {
      await updateHashtagCounts(prisma, newHashtagIds, true);
    }

    return SuccessResponses.ok(res, {
      post: {
        ...post,
        hashtags: post.hashtags.map((ph) => ph.hashtag.name),
      },
    });
  } catch (error) {
    console.error('Edit post error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /social/posts/:id
 * Delete a post
 */
router.delete('/posts/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        hashtags: true,
      },
    });

    if (!post) {
      return ErrorResponses.notFound(res, 'Post');
    }

    if (post.authorId !== userId) {
      return ErrorResponses.forbidden(res, 'Unauthorized to delete this post');
    }

    // Get hashtag IDs before deletion
    const hashtagIds = post.hashtags.map((h) => h.hashtagId);

    await prisma.post.delete({ where: { id: postId } });

    // Decrement hashtag counts
    if (hashtagIds.length > 0) {
      await updateHashtagCounts(prisma, hashtagIds, false);
    }

    return SuccessResponses.ok(res, { message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return ErrorResponses.internalError(res);
  }
});

// ==================== INTERACTIONS ====================

/**
 * POST /social/posts/:id/like
 * Toggle like on a post
 */
router.post('/posts/:id/like', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return SuccessResponses.ok(res, { liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
      return SuccessResponses.ok(res, { liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /social/posts/:id/comments
 * Add a comment to a post
 */
router.post('/posts/:id/comments', authenticate, validate(createCommentSchema), async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const { content, parentId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return SuccessResponses.created(res, { comment });
  } catch (error) {
    console.error('Add comment error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /social/posts/:id/comments
 * Get comments for a post
 */
router.get('/posts/:id/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null }, // Fetch top-level comments
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        children: {
          // Fetch 1 level of replies
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return SuccessResponses.ok(res, { comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return ErrorResponses.internalError(res);
  }
});

// ==================== CONNECTIONS ====================

/**
 * POST /social/users/:id/follow
 * Toggle follow user
 */
router.post('/users/:id/follow', authenticate, async (req: Request, res: Response) => {
  try {
    const targetUserId = String(req.params.id);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return ErrorResponses.unauthorized(res);
    }

    if (targetUserId === currentUserId) {
      return ErrorResponses.badRequest(res, 'Cannot follow yourself');
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      return SuccessResponses.ok(res, { following: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      return SuccessResponses.ok(res, { following: true });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    return ErrorResponses.internalError(res);
  }
});

// ==================== HASHTAGS ====================

/**
 * GET /social/hashtags/trending
 * Get trending hashtags
 */
router.get('/hashtags/trending', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const hashtags = await getTrendingHashtags(prisma, limit);
    return SuccessResponses.ok(res, { hashtags });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /social/hashtags/:name
 * Get posts by hashtag
 */
router.get('/hashtags/:name', authenticate, async (req: Request, res: Response) => {
  try {
    const hashtagName = String(req.params.name).toLowerCase();
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const hashtag = await prisma.hashtag.findUnique({
      where: { name: hashtagName },
    });

    if (!hashtag) {
      return SuccessResponses.ok(res, { hashtag: null, posts: [], nextCursor: undefined });
    }

    const postHashtags = await prisma.postHashtag.findMany({
      where: { hashtagId: hashtag.id },
      take: limit + 1,
      cursor: cursor ? { postId_hashtagId: { postId: cursor, hashtagId: hashtag.id } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (postHashtags.length > limit) {
      const nextItem = postHashtags.pop();
      nextCursor = nextItem?.postId;
    }

    const posts = postHashtags.map((ph) => ({
      ...ph.post,
      isLiked: ph.post.likes.length > 0,
      likes: undefined,
      likeCount: ph.post._count.likes,
      commentCount: ph.post._count.comments,
    }));

    return SuccessResponses.ok(res, {
      hashtag: {
        name: hashtag.name,
        postCount: hashtag.postCount,
      },
      posts,
      nextCursor,
    });
  } catch (error) {
    console.error('Get hashtag posts error:', error);
    return ErrorResponses.internalError(res);
  }
});

// ==================== CONTENT MODERATION ====================

/**
 * POST /social/reports/post/:id
 * Report a post
 */
router.post('/reports/post/:id', authenticate, validate(reportContentSchema), async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);
    const { reason, details } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return ErrorResponses.notFound(res, 'Post');
    }

    // Check if user already reported this post
    const existingReport = await prisma.contentReport.findFirst({
      where: {
        postId,
        reporterId: userId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return ErrorResponses.badRequest(res, 'You have already reported this post');
    }

    const report = await prisma.contentReport.create({
      data: {
        postId,
        reporterId: userId,
        reason,
        details,
      },
    });

    return SuccessResponses.created(res, {
      report: {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
      message: 'Report submitted successfully. Our team will review it.',
    });
  } catch (error) {
    console.error('Report post error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /social/reports/comment/:id
 * Report a comment
 */
router.post('/reports/comment/:id', authenticate, validate(reportContentSchema), async (req: Request, res: Response) => {
  try {
    const commentId = String(req.params.id);
    const { reason, details } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return ErrorResponses.notFound(res, 'Comment');
    }

    // Check if user already reported this comment
    const existingReport = await prisma.contentReport.findFirst({
      where: {
        commentId,
        reporterId: userId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return ErrorResponses.badRequest(res, 'You have already reported this comment');
    }

    const report = await prisma.contentReport.create({
      data: {
        commentId,
        reporterId: userId,
        reason,
        details,
      },
    });

    return SuccessResponses.created(res, {
      report: {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
      message: 'Report submitted successfully. Our team will review it.',
    });
  } catch (error) {
    console.error('Report comment error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
