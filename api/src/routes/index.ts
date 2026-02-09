import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import propertyRoutes from './property.routes';
import comparableRoutes from './comparable.routes';
import calculatorRoutes from './calculator.routes';
import maintenanceRoutes from './maintenance.routes';
import coinvestmentRoutes from './coinvestment.routes';
import stripeWebhookRoutes from './stripe-webhook.routes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import plaidWebhookRoutes from './plaid-webhook.routes';
import socialRoutes from './social.routes';
import messagesRoutes from './messages.routes';
import notificationsRoutes from './notifications.routes';
import groupsRoutes from './groups.routes';
import securityRoutes from './security.routes';
import gdprRoutes from './gdpr.routes';
import adminComplianceRoutes from './admin.compliance.routes';
import adminModerationRoutes from './admin.moderation.routes';
import goalRoutes from './goal.routes';
import recurringRoutes from './recurring.routes';
import networthRoutes from './networth.routes';
// Phase 12-16 Routes
import aiRoutes from './ai.routes';
import safehousingRoutes from './safehousing.routes';
import agentsRoutes from './agents.routes';
import taxRoutes from './tax.routes';
import streamingRoutes from './streaming.routes';
import mentorshipRoutes from './mentorship.routes';

const router = Router();

/**
 * API Root
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'VÖR API',
    version: '1.0.0',
    description: 'Women-Centered Real Estate & Generational Wealth Platform',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      properties: '/api/properties',
      calculator: '/api/calculator',
      maintenance: '/api/maintenance',
      investments: '/api/co-invest',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      budgets: '/api/budgets',
      goals: '/api/goals',
      recurring: '/api/recurring',
      networth: '/api/networth',
      social: '/api/social',
      messages: '/api/messages',
      notifications: '/api/notifications',
      groups: '/api/groups',
      ai: '/api/ai',
      safehousing: '/api/safehousing',
      agents: '/api/agents',
      tax: '/api/tax',
      streaming: '/api/streaming',
      mentorship: '/api/mentorship',
    },
  });
});

/**
 * Mount route modules
 */
router.use('/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/properties', propertyRoutes);
router.use('/api/properties', comparableRoutes);
router.use('/api/calculator', calculatorRoutes);
router.use('/api/maintenance', maintenanceRoutes);
router.use('/api/co-invest', coinvestmentRoutes);
router.use('/webhooks/stripe', stripeWebhookRoutes);
router.use('/api/accounts', accountRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api/budgets', budgetRoutes);
router.use('/api/goals', goalRoutes);
router.use('/api/recurring', recurringRoutes);
router.use('/api/networth', networthRoutes);
router.use('/webhooks/plaid', plaidWebhookRoutes);
router.use('/api/social', socialRoutes);
router.use('/api/messages', messagesRoutes);
router.use('/api/notifications', notificationsRoutes);
router.use('/api/groups', groupsRoutes);
router.use('/api/security', securityRoutes);
router.use('/api/gdpr', gdprRoutes);
router.use('/api/admin/compliance', adminComplianceRoutes);
router.use('/api/admin/moderation', adminModerationRoutes);
// Phase 12-16 Routes
router.use('/api/ai', aiRoutes);
router.use('/api/safehousing', safehousingRoutes);
router.use('/api/agents', agentsRoutes);
router.use('/api/tax', taxRoutes);
router.use('/api/streaming', streamingRoutes);
router.use('/api/mentorship', mentorshipRoutes);

export default router;
