import { joinQueue, getQueues, getQueueById, callNext, updateQueueStatus, getQueueStatus } from '../services/queueService.js';

/**
 * POST /api/queues/join
 * Join queue
 */
export const postJoinQueue = async (req, res) => {
  try {
    console.log('=== QUEUE CONTROLLER: JOIN REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const queueData = {
      institutionId: req.body.institutionId,
      serviceId: req.body.serviceId,
      priority: req.body.priority
    };

    console.log('Queue data prepared:', queueData);

    const result = await joinQueue(queueData, req.user);

    console.log('Join queue result:', result);

    if (!result.success) {
      console.error('❌ Join queue failed:', result.message);
      return res.status(400).json(result);
    }

    console.log('✅ Join queue successful');
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Join queue controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join queue.'
    });
  }
};

/**
 * GET /api/queues
 * Get queues (filtered by role)
 */
export const getQueuesController = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      institutionId: req.query.institutionId,
      date: req.query.date
    };

    const result = await getQueues(filters, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get queues controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queues.'
    });
  }
};

/**
 * GET /api/queues/:id
 * Get queue by ID
 */
export const getQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getQueueById(id, req.user);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get queue controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue.'
    });
  }
};

/**
 * POST /api/queues/:id/call-next
 * Call next person in queue
 */
export const postCallNext = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.body?.institutionId || req.query?.institutionId;
    const user = {
      ...req.user,
      institution_id: req.user?.institution_id || institutionId
    };

    const result = await callNext(id || null, user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Call next controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call next person.'
    });
  }
};

/**
 * PATCH /api/queues/:id/status
 * Update queue status
 */
export const patchQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.'
      });
    }

    const result = await updateQueueStatus(id, status, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update queue status controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update queue status.'
    });
  }
};

/**
 * GET /api/queues/:id/status
 * Get queue status (public)
 */
export const getQueueStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getQueueStatus(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get queue status controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue status.'
    });
  }
};
