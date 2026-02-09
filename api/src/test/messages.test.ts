import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-minimum-32-characters';

describe('Messages Features', () => {
  let testUser1: { id: string; email: string };
  let testUser2: { id: string; email: string };
  let authToken1: string;
  let authToken2: string;
  let testConversation: { id: string };

  beforeAll(async () => {
    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'messages-test-user1@test.com',
        username: 'messagestestuser1',
        passwordHash: 'hashedpassword123',
        firstName: 'Message',
        lastName: 'User1',
        emailVerified: new Date(),
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'messages-test-user2@test.com',
        username: 'messagestestuser2',
        passwordHash: 'hashedpassword123',
        firstName: 'Message',
        lastName: 'User2',
        emailVerified: new Date(),
      },
    });

    // Generate tokens
    authToken1 = jwt.sign({ userId: testUser1.id, email: testUser1.email }, JWT_SECRET);
    authToken2 = jwt.sign({ userId: testUser2.id, email: testUser2.email }, JWT_SECRET);
  });

  afterAll(async () => {
    // Clean up test data in correct order
    await prisma.message.deleteMany({
      where: { senderId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.conversationParticipant.deleteMany({
      where: { userId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.conversation.deleteMany({
      where: {
        participants: {
          some: { userId: { in: [testUser1.id, testUser2.id] } },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser1.id, testUser2.id] } },
    });
  });

  describe('POST /api/messages/conversations', () => {
    it('should create a new conversation', async () => {
      const response = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          participantIds: [testUser2.id],
          initialMessage: 'Hello! Let\'s discuss real estate investments.',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.participants.length).toBe(2);

      testConversation = response.body.data;
    });

    it('should not create conversation with self only', async () => {
      const response = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          participantIds: [],
          initialMessage: 'Talking to myself',
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/messages/conversations')
        .send({
          participantIds: [testUser2.id],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should list user conversations', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('conversations');
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
      expect(response.body.data.conversations.length).toBeGreaterThan(0);
    });

    it('should also show conversations for other participant', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.data.conversations.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/messages/conversations/:id', () => {
    it('should get conversation with messages', async () => {
      const response = await request(app)
        .get(`/api/messages/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data.messages.length).toBe(1);
    });

    it('should not allow non-participant to access', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-message-user@test.com',
          username: 'othermessageuser',
          passwordHash: 'hashedpassword123',
          firstName: 'Other',
          lastName: 'User',
          emailVerified: new Date(),
        },
      });

      const otherToken = jwt.sign({ userId: otherUser.id, email: otherUser.email }, JWT_SECRET);

      const response = await request(app)
        .get(`/api/messages/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/messages/conversations/non-existent-id')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/messages/conversations/:id/messages', () => {
    it('should send a message', async () => {
      const response = await request(app)
        .post(`/api/messages/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Sounds great! I\'m interested in learning more.',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('Sounds great! I\'m interested in learning more.');
      expect(response.body.data.senderId).toBe(testUser2.id);
    });

    it('should require content', async () => {
      const response = await request(app)
        .post(`/api/messages/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/messages/unread-count', () => {
    it('should get unread message count', async () => {
      const response = await request(app)
        .get('/api/messages/unread-count')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(typeof response.body.data.unreadCount).toBe('number');
    });
  });

  describe('POST /api/messages/conversations/:id/read', () => {
    it('should mark messages as read', async () => {
      const response = await request(app)
        .post(`/api/messages/conversations/${testConversation.id}/read`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);

      // Verify the lastReadAt was updated
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: testConversation.id,
            userId: testUser1.id,
          },
        },
      });
      expect(participant?.lastReadAt).not.toBeNull();
    });
  });
});
