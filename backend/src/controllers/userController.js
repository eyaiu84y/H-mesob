import { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser } from '../services/userService.js';

/**
 * GET /api/users
 * Get all users with optional filtering
 */
export const getUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      institutionId: req.query.institutionId
    };

    const result = await getAllUsers(filters, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get users controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.'
    });
  }
};

/**
 * GET /api/users/:id
 * Get user by ID
 */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getUserById(id, req.user);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get user controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user.'
    });
  }
};

/**
 * POST /api/users
 * Create new user
 */
export const postUser = async (req, res) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      phone: req.body.phone,
      role: req.body.role,
      institutionId: req.body.institutionId,
      employeeId: req.body.employeeId,
      nationalId: req.body.nationalId
    };

    const result = await createUser(userData, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create user controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user.'
    });
  }
};

/**
 * PATCH /api/users/:id
 * Update user
 */
export const patchUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      role: req.body.role,
      institutionId: req.body.institutionId,
      employeeId: req.body.employeeId,
      nationalId: req.body.nationalId,
      profilePhotoUrl: req.body.profilePhotoUrl,
      password: req.body.password
    };

    const result = await updateUser(id, updates, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update user controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user.'
    });
  }
};

/**
 * PATCH /api/users/:id/status
 * Update user status
 */
export const patchUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.'
      });
    }

    const result = await updateUserStatus(id, status, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update user status controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.'
    });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user (soft delete)
 */
export const removeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteUser(id, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Delete user controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user.'
    });
  }
};
