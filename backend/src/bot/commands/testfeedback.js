/**
 * Test Feedback Command
 * Allows testing feedback flow without waiting for real service completion
 */

import { getUserState } from '../services/userService.js';
import { sendTestFeedbackPrompt } from '../services/feedbackTriggerService.js';

/**
 * Handle /testfeedback command
 * Sends a test feedback prompt
 */
export const handleTestFeedback = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    // Send test feedback prompt
    await sendTestFeedbackPrompt(bot, chatId, lang);

  } catch (error) {
    console.error('Test feedback error:', error);
    const errorMessage = lang === 'am'
      ? '❌ የሙከራ ግምገማ መላክ አልተቻለም'
      : '❌ Failed to send test feedback';
    
    await bot.sendMessage(chatId, errorMessage);
  }
};

export default handleTestFeedback;
