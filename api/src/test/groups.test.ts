import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-minimum-32-characters';

describe('Groups Features', () => {
  let testUser1: { id: string; email: string };
  let testUser2: { id: string; email: string };
  let authToken1: string;
  let authToken2: string;
  let testGroup: { id: string };

  beforeAll(async () => {
    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'groups-test-user1@test.com',
        username: 'groupstestuser1',
        passwordHash: 'hashedpassword123',
        firstName: 'Group',
        lastName: 'User1',
        emailVerified: new Date(),
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'groups-test-user2@test.com',
        username: 'groupstestuser2',
        passwordHash: 'hashedpassword123',
        firstName: 'Group',
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
    await prisma.groupMember.deleteMany({
      where: { userId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.post.deleteMany({
      where: { authorId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.communityGroup.deleteMany({
      where: { ownerId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser1.id, testUser2.id] } },
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Women in Real Estate',
          description: 'A community for women investing in real estate',
          isPrivate: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Women in Real Estate');
      expect(response.body.data.ownerId).toBe(testUser1.id);

      testGroup = response.body.data;
    });

    it('should require a name', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          description: 'This should fail',
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/groups', () => {
    it('should list public groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('groups');
      expect(Array.isArray(response.body.data.groups)).toBe(true);
    });
  });

  describe('GET /api/groups/my-groups', () => {
    it('should list user groups', async () => {
      const response = await request(app)
        .get('/api/groups/my-groups')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('groups');
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should get a specific group', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testGroup.id);
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .get('/api/groups/non-existent-id')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/groups/:id/join', () => {
    it('should allow a user to join a group', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup.id}/join`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
    });

    it('should not allow joining twice', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup.id}/join`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/groups/:id/members', () => {
    it('should list group members', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup.id}/members`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('members');
      expect(Array.isArray(response.body.data.members)).toBe(true);
    });
  });

  describe('POST /api/groups/:id/posts', () => {
    it('should create a post in the group', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup.id}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Hello from the group!',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.groupId).toBe(testGroup.id);
    });
  });

  describe('GET /api/groups/:id/posts', () => {
    it('should list group posts', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup.id}/posts`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group (owner only)', async () => {
      const response = await request(app)
        .put(`/api/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          description: 'Updated description for women investors',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description for women investors');
    });

    it('should not allow non-owner to update', async () => {
      const response = await request(app)
        .put(`/api/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          name: 'Hijacked Group',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/groups/:id/leave', () => {
    it('should allow a member to leave', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup.id}/leave`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
    });

    it('should not allow owner to leave', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup.id}/leave`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should not allow non-owner to delete', async () => {
      const response = await request(app)
        .delete(`/api/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
    });

    it('should delete group (owner only)', async () => {
      const response = await request(app)
        .delete(`/api/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
    });
  });
});
