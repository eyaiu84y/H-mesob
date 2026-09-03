import express from 'express';
import { login, register, getMe, logout, verifyToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user account
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user (invalidate session)
 * @access  Private (requires authentication)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify if JWT token is valid
 * @access  Private (requires authentication)
 */
router.post('/verify-token', authenticate, verifyToken);

export default router;
