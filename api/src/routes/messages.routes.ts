import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { SuccessResponses, ErrorResponses } from '../utils/response';

const router = Router();

// ==================== CONVERSATIONS ====================

/**
 * GET /messages/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Format conversations
    const formattedConversations = conversations.map((conv) => {
      const otherParticipants = conv.participants
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          id: p.user.id,
          username: p.user.username,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          avatar: p.user.profileImage,
        }));

      const currentUserParticipant = conv.participants.find((p) => p.userId === userId);
      const lastMessage = conv.messages[0] || null;
      const hasUnread =
        lastMessage && currentUserParticipant?.lastReadAt
          ? new Date(lastMessage.createdAt) > new Date(currentUserParticipant.lastReadAt)
          : !!lastMessage;

      return {
        id: conv.id,
        participants: otherParticipants,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        hasUnread,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      };
    });

    return SuccessResponses.ok(res, { conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /messages/conversations
 * Start a new conversation (or find existing one)
 */
router.post('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return ErrorResponses.badRequest(res, 'At least one participant is required');
    }

    // Include current user in participants
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    // Check if conversation already exists with exact same participants
    const existingConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: { in: allParticipantIds },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Find exact match
    const exactMatch = existingConversations.find(
      (conv) =>
        conv.participants.length === allParticipantIds.length &&
        conv.participants.every((p) => allParticipantIds.includes(p.userId))
    );

    if (exactMatch) {
      return SuccessResponses.ok(res, {
        conversation: {
          id: exactMatch.id,
          isNew: false,
        },
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: allParticipantIds.map((pId) => ({
            userId: pId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.user.id,
        username: p.user.username,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatar: p.user.profileImage,
      }));

    return SuccessResponses.created(res, {
      conversation: {
        id: conversation.id,
        participants: otherParticipants,
        isNew: true,
      },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /messages/conversations/:id
 * Get a single conversation with messages
 */
router.get('/conversations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const conversationId = String(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const cursor = req.query.cursor as string | undefined;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return ErrorResponses.notFound(res, 'Conversation');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return ErrorResponses.notFound(res, 'Conversation');
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // Mark as read
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.user.id,
        username: p.user.username,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatar: p.user.profileImage,
      }));

    // Format messages with avatar
    const formattedMessages = messages.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        firstName: m.sender.firstName,
        lastName: m.sender.lastName,
        avatar: m.sender.profileImage,
      },
      createdAt: m.createdAt,
    }));

    return SuccessResponses.ok(res, {
      conversation: {
        id: conversation.id,
        participants: otherParticipants,
        createdAt: conversation.createdAt,
      },
      messages: formattedMessages,
      nextCursor,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return ErrorResponses.internalError(res);
  }
});

// ==================== MESSAGES ====================

/**
 * POST /messages/conversations/:id/messages
 * Send a message in a conversation
 */
router.post('/conversations/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const conversationId = String(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      return ErrorResponses.badRequest(res, 'Message content is required');
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return ErrorResponses.notFound(res, 'Conversation');
    }

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content.trim(),
          senderId: userId,
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);

    return SuccessResponses.created(res, {
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          avatar: message.sender.profileImage,
        },
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /messages/conversations/:id/read
 * Mark a conversation as read
 */
router.post('/conversations/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const conversationId = String(req.params.id);

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return SuccessResponses.ok(res, { message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /messages/unread-count
 * Get total unread message count
 */
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    let unreadCount = 0;
    for (const p of participants) {
      const lastMessage = p.conversation.messages[0];
      if (lastMessage && lastMessage.senderId !== userId) {
        if (!p.lastReadAt || new Date(lastMessage.createdAt) > new Date(p.lastReadAt)) {
          unreadCount++;
        }
      }
    }

    return SuccessResponses.ok(res, { unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
