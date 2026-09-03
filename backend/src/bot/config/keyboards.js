/**
 * Telegram inline keyboards for Hawassa MESOB Bot
 */

import { LANGUAGE_NAMES } from './languages.js';

/**
 * Language selection keyboard
 */
export const getLanguageKeyboard = () => ({
  inline_keyboard: [
    [
      { text: '🇬🇧 English', callback_data: 'lang_en' },
      { text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }
    ]
  ]
});

/**
 * Main menu keyboard (English)
 */
export const getMainMenuKeyboard = (lang = 'en') => {
  if (lang === 'am') {
    return {
      inline_keyboard: [
        [{ text: '1️⃣ የአገልግሎት መስፈርቶች', callback_data: 'menu_requirements' }],
        [{ text: '2️⃣ የወረፋ አስተዳደር', callback_data: 'menu_queue' }],
        [{ text: '3️⃣ የማመልከቻ ክትትል', callback_data: 'menu_applications' }],
        [{ text: '4️⃣ የጥገና ሪፖርት', callback_data: 'menu_maintenance' }],
        [{ text: '5️⃣ የተግባር ምደባ', callback_data: 'menu_tasks' }],
        [{ text: '6️⃣ ማስታወቂያዎች', callback_data: 'menu_announcements' }],
        [{ text: '⚙️ ቅንብሮች', callback_data: 'menu_settings' }],
        [{ text: '❓ እገዛ', callback_data: 'menu_help' }]
      ]
    };
  }
  
  return {
    inline_keyboard: [
      [{ text: '1️⃣ Service Requirements', callback_data: 'menu_requirements' }],
      [{ text: '2️⃣ Queue Management', callback_data: 'menu_queue' }],
      [{ text: '3️⃣ Application Tracking', callback_data: 'menu_applications' }],
      [{ text: '4️⃣ Maintenance Report', callback_data: 'menu_maintenance' }],
      [{ text: '5️⃣ Task Assignment', callback_data: 'menu_tasks' }],
      [{ text: '6️⃣ Announcements', callback_data: 'menu_announcements' }],
      [{ text: '⚙️ Settings', callback_data: 'menu_settings' }],
      [{ text: '❓ Help', callback_data: 'menu_help' }]
    ]
  };
};

/**
 * Back to main menu keyboard
 */
export const getBackKeyboard = (lang = 'en') => ({
  inline_keyboard: [
    [{ 
      text: lang === 'am' ? '🔙 ወደ ዋና ምናሌ' : '🔙 Back to Main Menu', 
      callback_data: 'back_to_menu' 
    }]
  ]
});

/**
 * Cancel keyboard
 */
export const getCancelKeyboard = (lang = 'en') => ({
  inline_keyboard: [
    [{ 
      text: lang === 'am' ? '❌ ሰርዝ' : '❌ Cancel', 
      callback_data: 'cancel' 
    }]
  ]
});

/**
 * Feedback rating keyboard (5-star rating)
 */
export const getFeedbackRatingKeyboard = (lang = 'en') => {
  if (lang === 'am') {
    return {
      inline_keyboard: [
        [{ text: '⭐ 1/5 — ደካማ (Poor)', callback_data: 'feedback_1' }],
        [{ text: '⭐⭐ 2/5 — ጥሩ (Good)', callback_data: 'feedback_2' }],
        [{ text: '⭐⭐⭐ 3/5 — በጣም ጥሩ (Very Good)', callback_data: 'feedback_3' }],
        [{ text: '⭐⭐⭐⭐ 4/5 — ምርጥ (Excellent)', callback_data: 'feedback_4' }],
        [{ text: '⭐⭐⭐⭐⭐ 5/5 — አስደናቂ (Fantastic)', callback_data: 'feedback_5' }]
      ]
    };
  }

  return {
    inline_keyboard: [
      [{ text: '⭐ 1/5 — Poor', callback_data: 'feedback_1' }],
      [{ text: '⭐⭐ 2/5 — Good', callback_data: 'feedback_2' }],
      [{ text: '⭐⭐⭐ 3/5 — Very Good', callback_data: 'feedback_3' }],
      [{ text: '⭐⭐⭐⭐ 4/5 — Excellent', callback_data: 'feedback_4' }],
      [{ text: '⭐⭐⭐⭐⭐ 5/5 — Fantastic', callback_data: 'feedback_5' }]
    ]
  };
};

/**
 * Settings keyboard
 */
export const getSettingsKeyboard = (lang = 'en') => {
  if (lang === 'am') {
    return {
      inline_keyboard: [
        [{ text: '🌐 ቋንቋ ቀይር', callback_data: 'settings_language' }],
        [{ text: '🔔 ማሳወቂያ ቅንብሮች', callback_data: 'settings_notifications' }],
        [{ text: '🔙 ተመለስ', callback_data: 'back_to_menu' }]
      ]
    };
  }
  
  return {
    inline_keyboard: [
      [{ text: '🌐 Change Language', callback_data: 'settings_language' }],
      [{ text: '🔔 Notification Settings', callback_data: 'settings_notifications' }],
      [{ text: '🔙 Back', callback_data: 'back_to_menu' }]
    ]
  };
};

export default {
  getLanguageKeyboard,
  getMainMenuKeyboard,
  getBackKeyboard,
  getCancelKeyboard,
  getFeedbackRatingKeyboard,
  getSettingsKeyboard
};
