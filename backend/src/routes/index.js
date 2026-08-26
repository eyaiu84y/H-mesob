import express from 'express';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Health check endpoint
router.use('/health', healthRoutes);

// Future routes will be added here:
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/institutions', institutionRoutes);
// router.use('/services', serviceRoutes);
// router.use('/applications', applicationRoutes);
// router.use('/queue', queueRoutes);
// router.use('/maintenance', maintenanceRoutes);
// router.use('/announcements', announcementRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
