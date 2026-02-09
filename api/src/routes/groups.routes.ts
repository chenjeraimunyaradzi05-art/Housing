import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { SuccessResponses, ErrorResponses } from '../utils/response';
import { Prisma } from '@prisma/client';

const router = Router();

/**
 * GET /groups
 * List all groups with optional filters
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const search = req.query.search as string | undefined;
    const filter = req.query.filter as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const whereClause: Prisma.CommunityGroupWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === 'public') {
      whereClause.isPrivate = false;
    } else if (filter === 'private') {
      whereClause.isPrivate = true;
    }

    const groups = await prisma.communityGroup.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (groups.length > limit) {
      const nextItem = groups.pop();
      nextCursor = nextItem?.id;
    }

    const formattedGroups = groups.map((group) => ({
      ...group,
      memberCount: group._count.members,
      postCount: group._count.posts,
    }));

    return SuccessResponses.ok(res, { groups: formattedGroups, nextCursor });
  } catch (error) {
    console.error('Get groups error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /groups/my-groups
 * Get groups the current user is a member of
 */
router.get('/my-groups', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      memberCount: m.group._count.members,
      postCount: m.group._count.posts,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return SuccessResponses.ok(res, { groups });
  } catch (error) {
    console.error('Get my groups error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /groups
 * Create a new group
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const { name, description, avatar, isPrivate = false } = req.body;

    if (!name) {
      return ErrorResponses.badRequest(res, 'Group name is required');
    }

    const group = await prisma.communityGroup.create({
      data: {
        name,
        description,
        avatar,
        isPrivate,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    return SuccessResponses.created(res, {
      group: {
        ...group,
        memberCount: group._count.members,
        postCount: group._count.posts,
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /groups/:id
 * Get a specific group by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return SuccessResponses.ok(res, {
      group: {
        ...group,
        memberCount: group._count.members,
        postCount: group._count.posts,
        isMember: !!membership,
        isOwner: group.ownerId === userId,
        userRole: membership?.role,
        recentMembers: group.members.map((m) => m.user),
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * PUT /groups/:id
 * Update a group (owner only)
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);
    const { name, description, avatar, isPrivate } = req.body;

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    if (group.ownerId !== userId) {
      return ErrorResponses.forbidden(res, 'Only the owner can update the group');
    }

    const updatedGroup = await prisma.communityGroup.update({
      where: { id: groupId },
      data: {
        name: name ?? group.name,
        description: description ?? group.description,
        avatar: avatar ?? group.avatar,
        isPrivate: isPrivate ?? group.isPrivate,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    return SuccessResponses.ok(res, {
      group: {
        ...updatedGroup,
        memberCount: updatedGroup._count.members,
        postCount: updatedGroup._count.posts,
      },
    });
  } catch (error) {
    console.error('Update group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /groups/:id
 * Delete a group (owner only)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    if (group.ownerId !== userId) {
      return ErrorResponses.forbidden(res, 'Only the owner can delete the group');
    }

    await prisma.communityGroup.delete({
      where: { id: groupId },
    });

    return SuccessResponses.ok(res, { message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /groups/:id/join
 * Join a group
 */
router.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return ErrorResponses.badRequest(res, 'Already a member of this group');
    }

    if (group.isPrivate) {
      return ErrorResponses.forbidden(res, 'This is a private group. Request an invite from the owner.');
    }

    await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'member',
      },
    });

    return SuccessResponses.ok(res, { joined: true, message: 'Joined group successfully' });
  } catch (error) {
    console.error('Join group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /groups/:id/leave
 * Leave a group
 */
router.post('/:id/leave', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    if (group.ownerId === userId) {
      return ErrorResponses.badRequest(res, 'Owner cannot leave the group. Transfer ownership first or delete the group.');
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return ErrorResponses.badRequest(res, 'Not a member of this group');
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return SuccessResponses.ok(res, { left: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /groups/:id/members
 * Get members of a group
 */
router.get('/:id/members', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return SuccessResponses.ok(res, {
      members: members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Get members error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /groups/:id/posts
 * Get posts in a group
 */
router.get('/:id/posts', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    // Check if user can view posts (member or public group)
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (group.isPrivate && !membership) {
      return ErrorResponses.forbidden(res, 'You must be a member to view posts in this private group');
    }

    const posts = await prisma.post.findMany({
      where: { groupId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: {
            id: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    // Check which posts the user has liked
    const postIds = posts.map((p) => p.id);
    const userLikes = await prisma.like.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
      select: { postId: true },
    });
    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    const formattedPosts = posts.map((post) => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: likedPostIds.has(post.id),
    }));

    return SuccessResponses.ok(res, { posts: formattedPosts, nextCursor });
  } catch (error) {
    console.error('Get group posts error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /groups/:id/posts
 * Create a post in a group
 */
router.post('/:id/posts', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const groupId = String(req.params.id);
    const { content, mediaUrls } = req.body;

    if (!content) {
      return ErrorResponses.badRequest(res, 'Content is required');
    }

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return ErrorResponses.notFound(res, 'Group');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return ErrorResponses.forbidden(res, 'You must be a member to post in this group');
    }

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrls: mediaUrls || [],
        authorId: userId,
        groupId,
      },
      include: {
        author: {
          select: {
            id: true,
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
      },
    });

    return SuccessResponses.created(res, {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked: false,
      },
    });
  } catch (error) {
    console.error('Create group post error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
