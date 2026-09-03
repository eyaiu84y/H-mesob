import { search } from '../services/searchService.js';

/**
 * GET /api/search?q=
 * Search across database
 */
export const performSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter "q" is required.'
      });
    }

    const result = await search(q);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search.'
    });
  }
};
