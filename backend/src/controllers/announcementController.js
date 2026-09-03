import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement
} from '../services/announcementService.js';

export const getAnnouncementsController = async (req, res) => {
  try {
    const filters = {};
    const result = await getAnnouncements(filters, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get announcements controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
};

export const getAnnouncement = async (req, res) => {
  try {
    const result = await getAnnouncementById(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get announcement controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcement.' });
  }
};

export const postAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      title: req.body.title,
      content: req.body.content,
      scope: req.body.scope,
      targetRoles: req.body.targetRoles,
      institutionId: req.body.institutionId,
      expiresAt: req.body.expiresAt
    };

    const result = await createAnnouncement(announcementData, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create announcement controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

export const patchAnnouncement = async (req, res) => {
  try {
    const updates = {
      title: req.body.title,
      content: req.body.content,
      scope: req.body.scope,
      targetRoles: req.body.targetRoles,
      institutionId: req.body.institutionId,
      expiresAt: req.body.expiresAt
    };

    const result = await updateAnnouncement(req.params.id, updates, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update announcement controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement.' });
  }
};

export const postPublishAnnouncement = async (req, res) => {
  try {
    const result = await publishAnnouncement(req.params.id, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Publish announcement controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish announcement.' });
  }
};

export const removeAnnouncement = async (req, res) => {
  try {
    const result = await deleteAnnouncement(req.params.id, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete announcement controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
};
