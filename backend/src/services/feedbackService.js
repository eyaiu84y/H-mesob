import { supabase } from '../config/supabase.js';

/**
 * Feedback Service
 * Handles citizen feedback and ratings for services
 */

/**
 * Submit feedback for a service
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.citizen_id - Citizen user ID
 * @param {string} feedbackData.institution_id - Institution ID
 * @param {string} feedbackData.service_id - Service ID
 * @param {number} feedbackData.rating - Rating (1-5)
 * @param {string} [feedbackData.application_id] - Optional application ID
 * @param {string} [feedbackData.queue_entry_id] - Optional queue entry ID
 * @param {string} [feedbackData.comment] - Optional comment
 * @param {string} [feedbackData.source] - Source: 'WEBSITE' or 'TELEGRAM'
 * @returns {Promise<Object>} Created feedback
 */
export async function submitFeedback(feedbackData) {
  try {
    console.log('=== submitFeedback called ===');
    console.log('feedbackData:', JSON.stringify(feedbackData, null, 2));

    // Validate rating
    if (!feedbackData.rating || feedbackData.rating < 1 || feedbackData.rating > 5) {
      console.error('Invalid rating:', feedbackData.rating);
      throw new Error('Rating must be between 1 and 5');
    }

    // Ensure rating is an integer
    const rating = Math.floor(Number(feedbackData.rating));
    if (rating < 1 || rating > 5) {
      console.error('Rating out of range after conversion:', rating);
      throw new Error('Rating must be an integer between 1 and 5');
    }

    console.log('Checking citizen...');
    // Verify citizen exists and is active
    const { data: citizen, error: citizenError } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('id', feedbackData.citizen_id)
      .eq('role', 'CITIZEN')
      .maybeSingle();

    if (citizenError) {
      console.error('Citizen query error:', citizenError);
      throw new Error(`Database error checking citizen: ${citizenError.message}`);
    }

    if (!citizen) {
      console.error('Citizen not found:', feedbackData.citizen_id);
      throw new Error('Citizen not found');
    }

    if (citizen.status !== 'ACTIVE') {
      console.error('Citizen not active:', citizen.status);
      throw new Error('Citizen account is not active');
    }

    console.log('Checking institution...');
    // Verify institution exists
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id')
      .eq('id', feedbackData.institution_id)
      .maybeSingle();

    if (instError) {
      console.error('Institution query error:', instError);
      throw new Error(`Database error checking institution: ${instError.message}`);
    }

    if (!institution) {
      console.error('Institution not found:', feedbackData.institution_id);
      throw new Error('Institution not found');
    }

    console.log('Checking service...');
    // Verify service exists and belongs to institution
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, institution_id')
      .eq('id', feedbackData.service_id)
      .maybeSingle();

    if (serviceError) {
      console.error('Service query error:', serviceError);
      throw new Error(`Database error checking service: ${serviceError.message}`);
    }

    if (!service) {
      console.error('Service not found:', feedbackData.service_id);
      throw new Error('Service not found');
    }

    if (service.institution_id !== feedbackData.institution_id) {
      console.error('Service institution mismatch:', {
        serviceInstitution: service.institution_id,
        providedInstitution: feedbackData.institution_id
      });
      throw new Error('Service does not belong to the specified institution');
    }

    console.log('Checking for duplicates...');
    // Check for duplicate feedback based on application_id or queue_entry_id
    let duplicateQuery = supabase
      .from('service_feedback')
      .select('id')
      .eq('citizen_id', feedbackData.citizen_id)
      .eq('service_id', feedbackData.service_id);

    if (feedbackData.application_id) {
      duplicateQuery = duplicateQuery.eq('application_id', feedbackData.application_id);
    } else if (feedbackData.queue_entry_id) {
      duplicateQuery = duplicateQuery.eq('queue_entry_id', feedbackData.queue_entry_id);
    } else {
      // If neither application nor queue entry is specified, 
      // check if feedback already exists for this citizen-service combination
      const { data: generalFeedback, error: generalError } = await supabase
        .from('service_feedback')
        .select('id')
        .eq('citizen_id', feedbackData.citizen_id)
        .eq('service_id', feedbackData.service_id)
        .is('application_id', null)
        .is('queue_entry_id', null)
        .maybeSingle();

      if (generalError && generalError.code !== 'PGRST116') {
        console.error('Error checking for general feedback:', generalError);
        throw new Error('Failed to check for existing feedback');
      }

      if (generalFeedback) {
        console.error('General feedback already exists for this service');
        throw new Error('You have already rated this service');
      }
    }

    const { data: existingFeedback, error: duplicateError } = await duplicateQuery.maybeSingle();

    // Ignore "no rows" error (PGRST116) - it means no duplicate exists, which is good
    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('Error checking for duplicate feedback:', duplicateError);
      throw new Error('Failed to check for existing feedback');
    }

    if (existingFeedback) {
      console.error('Duplicate feedback found:', existingFeedback.id);
      throw new Error('You have already rated this service');
    }

    console.log('Inserting feedback...');
    // Create feedback
    const { data: feedback, error: insertError } = await supabase
      .from('service_feedback')
      .insert({
        citizen_id: feedbackData.citizen_id,
        institution_id: feedbackData.institution_id,
        service_id: feedbackData.service_id,
        application_id: feedbackData.application_id || null,
        queue_entry_id: feedbackData.queue_entry_id || null,
        rating: rating,
        comment: feedbackData.comment || null,
        source: feedbackData.source || 'WEBSITE'
      })
      .select(`
        id,
        citizen_id,
        institution_id,
        service_id,
        application_id,
        queue_entry_id,
        rating,
        comment,
        source,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      throw new Error(`Failed to submit feedback: ${insertError.message}`);
    }

    console.log('Feedback created successfully:', feedback.id);
    return feedback;
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    throw error;
  }
}

/**
 * Get feedback for a citizen
 * @param {string} citizenId - Citizen user ID
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<Array>} List of feedback
 */
export async function getCitizenFeedback(citizenId, filters = {}) {
  try {
    let query = supabase
      .from('service_feedback')
      .select(`
        id,
        rating,
        comment,
        source,
        created_at,
        institutions:institution_id(id, name_en, name_am),
        services:service_id(id, title_en, title_am),
        applications:application_id(id, application_number),
        queue_entries:queue_entry_id(id, queue_number)
      `)
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }
    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching citizen feedback:', error);
      throw new Error('Failed to fetch feedback');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCitizenFeedback:', error);
    throw error;
  }
}

/**
 * Get feedback for an institution
 * @param {string} institutionId - Institution ID
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<Array>} List of feedback
 */
export async function getInstitutionFeedback(institutionId, filters = {}) {
  try {
    let query = supabase
      .from('service_feedback')
      .select(`
        id,
        rating,
        comment,
        source,
        created_at,
        services:service_id(id, title_en, title_am),
        applications:application_id(id, application_number),
        queue_entries:queue_entry_id(id, queue_number)
      `)
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }
    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching institution feedback:', error);
      throw new Error('Failed to fetch feedback');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getInstitutionFeedback:', error);
    throw error;
  }
}

/**
 * Get all feedback (for MESOB Manager and Super Admin)
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<Array>} List of feedback
 */
export async function getAllFeedback(filters = {}) {
  try {
    let query = supabase
      .from('service_feedback')
      .select(`
        id,
        rating,
        comment,
        source,
        created_at,
        institutions:institution_id(id, name_en, name_am),
        services:service_id(id, title_en, title_am),
        applications:application_id(id, application_number),
        queue_entries:queue_entry_id(id, queue_number)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }
    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all feedback:', error);
      throw new Error('Failed to fetch feedback');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    throw error;
  }
}

/**
 * Get feedback statistics for an institution
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Object>} Feedback statistics
 */
export async function getInstitutionFeedbackStats(institutionId) {
  try {
    const { data, error } = await supabase
      .from('service_feedback')
      .select('rating')
      .eq('institution_id', institutionId);

    if (error) {
      console.error('Error fetching feedback stats:', error);
      throw new Error('Failed to fetch feedback statistics');
    }

    // Calculate statistics
    const total = data.length;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    data.forEach(feedback => {
      ratingCounts[feedback.rating]++;
      sum += feedback.rating;
    });

    const average = total > 0 ? (sum / total).toFixed(2) : 0;

    return {
      total,
      average: parseFloat(average),
      ratingCounts,
      distribution: {
        poor: ratingCounts[1],      // 1 star
        good: ratingCounts[2],      // 2 stars
        veryGood: ratingCounts[3],  // 3 stars
        excellent: ratingCounts[4], // 4 stars
        fantastic: ratingCounts[5]  // 5 stars
      }
    };
  } catch (error) {
    console.error('Error in getInstitutionFeedbackStats:', error);
    throw error;
  }
}

/**
 * Get overall feedback statistics (for MESOB Manager)
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<Object>} Overall statistics
 */
export async function getOverallFeedbackStats(filters = {}) {
  try {
    let query = supabase
      .from('service_feedback')
      .select('rating, institution_id, service_id');

    // Apply filters
    if (filters.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching overall stats:', error);
      throw new Error('Failed to fetch overall statistics');
    }

    // Calculate statistics
    const total = data.length;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    data.forEach(feedback => {
      ratingCounts[feedback.rating]++;
      sum += feedback.rating;
    });

    const average = total > 0 ? (sum / total).toFixed(2) : 0;

    return {
      total,
      average: parseFloat(average),
      ratingCounts,
      distribution: {
        poor: ratingCounts[1],      // 1 star
        good: ratingCounts[2],      // 2 stars
        veryGood: ratingCounts[3],  // 3 stars
        excellent: ratingCounts[4], // 4 stars
        fantastic: ratingCounts[5]  // 5 stars
      }
    };
  } catch (error) {
    console.error('Error in getOverallFeedbackStats:', error);
    throw error;
  }
}

/**
 * Check if citizen can submit feedback for a specific interaction
 * @param {string} citizenId - Citizen user ID
 * @param {string} [applicationId] - Application ID
 * @param {string} [queueEntryId] - Queue entry ID
 * @returns {Promise<boolean>} True if can submit, false if already submitted
 */
export async function canSubmitFeedback(citizenId, applicationId = null, queueEntryId = null) {
  try {
    let query = supabase
      .from('service_feedback')
      .select('id')
      .eq('citizen_id', citizenId);

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    } else if (queueEntryId) {
      query = query.eq('queue_entry_id', queueEntryId);
    } else {
      // If no application or queue entry specified, can submit
      return true;
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking feedback:', error);
      throw new Error('Failed to check feedback eligibility');
    }

    // If data exists, feedback already submitted
    return !data;
  } catch (error) {
    console.error('Error in canSubmitFeedback:', error);
    throw error;
  }
}

export default {
  submitFeedback,
  getCitizenFeedback,
  getInstitutionFeedback,
  getAllFeedback,
  getInstitutionFeedbackStats,
  getOverallFeedbackStats,
  canSubmitFeedback
};
