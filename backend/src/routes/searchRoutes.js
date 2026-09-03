import express from 'express';
import { performSearch } from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/search?q=
 * @desc    Search across institutions, services, and requirements
 * @access  Public
 */
router.get('/', 
  optionalAuth,
  performSearch
);

export default router;
