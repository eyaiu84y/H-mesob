/**
 * Feedback Trigger Service
 * Listens for service completions and triggers feedback prompts via Telegram
 */

import { supabase } from '../../config/supabase.js';
import { promptForFeedback } from '../handlers/feedbackHandler.js';

/**
 * Setup feedback triggers using Supabase realtime
 * Listens for application and queue completions
 */
export async function setupFeedbackTriggers(bot) {
  console.log('🔧 Setting up feedback triggers...');

  // Listen for application completions
  const applicationChannel = supabase
    .channel('application_completions')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'applications',
      filter: 'status=eq.Completed'
    }, async (payload) => {
      console.log('📋 Application completed:', payload.new.id);
      await handleServiceCompletion(bot, {
        type: 'application',
        ...payload.new
      });
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Application completion listener active');
      }
    });

  // Listen for queue completions
  const queueChannel = supabase
    .channel('queue_completions')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'queue_entries',
      filter: 'status=eq.Completed'
    }, async (payload) => {
      console.log('🎫 Queue entry completed:', payload.new.id);
      await handleServiceCompletion(bot, {
        type: 'queue',
        ...payload.new
      });
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Queue completion listener active');
      }
    });

  console.log('✅ Feedback triggers setup complete');

  return {
    applicationChannel,
    queueChannel
  };
}

/**
 * Handle service completion and trigger feedback prompt
 */
async function handleServiceCompletion(bot, completionData) {
  try {
    const { type, citizen_id, institution_id, service_id, id } = completionData;

    // Get telegram user info
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('telegram_chat_id, language')
      .eq('user_id', citizen_id)
      .single();

    if (telegramError || !telegramUser) {
      console.log(`ℹ️ Citizen ${citizen_id} not linked to Telegram, skipping feedback prompt`);
      return;
    }

    // Get institution name
    const { data: institution } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', institution_id)
      .single();

    // Get service name
    const { data: service } = await supabase
      .from('services')
      .select('name')
      .eq('id', service_id)
      .single();

    // Check if feedback already submitted
    const { data: existingFeedback } = await supabase
      .from('service_feedback')
      .select('id')
      .eq('citizen_id', citizen_id)
      .eq(type === 'application' ? 'application_id' : 'queue_entry_id', id)
      .maybeSingle();

    if (existingFeedback) {
      console.log(`ℹ️ Feedback already submitted for ${type} ${id}, skipping prompt`);
      return;
    }

    // Prepare service data for feedback prompt
    const serviceData = {
      institution_id,
      service_id,
      institution_name: institution?.name || 'Unknown Institution',
      service_name: service?.name || 'Unknown Service'
    };

    if (type === 'application') {
      serviceData.application_id = id;
    } else {
      serviceData.queue_entry_id = id;
    }

    // Trigger feedback prompt
    await promptForFeedback(
      bot,
      telegramUser.telegram_chat_id,
      serviceData,
      telegramUser.language || 'en'
    );

    console.log(`✅ Feedback prompt sent to ${telegramUser.telegram_chat_id} for ${type} ${id}`);

  } catch (error) {
    console.error('Error handling service completion:', error);
  }
}

/**
 * Manual trigger for testing
 * Send test feedback prompt to a specific chat
 */
export async function sendTestFeedbackPrompt(bot, chatId, lang = 'en') {
  const testServiceData = {
    institution_id: 'test-institution-id',
    service_id: 'test-service-id',
    institution_name: 'Test Institution',
    service_name: 'Test Service',
    application_id: 'test-application-' + Date.now()
  };

  await promptForFeedback(bot, chatId, testServiceData, lang);
  console.log(`✅ Test feedback prompt sent to ${chatId}`);
}

export default {
  setupFeedbackTriggers,
  sendTestFeedbackPrompt
};
