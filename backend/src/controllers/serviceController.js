import {
  getAllServices,
  getServicesByInstitution,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getRequirementsByService,
  createRequirement,
  updateRequirement,
  deleteRequirement
} from '../services/serviceService.js';

// ============================================================================
// SERVICES
// ============================================================================

/**
 * GET /api/services
 * Get all services (with optional filters)
 */
export const getServices = async (req, res) => {
  try {
    const filters = {
      institutionId: req.query.institutionId,
      status: req.query.status
    };

    const result = await getAllServices(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get services controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services.'
    });
  }
};

/**
 * GET /api/institutions/:institutionId/services
 * Get services by institution
 */
export const getInstitutionServices = async (req, res) => {
  try {
    const { institutionId } = req.params;

    const result = await getServicesByInstitution(institutionId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get institution services controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services.'
    });
  }
};

/**
 * GET /api/services/:id
 * Get service by ID
 */
export const getService = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getServiceById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get service controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service.'
    });
  }
};

/**
 * POST /api/services
 * Create new service
 */
export const postService = async (req, res) => {
  try {
    const serviceData = {
      institutionId: req.body.institutionId,
      name: req.body.name,
      nameAm: req.body.nameAm,
      description: req.body.description,
      descriptionAm: req.body.descriptionAm,
      processingTime: req.body.processingTime,
      processingTimeAm: req.body.processingTimeAm,
      feeAmount: req.body.feeAmount,
      officialLink: req.body.officialLink,
      requiredDocuments: req.body.requiredDocuments
    };

    const result = await createService(serviceData, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create service controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service.'
    });
  }
};

/**
 * PATCH /api/services/:id
 * Update service
 */
export const patchService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      name: req.body.name,
      nameAm: req.body.nameAm,
      description: req.body.description,
      descriptionAm: req.body.descriptionAm,
      processingTime: req.body.processingTime,
      processingTimeAm: req.body.processingTimeAm,
      feeAmount: req.body.feeAmount,
      officialLink: req.body.officialLink,
      requiredDocuments: req.body.requiredDocuments,
      status: req.body.status
    };

    const result = await updateService(id, updates, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update service controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service.'
    });
  }
};

/**
 * DELETE /api/services/:id
 * Delete service (soft delete)
 */
export const removeService = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteService(id, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Delete service controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service.'
    });
  }
};

// ============================================================================
// REQUIREMENTS
// ============================================================================

/**
 * GET /api/services/:serviceId/requirements
 * Get requirements by service
 */
export const getRequirements = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const result = await getRequirementsByService(serviceId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get requirements controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements.'
    });
  }
};

/**
 * POST /api/services/:serviceId/requirements
 * Create requirement
 */
export const postRequirement = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const requirementData = {
      requirementEn: req.body.requirementEn,
      requirementAm: req.body.requirementAm,
      displayOrder: req.body.displayOrder
    };

    const result = await createRequirement(serviceId, requirementData, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create requirement controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create requirement.'
    });
  }
};

/**
 * PATCH /api/requirements/:id
 * Update requirement
 */
export const patchRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      requirementEn: req.body.requirementEn,
      requirementAm: req.body.requirementAm,
      displayOrder: req.body.displayOrder
    };

    const result = await updateRequirement(id, updates, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update requirement controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update requirement.'
    });
  }
};

/**
 * DELETE /api/requirements/:id
 * Delete requirement
 */
export const removeRequirement = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteRequirement(id, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Delete requirement controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete requirement.'
    });
  }
};
