/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Submit feedback
   */
  async function submitFeedback(feedbackData) {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/feedback', feedbackData);

      if (response.success) {
        // Add new feedback to local state
        setMyFeedback(prev => [response.data, ...prev]);
        return { success: true, data: response.data };
      }

      return { success: false, message: response.message || 'Failed to submit feedback' };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const message = error.response?.data?.message || error.message || 'Failed to submit feedback';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch my feedback
   */
  const fetchMyFeedback = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.institution_id) queryParams.append('institution_id', filters.institution_id);
      if (filters.service_id) queryParams.append('service_id', filters.service_id);
      if (filters.rating) queryParams.append('rating', filters.rating);

      const url = `/feedback/my-feedback${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);

      if (response.success) {
        setMyFeedback(response.data || []);
        return { success: true, data: response.data };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error fetching feedback:', error);
      const message = error.response?.data?.message || 'Failed to fetch feedback';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if can submit feedback
   */
  async function canSubmitFeedback(applicationId = null, queueEntryId = null) {
    try {
      const queryParams = new URLSearchParams();
      if (applicationId) queryParams.append('application_id', applicationId);
      if (queueEntryId) queryParams.append('queue_entry_id', queueEntryId);

      const url = `/feedback/can-submit${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);

      if (response.success) {
        return response.data.canSubmit;
      }

      return false;
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      return false;
    }
  }

  /**
   * Get rating meaning
   */
  function getRatingMeaning(rating) {
    const meanings = {
      1: 'Poor',
      2: 'Good',
      3: 'Very Good',
      4: 'Excellent',
      5: 'Fantastic'
    };
    return meanings[rating] || '';
  }

  return (
    <FeedbackContext.Provider value={{
      myFeedback,
      loading,
      error,
      submitFeedback,
      fetchMyFeedback,
      canSubmitFeedback,
      getRatingMeaning
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
}
