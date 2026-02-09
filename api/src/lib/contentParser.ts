/**
 * Content Parser for Social Features
 * Extracts hashtags and mentions from post/comment content
 */

import { PrismaClient } from '@prisma/client';

type PrismaInstance = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

export interface ParsedContent {
  hashtags: string[]; // Normalized hashtag names (without #)
  mentions: string[]; // Usernames mentioned (without @)
}

/**
 * Parse content to extract hashtags and mentions
 * @param content - The text content to parse
 * @returns Object containing arrays of hashtags and mentions
 */
export function parseContent(content: string | null | undefined): ParsedContent {
  if (!content) {
    return { hashtags: [], mentions: [] };
  }

  // Extract hashtags: words starting with # followed by alphanumeric chars
  // Supports: #hashtag, #HashTag, #hash_tag, #hash123
  const hashtagRegex = /#([a-zA-Z][a-zA-Z0-9_]*)/g;
  const hashtags: string[] = [];
  let hashtagMatch;
  while ((hashtagMatch = hashtagRegex.exec(content)) !== null) {
    const tag = hashtagMatch[1].toLowerCase();
    if (!hashtags.includes(tag) && tag.length <= 50) {
      hashtags.push(tag);
    }
  }

  // Extract mentions: words starting with @ followed by username pattern
  // Supports: @username, @user_name, @user123
  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9_]*)/g;
  const mentions: string[] = [];
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(content)) !== null) {
    const username = mentionMatch[1].toLowerCase();
    if (!mentions.includes(username) && username.length <= 30) {
      mentions.push(username);
    }
  }

  return { hashtags, mentions };
}

/**
 * Create or update hashtags in the database
 * Returns array of hashtag IDs
 */
export async function upsertHashtags(
  prisma: PrismaInstance,
  hashtags: string[]
): Promise<string[]> {
  if (hashtags.length === 0) {
    return [];
  }

  const hashtagIds: string[] = [];

  for (const name of hashtags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    hashtagIds.push(hashtag.id);
  }

  return hashtagIds;
}

/**
 * Find users by usernames for mentions
 * Returns map of username -> userId
 */
export async function findMentionedUsers(
  prisma: PrismaInstance,
  usernames: string[]
): Promise<Map<string, string>> {
  if (usernames.length === 0) {
    return new Map();
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  const userMap = new Map<string, string>();
  for (const user of users) {
    userMap.set(user.username.toLowerCase(), user.id);
  }

  return userMap;
}

/**
 * Update hashtag post counts (call after creating/deleting posts)
 */
export async function updateHashtagCounts(
  prisma: PrismaInstance,
  hashtagIds: string[],
  increment: boolean = true
): Promise<void> {
  if (hashtagIds.length === 0) {
    return;
  }

  await prisma.hashtag.updateMany({
    where: { id: { in: hashtagIds } },
    data: {
      postCount: increment ? { increment: 1 } : { decrement: 1 },
    },
  });
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(
  prisma: PrismaInstance,
  limit: number = 10
): Promise<{ id: string; name: string; postCount: number }[]> {
  return prisma.hashtag.findMany({
    where: {
      postCount: { gt: 0 },
    },
    orderBy: { postCount: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      postCount: true,
    },
  });
}

/**
 * Create mention notifications
 */
export async function createMentionNotifications(
  prisma: PrismaInstance,
  postId: string,
  mentionerId: string,
  mentionedUserIds: string[],
  postContent: string
): Promise<void> {
  if (mentionedUserIds.length === 0) {
    return;
  }

  // Don't notify yourself
  const usersToNotify = mentionedUserIds.filter((id) => id !== mentionerId);

  if (usersToNotify.length === 0) {
    return;
  }

  const mentioner = await prisma.user.findUnique({
    where: { id: mentionerId },
    select: { username: true, firstName: true, lastName: true },
  });

  const notifications = usersToNotify.map((userId) => ({
    userId,
    type: 'MENTION',
    title: 'You were mentioned',
    message: `@${mentioner?.username || 'Someone'} mentioned you in a post`,
    data: JSON.stringify({
      postId,
      mentionerId,
      preview: postContent.substring(0, 100),
    }),
  }));

  await prisma.notification.createMany({
    data: notifications,
  });
}
