import { getAllInstitutions, getInstitutionById, createInstitution, updateInstitution, deleteInstitution } from '../services/institutionService.js';

/**
 * GET /api/institutions
 * Get all institutions
 */
export const getInstitutions = async (req, res) => {
  try {
    const filters = {
      status: req.query.status
    };

    const result = await getAllInstitutions(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get institutions controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institutions.'
    });
  }
};

/**
 * GET /api/institutions/:id
 * Get institution by ID
 */
export const getInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getInstitutionById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get institution controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institution.'
    });
  }
};

/**
 * POST /api/institutions
 * Create new institution
 */
export const postInstitution = async (req, res) => {
  try {
    const institutionData = {
      name: req.body.name,
      nameAm: req.body.nameAm,
      code: req.body.code,
      description: req.body.description,
      descriptionAm: req.body.descriptionAm,
      details: req.body.details,
      detailsAm: req.body.detailsAm,
      logoUrl: req.body.logoUrl,
      websiteUrl: req.body.websiteUrl,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      addressAm: req.body.addressAm
    };

    const result = await createInstitution(institutionData, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create institution controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create institution.'
    });
  }
};

/**
 * PATCH /api/institutions/:id
 * Update institution
 */
export const patchInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      name: req.body.name,
      nameAm: req.body.nameAm,
      code: req.body.code,
      description: req.body.description,
      descriptionAm: req.body.descriptionAm,
      details: req.body.details,
      detailsAm: req.body.detailsAm,
      logoUrl: req.body.logoUrl,
      websiteUrl: req.body.websiteUrl,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      addressAm: req.body.addressAm,
      status: req.body.status
    };

    const result = await updateInstitution(id, updates, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update institution controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update institution.'
    });
  }
};

/**
 * DELETE /api/institutions/:id
 * Delete institution (soft delete)
 */
export const removeInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteInstitution(id, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Delete institution controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete institution.'
    });
  }
};
