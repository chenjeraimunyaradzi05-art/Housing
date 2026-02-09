import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    groupId: z.string().uuid().optional(),
  }).refine((data) => data.content || (data.mediaUrls && data.mediaUrls.length > 0), {
    message: "Post must contain either content or media",
    path: ["content"],
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required for update"),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Comment cannot be empty"),
    parentId: z.string().uuid().optional(), // For replies
  }),
});

export const getFeedSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    cursor: z.string().optional(),
    userId: z.string().uuid().optional(), // Filter by user profile
  }),
});

export const reportContentSchema = z.object({
  body: z.object({
    reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'HATE_SPEECH', 'MISINFORMATION', 'OTHER']),
    details: z.string().max(1000).optional(),
  }),
});
