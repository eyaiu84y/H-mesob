import { loginUser, registerUser, getUserProfile, logoutUser } from '../services/authService.js';

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Attempt login
    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * POST /api/auth/register
 * Register new user account
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, institutionId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required.'
      });
    }

    // Attempt registration
    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      institutionId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserProfile(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.'
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout current user (invalidate session)
 */
export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization.substring(7); // Remove 'Bearer ' prefix

    const result = await logoutUser(userId, token);

    res.status(200).json(result);

  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.'
    });
  }
};

/**
 * POST /api/auth/verify-token
 * Verify if current token is valid (requires authentication)
 */
export const verifyToken = async (req, res) => {
  try {
    // If we reach here, token is valid (authenticate middleware passed)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Verify token controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token.'
    });
  }
};
