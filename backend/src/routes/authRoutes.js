import express from 'express';
import { 
  login, 
  register, 
  getMe, 
  logout, 
  verifyToken, 
  changePassword, 
  verifyEmail, 
  resendVerification,
  sendPhoneOTP,
  verifyPhoneOTP
} from '../controllers/authController.js';
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
 * @desc    Register new customer account (Strictly @gmail.com)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (mandatory for new internal accounts or self-service)
 * @access  Private (requires authentication)
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/auth/verify-email
 * @route   GET /api/auth/verify-email
 * @desc    Verify customer email address with 6-digit code or link token
 * @access  Public
 */
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification code
 * @access  Public
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   POST /api/auth/send-phone-otp
 * @desc    Send OTP to verify customer mobile phone
 * @access  Private (requires authentication)
 */
router.post('/send-phone-otp', authenticate, sendPhoneOTP);

/**
 * @route   POST /api/auth/verify-phone-otp
 * @desc    Verify customer phone with 6-digit OTP
 * @access  Private (requires authentication)
 */
router.post('/verify-phone-otp', authenticate, verifyPhoneOTP);

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
