/**
 * Error handler
 * Global error handling for bot
 * IMPORTANT: Never expose secrets, credentials, or stack traces to users
 */

/**
 * Setup error handlers
 */
export const setupErrorHandlers = (bot) => {
  // Handle polling errors
  bot.on('polling_error', (error) => {
    // Don't log full error (may contain sensitive data)
    console.error('❌ Polling error:', error.message);
    
    // Common polling errors
    if (error.message.includes('ETELEGRAM') || error.message.includes('401')) {
      console.error('⚠️  Bot token may be invalid or revoked');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.error('⚠️  Network connection issue');
    }
  });

  // Handle webhook errors (if webhook mode is used in future)
  bot.on('webhook_error', (error) => {
    console.error('❌ Webhook error:', error.message);
  });

  // Handle general errors
  bot.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
  });

  console.log('✅ Error handlers registered');
};

/**
 * Send user-friendly error message
 * Never expose technical details or secrets
 */
export const sendErrorMessage = async (bot, chatId, lang = 'en') => {
  const message = lang === 'am'
    ? '❌ ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።'
    : '❌ An error occurred. Please try again.';

  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    // If sending error message fails, just log it
    console.error('Failed to send error message:', error.message);
  }
};

export default setupErrorHandlers;
