/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AnnouncementContext = createContext(null);

export function AnnouncementProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch announcements from backend
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/announcements');

      // Handle both response formats: { success, data } or direct data
      if (response && response.success && response.data) {
        setAnnouncements(Array.isArray(response.data) ? response.data : []);
      } else if (response && Array.isArray(response)) {
        setAnnouncements(response);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError(err.response?.data?.message || 'Failed to fetch announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create announcement
  const createAnnouncement = useCallback(async (announcementData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/announcements', announcementData);

      if (response.data.success && response.data.data) {
        const newAnnouncement = response.data.data;
        
        // Add to local state
        setAnnouncements(prev => [newAnnouncement, ...prev]);

        // Refresh from backend
        await fetchAnnouncements();

        return { success: true, announcement: newAnnouncement };
      } else {
        throw new Error(response.data.message || 'Failed to create announcement');
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create announcement';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements]);

  // Get announcements by scope
  const getAnnouncementsByScope = useCallback((scope) => {
    if (!scope) return announcements;
    return announcements.filter(a => a.scope === scope.toUpperCase());
  }, [announcements]);

  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        loading,
        error,
        fetchAnnouncements,
        createAnnouncement,
        getAnnouncementsByScope,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) throw new Error('useAnnouncements must be used inside AnnouncementProvider');
  return ctx;
}
