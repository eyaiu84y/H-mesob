import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../services/notificationService.js';
import { getOutboxStats, getOutboxLogs, purgeMockOutbox } from '../services/emailOutboxService.js';
import { getWorkerHealth, setWorkerConcurrency } from '../services/emailWorker.js';
import { setActiveEmailProvider, getActiveEmailProvider } from '../services/emailProviderFactory.js';

export const getEmailOutboxStatsController = async (req, res) => {
  try {
    const stats = await getOutboxStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get email outbox stats controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email outbox statistics.' });
  }
};

export const getEmailOutboxHealthController = async (req, res) => {
  try {
    const health = await getWorkerHealth();
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Get email outbox health controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email outbox health.' });
  }
};

export const patchEmailOutboxConfigController = async (req, res) => {
  try {
    const { concurrency, provider } = req.body;
    let concurrencyUpdated = false;
    let providerUpdated = false;

    if (concurrency !== undefined) {
      concurrencyUpdated = setWorkerConcurrency(concurrency);
    }

    if (provider !== undefined) {
      providerUpdated = setActiveEmailProvider(provider);
    }

    const currentHealth = await getWorkerHealth();
    res.status(200).json({
      success: true,
      message: 'Worker configuration updated successfully.',
      data: {
        concurrencyUpdated,
        providerUpdated,
        currentHealth,
      }
    });
  } catch (error) {
    console.error('Patch email outbox config controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to update email outbox configuration.' });
  }
};

export const getEmailOutboxLogsController = async (req, res) => {
  try {
    const { limit, page, status } = req.query;
    const logs = await getOutboxLogs({ limit, page, status });
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get email outbox logs controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email outbox logs.' });
  }
};

export const purgeMockEmailOutboxController = async (req, res) => {
  try {
    const { clearAllFailed } = req.body || {};
    const result = await purgeMockOutbox({ clearAllFailed: Boolean(clearAllFailed) });
    res.status(200).json({
      success: true,
      message: `Successfully purged ${result.purgedCount} mock/test outbox records.`,
      data: result,
    });
  } catch (error) {
    console.error('Purge mock email outbox error:', error);
    res.status(500).json({ success: false, message: 'Failed to purge mock email logs.' });
  }
};

export const getNotificationsController = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const filters = {
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };

    const result = await getNotifications(req.user, filters);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get notifications controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const result = await getUnreadCount(req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get unread count controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count.' });
  }
};

export const patchMarkAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const result = await markAsRead(req.params.id, req.user);
    if (!result.success) {
      const status = (result.message?.includes('not found') || result.message?.includes('access denied')) ? 404 : 400;
      return res.status(status).json(result);
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark as read controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

export const patchMarkAllAsRead = async (req, res) => {
  try {
    const result = await markAllAsRead(req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark all as read controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};
