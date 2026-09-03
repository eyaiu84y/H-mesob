/**
 * Supported languages for Hawassa MESOB Telegram Bot
 * Matches frontend language support (en, am)
 */

export const SUPPORTED_LANGUAGES = ['en', 'am'];

export const LANGUAGE_NAMES = {
  en: 'English',
  am: 'አማርኛ (Amharic)'
};

export const messages = {
  en: {
    // Welcome & Start
    welcome: '👋 Welcome to Hawassa MESOB!\n\n' +
             'Your gateway to efficient government services in Hawassa City.\n\n' +
             'Please select your preferred language:',
    
    languageSelected: '✅ Language set to English',
    
    // Main Menu
    mainMenu: '📋 *Main Menu*\n\n' +
              'Choose a service:\n\n' +
              '1️⃣ Service Requirements\n' +
              '2️⃣ Queue Management\n' +
              '3️⃣ Application Tracking\n' +
              '4️⃣ Maintenance Report\n' +
              '5️⃣ Task Assignment\n' +
              '6️⃣ Announcements & Notifications',
    
    // Navigation
    backToMenu: '🔙 Back to Main Menu',
    cancelled: '❌ Operation cancelled',
    
    // Errors
    error: '❌ An error occurred. Please try again.',
    unauthorized: '🔒 You are not authorized to access this feature.',
    notLinked: '🔗 Please link your account first.\n\nVisit the web app to link your Telegram account.',
    invalidInput: '⚠️ Invalid input. Please try again.',
    serviceUnavailable: '⚠️ Service temporarily unavailable. Please try again later.',
    
    // Coming Soon
    comingSoon: '🚧 This feature is coming soon!\n\nWe are actively working on implementing this functionality.',
    
    // Help
    help: '*Hawassa MESOB Bot Help*\n\n' +
          '*Available Commands:*\n' +
          '/start - Start the bot and show main menu\n' +
          '/menu - Show main menu\n' +
          '/language - Change language\n' +
          '/help - Show this help message\n\n' +
          '*Need assistance?*\n' +
          'Contact Hawassa MESOB support.'
  },
  
  am: {
    // Welcome & Start
    welcome: '👋 እንኳን ወደ ሀዋሳ MESOB በደህና መጡ!\n\n' +
             'በሀዋሳ ከተማ ውስጥ ቀልጣፋ የመንግስት አገልግሎቶች በር።\n\n' +
             'እባክዎ የሚመርጡትን ቋንቋ ይምረጡ:',
    
    languageSelected: '✅ ቋንቋ ወደ አማርኛ ተቀይሯል',
    
    // Main Menu
    mainMenu: '📋 *ዋና ምናሌ*\n\n' +
              'አገልግሎት ይምረጡ:\n\n' +
              '1️⃣ የአገልግሎት መስፈርቶች\n' +
              '2️⃣ የወረፋ አስተዳደር\n' +
              '3️⃣ የማመልከቻ ክትትል\n' +
              '4️⃣ የጥገና ሪፖርት\n' +
              '5️⃣ የተግባር ምደባ\n' +
              '6️⃣ ማስታወቂያዎች እና ማሳወቂያዎች',
    
    // Navigation
    backToMenu: '🔙 ወደ ዋና ምናሌ ተመለስ',
    cancelled: '❌ ተግባር ተሰርዟል',
    
    // Errors
    error: '❌ ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።',
    unauthorized: '🔒 ይህን ባህሪ ለመጠቀም ፍቃድ የለዎትም።',
    notLinked: '🔗 እባክዎ መጀመሪያ መለያዎን ያገናኙ።\n\nየቴሌግራም መለያዎን ለማገናኘት የድር መተግበሪያውን ይጎብኙ።',
    invalidInput: '⚠️ ልክ ያልሆነ ግቤት። እባክዎ እንደገና ይሞክሩ።',
    serviceUnavailable: '⚠️ አገልግሎቱ ለጊዜው አይገኝም። እባክዎ ቆም ብለው ይሞክሩ።',
    
    // Coming Soon
    comingSoon: '🚧 ይህ ባህሪ በቅርቡ ይመጣል!\n\nይህንን ተግባር ለመተግበር በንቃት እየሰራን ነው።',
    
    // Help
    help: '*የሀዋሳ MESOB ቦት እገዛ*\n\n' +
          '*የሚገኙ ትዕዛዞች:*\n' +
          '/start - ቦቱን ይጀምሩ እና ዋና ምናሌን ያሳዩ\n' +
          '/menu - ዋና ምናሌን አሳይ\n' +
          '/language - ቋንቋ ቀይር\n' +
          '/help - ይህን የእገዛ መልእክት አሳይ\n\n' +
          '*እገዛ ይፈልጋሉ?*\n' +
          'የሀዋሳ MESOB ድጋፍን ያነጋግሩ።'
  }
};

/**
 * Get message in specified language
 */
export const getMessage = (lang, key) => {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  return messages[language][key] || messages.en[key] || '';
};

export default { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, messages, getMessage };
