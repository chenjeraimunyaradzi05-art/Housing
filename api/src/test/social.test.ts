import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-minimum-32-characters';

describe('Social Features', () => {
  let testUser1: { id: string; email: string };
  let testUser2: { id: string; email: string };
  let authToken1: string;
  let authToken2: string;
  let testPost: { id: string };

  beforeAll(async () => {
    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'social-test-user1@test.com',
        username: 'socialtestuser1',
        passwordHash: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User1',
        emailVerified: new Date(),
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'social-test-user2@test.com',
        username: 'socialtestuser2',
        passwordHash: 'hashedpassword123',
        firstName: 'Test',
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
    await prisma.like.deleteMany({
      where: { userId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.comment.deleteMany({
      where: { authorId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.post.deleteMany({
      where: { authorId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: [testUser1.id, testUser2.id] } },
          { followingId: { in: [testUser1.id, testUser2.id] } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser1.id, testUser2.id] } },
    });
  });

  describe('POST /api/social/posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'This is a test post for VÖR platform!',
          mediaUrls: [],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('This is a test post for VÖR platform!');
      expect(response.body.data.authorId).toBe(testUser1.id);

      testPost = response.body.data;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .send({
          content: 'This should fail',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/feed', () => {
    it('should get the social feed', async () => {
      const response = await request(app)
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/social/feed?limit=5')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.posts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/social/posts/:id/like', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
    });

    it('should toggle like off', async () => {
      // Like again to toggle off
      const response = await request(app)
        .post(`/api/social/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/social/posts/:id/comments', () => {
    it('should add a comment to a post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Great post! This is very helpful.',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('Great post! This is very helpful.');
    });

    it('should require content', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/social/posts/:id/comments', () => {
    it('should get comments for a post', async () => {
      const response = await request(app)
        .get(`/api/social/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('comments');
      expect(Array.isArray(response.body.data.comments)).toBe(true);
    });
  });

  describe('POST /api/social/users/:id/follow', () => {
    it('should follow a user', async () => {
      const response = await request(app)
        .post(`/api/social/users/${testUser2.id}/follow`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
    });

    it('should not follow self', async () => {
      const response = await request(app)
        .post(`/api/social/users/${testUser1.id}/follow`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(400);
    });

    it('should toggle follow (unfollow)', async () => {
      const response = await request(app)
        .post(`/api/social/users/${testUser2.id}/follow`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/social/posts/:id', () => {
    it('should not allow deleting others post', async () => {
      const response = await request(app)
        .delete(`/api/social/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
    });

    it('should delete own post', async () => {
      const response = await request(app)
        .delete(`/api/social/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
    });
  });
});
