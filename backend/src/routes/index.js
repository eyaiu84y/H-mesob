import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import institutionRoutes from './institutionRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import searchRoutes from './searchRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import queueRoutes from './queueRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import approvalRoutes from './approvalRoutes.js';

const router = express.Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints
router.use('/auth', authRoutes);

// User management
router.use('/users', userRoutes);

// Central Approval Workflow (Institutions & User Accounts)
router.use('/approvals', approvalRoutes);

// Institution management
router.use('/institutions', institutionRoutes);

// Service catalogue
router.use('/services', serviceRoutes);

// Search
router.use('/search', searchRoutes);

// Applications
router.use('/applications', applicationRoutes);

// Queue management
router.use('/queues', queueRoutes);

// Maintenance reports and tasks
router.use('/maintenance', maintenanceRoutes);

// Announcements
router.use('/announcements', announcementRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Dashboards
router.use('/dashboards', dashboardRoutes);

// Feedback
router.use('/feedback', feedbackRoutes);

export default router;
