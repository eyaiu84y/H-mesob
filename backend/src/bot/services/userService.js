/**
 * Telegram User Service
 * Manages telegram_users table and user preferences
 * Connects to existing backend database
 */

import { supabase } from '../../config/supabase.js';

/**
 * Get or create telegram user session
 * @param {number} chatId - Telegram chat ID
 * @param {string} username - Telegram username
 * @returns {Promise<Object>} User session data
 */
export const getTelegramUser = async (chatId, username = null) => {
  try {
    // Query telegram_users table
    const { data, error } = await supabase
      .from('telegram_users')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name,
          role,
          status,
          institution_id
        )
      `)
      .eq('telegram_chat_id', chatId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user not linked)
      console.error('Error fetching telegram user:', error);
      return { success: false, linked: false };
    }

    if (!data) {
      // User not linked yet
      return { success: true, linked: false, chatId, username };
    }

    // Update last interaction
    await supabase
      .from('telegram_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('telegram_chat_id', chatId);

    return {
      success: true,
      linked: true,
      telegramUser: data,
      user: data.users,
      language: data.language || 'en',
      notificationsEnabled: data.notifications_enabled
    };

  } catch (error) {
    console.error('Get telegram user error:', error);
    return { success: false, linked: false, error: error.message };
  }
};

/**
 * Get user language preference
 * @param {number} chatId - Telegram chat ID
 * @returns {Promise<string>} Language code (en/am)
 */
export const getUserLanguage = async (chatId) => {
  try {
    const { data } = await supabase
      .from('telegram_users')
      .select('language')
      .eq('telegram_chat_id', chatId)
      .eq('is_active', true)
      .single();

    return data?.language || 'en';
  } catch (error) {
    return 'en'; // Default to English
  }
};

/**
 * Set user language preference
 * @param {number} chatId - Telegram chat ID
 * @param {string} language - Language code (en/am)
 * @returns {Promise<Object>} Result
 */
export const setUserLanguage = async (chatId, language) => {
  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('telegram_users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from('telegram_users')
        .update({ language, last_interaction_at: new Date().toISOString() })
        .eq('telegram_chat_id', chatId);

      if (error) {
        console.error('Error updating language:', error);
        return { success: false };
      }

      return { success: true, language };
    } else {
      // Store language preference temporarily (in metadata)
      // User will link account later
      return { success: true, language, temporary: true };
    }

  } catch (error) {
    console.error('Set language error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user state (for conversation flow)
 * Stores temporary state in memory (can be moved to Redis in production)
 */
const userStates = new Map();

export const getUserState = (chatId) => {
  return userStates.get(chatId) || { 
    language: 'en',
    context: null,
    data: {}
  };
};

export const setUserState = (chatId, state) => {
  userStates.set(chatId, { 
    ...getUserState(chatId), 
    ...state,
    updatedAt: Date.now()
  });
};

export const clearUserState = (chatId) => {
  userStates.delete(chatId);
};

// Clean up old states every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [chatId, state] of userStates.entries()) {
    if (state.updatedAt && state.updatedAt < oneHourAgo) {
      userStates.delete(chatId);
    }
  }
}, 60 * 60 * 1000);

export default {
  getTelegramUser,
  getUserLanguage,
  setUserLanguage,
  getUserState,
  setUserState,
  clearUserState
};
