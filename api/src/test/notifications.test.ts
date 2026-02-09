import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-minimum-32-characters';

describe('Notifications Features', () => {
  let testUser: { id: string; email: string };
  let authToken: string;
  let testNotification: { id: string };

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'notifications-test-user@test.com',
        username: 'notifstestuser',
        passwordHash: 'hashedpassword123',
        firstName: 'Notif',
        lastName: 'User',
        emailVerified: new Date(),
      },
    });

    // Generate token
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, JWT_SECRET);

    // Create test notifications
    testNotification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'like',
        title: 'New Like',
        message: 'Someone liked your post',
        isRead: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'comment',
        title: 'New Comment',
        message: 'Someone commented on your post',
        isRead: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'follow',
        title: 'New Follower',
        message: 'Someone started following you',
        isRead: true,
        readAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  describe('GET /api/notifications', () => {
    it('should get all notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('notifications');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.notifications.length).toBe(3);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBe(2);
      expect(response.body.data.notifications.every((n: { isRead: boolean }) => !n.isRead)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notifications?limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBe(1);
      expect(response.body.data).toHaveProperty('nextCursor');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(response.body.data.unreadCount).toBe(2);
    });
  });

  describe('POST /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app)
        .post(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify it was marked as read
      const notification = await prisma.notification.findUnique({
        where: { id: testNotification.id },
      });
      expect(notification?.isRead).toBe(true);
      expect(notification?.readAt).not.toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .post('/api/notifications/non-existent-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // First, add a new unread notification
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'message',
          title: 'New Message',
          message: 'You have a new message',
          isRead: false,
        },
      });

      const response = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify all are marked as read
      const unreadCount = await prisma.notification.count({
        where: { userId: testUser.id, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      // Create a notification to delete
      const toDelete = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'test',
          title: 'To Delete',
          message: 'This will be deleted',
        },
      });

      const response = await request(app)
        .delete(`/api/notifications/${toDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify it was deleted
      const notification = await prisma.notification.findUnique({
        where: { id: toDelete.id },
      });
      expect(notification).toBeNull();
    });

    it('should not delete other users notifications', async () => {
      // Create another user and their notification
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-notif-user@test.com',
          username: 'othernotifuser',
          passwordHash: 'hashedpassword123',
          firstName: 'Other',
          lastName: 'User',
          emailVerified: new Date(),
        },
      });

      const otherNotification = await prisma.notification.create({
        data: {
          userId: otherUser.id,
          type: 'test',
          title: 'Other User',
          message: 'This is not yours',
        },
      });

      const response = await request(app)
        .delete(`/api/notifications/${otherNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.notification.delete({ where: { id: otherNotification.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
