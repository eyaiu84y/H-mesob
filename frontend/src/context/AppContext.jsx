/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; }
    catch { return false; }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  function toggleTheme() { setIsDark((p) => !p); }

  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en'; }
    catch { return 'en'; }
  });

  function switchLang(code) {
    setLang(code);
    try { localStorage.setItem('lang', code); } catch {
      // Ignore localStorage errors
    }
  }

  const t = translations[lang] || translations.en;

  return (
    <AppContext.Provider value={{ isDark, toggleTheme, lang, switchLang, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

// ─────────────────────────────────────────────────────────────────
// Translation constants extracted to avoid react-refresh warnings
export const translations = {
  en: {
    // nav
    nav_home: 'Home',
    nav_about: 'About Us',
    nav_organizations: 'Organizations',
    nav_news: 'News',
    nav_popular: 'Popular Services',
    nav_address: 'Address',
    nav_contact: 'Contact',
    nav_login: 'Login',

    // hero
    hero_title: 'HAWASSA MESOB SERVICE',
    hero_subtitle: 'Modern Ethiopian Services for Organized Benefit.',
    hero_desc: '47+ government services in one MESOB to make life simpler for you.',
    hero_search: 'Search for Services and Institutions',

    // about
    about_heading1: 'Serving Our',
    about_heading2: 'Community',
    about_heading3: 'with Excellence',
    about_body: 'In one Mesob Center, we bring together essential government services, resources, and information into one seamless digital platform. Whether you are applying for permits, accessing public records, or exploring social services, our citizen-first hub is designed to make your experience faster, easier, and more transparent.',
    about_btn1: 'Explore Services',
    about_btn2: 'Learn More',
    about_card1_title: 'Digital Services',
    about_card1_desc: 'Apply for permits online',
    about_card2_title: 'Citizen Support',
    about_card2_desc: '24/7',
    about_card3_title: 'Quick Processing',
    about_card3_desc: 'Fast and efficient service',

    // organizations
    org_title: 'SERVICE PROVIDER ORGANIZATIONS',
    org_subtitle: 'Select an institution to view services, documents, fees, and processing time',
    org_btn: 'Services',
    org_modal_suffix: '– Services',
    org_time_label: 'Processing Time',
    org_fee_label: 'Service Fee',
    org_docs_label: 'Documents Required',
    org_official: 'Official page',

    // news
    news_title: 'Latest News',
    news_subtitle: 'Government updates and announcements',
    news_placeholder: 'Select a news article from the left to read',
    news_back: '← Back to News',
    news_read: 'min read',
    // news items
    news1_category: 'Government',
    news1_title: 'MESOB Center Inauguration 2025',
    news1_preview: 'Ethiopia Celebrates the Inauguration of the MESOB Center...',
    news1_source: 'MESOB Communications',
    news2_category: 'Government',
    news2_title: 'Leadership Introduction Program 2026',
    news2_preview: 'HAWASSA-MESOB Service launches new leadership program...',
    news2_source: 'Government',
    news3_category: 'Government',
    news3_title: 'HAWASSA-MESOB Service Achieves 98.7% Citizen Satisfaction',
    news3_preview: 'Outstanding performance in citizen satisfaction survey...',
    news3_source: 'Government',

    // videos
    videos_title: 'MESOB Services',
    videos_subtitle: 'Featured videos and highlights',
    video1_title: 'MESOB Center Overview',
    video1_desc: 'Learn about the services',
    video2_title: 'How to Use MESOB',
    video2_desc: 'Step-by-step guide',
    video3_title: 'Sidama MESOB',
    video3_desc: 'Sidama MESOB Center',
    video4_title: 'Services Guide',
    video4_desc: 'Available government services',

    // popular services
    pop_title: 'Popular Services',
    pop_subtitle: 'Access the most requested government services quickly and easily',
    pop_search: 'Search services (e.g. National ID, Passport...)',
    pop_time: 'Processing Time',
    pop_fee: 'Fee',
    pop_apply: 'Apply Now',
    // popular service items
    svc1_title: 'National ID Registration',
    svc1_org: 'National ID Program (NID)',
    svc2_title: 'Business License',
    svc2_org: 'Ministry of Trade',
    svc3_title: 'Tax Clearance',
    svc3_org: 'Ministry of Revenues',
    svc4_title: 'SIM Card Registration',
    svc4_org: 'Ethio Telecom',

    // government services section
    gov_title: 'Government Services',
    gov_subtitle: 'Access government services quickly through our integrated digital platform, designed for citizens, international customers, and businesses.',
    gov_tag: 'OUR SERVICES',
    gov_card1_title: 'Local Customers',
    gov_card1_items: [
      '2-Day Urgent Passport Renewal',
      '5-Day Passport Renewal',
      'Lost Passport Replacement',
      'Damaged Passport Renewal',
    ],
    gov_card2_title: 'International & Diaspora',
    gov_card2_items: [
      'Temporary Residence Permit',
      'Permanent Residence Card',
      'Investment Visa',
      'Ethiopian Origin ID Card',
    ],
    gov_card3_title: 'Business Services',
    gov_card3_items: [
      'Trade Document Authentication',
      'Expatriate Work Permits',
      'Investment & Work Visas',
      'Educational Document Verification',
    ],
    gov_view_all: 'View All Services',
    // government service page extras
    gov_why_title: 'Why Choose MESOB?',
    gov_why_body: 'MESOB Center brings all essential government services under one roof, eliminating the need to visit multiple offices. Save time, reduce hassle, and get your documents processed faster than ever.',
    gov_stat1_label: 'Fast Processing',
    gov_stat1_desc: 'Same-day to 5-day service',
    gov_stat2_label: 'One Location',
    gov_stat2_desc: 'All services in one place',
    gov_stat3_label: 'Secure & Official',
    gov_stat3_desc: 'Government certified',
    gov_browse_btn: 'Browse Service Catalogue',
    gov_back_btn: 'Back to Home',

    // service catalogue page
    cat_title: 'Service Catalogue',
    cat_subtitle: 'Browse all services from every institution in one place',
    cat_search_ph: 'Search service or institution...',
    cat_no_results: 'No results found for',
    cat_service: 'service',
    cat_services: 'services',
    cat_back: 'Back to Home',

    // address
    addr_title: 'HAWASSA-MESOB',
    addr_place: 'Hawassa MESOB',
    addr_street: 'Behind Saint Gebriel Church Hawassa, infront of immigration',
    addr_city: 'Hawassa, Ethiopia',
    addr_phone_label: 'Phone',
    addr_hours_label: 'Working Hours',
    addr_hours1: 'Monday - Friday: 8:30 AM - 5:30 PM',
    addr_hours2: 'Saturday: 8:30 AM - 12:30 PM',
    addr_directions: 'Get Directions on Google Maps →',

    // contact
    contact_title: 'Send Us a Message',
    contact_desc: 'Have any questions or need assistance? Feel free to send us a message. Our team will get back to you as soon as possible.',
    contact_email_label: 'Email',
    contact_phone_label: 'Phone',
    contact_name: 'Full Name',
    contact_name_ph: 'e.g abebe kebede',
    contact_tel: 'Phone Number',
    contact_tel_ph: '09xxxxxxxx',
    contact_email: 'Email Address',
    contact_email_ph: 'e.g. abebe@gmail.com',
    contact_subject: 'Subject',
    contact_subject_ph: 'e.g. Passport Inquiry, Service Information ...',
    contact_message: 'Your Message',
    contact_message_ph: 'Write your message here...',
    contact_send: 'Send Message',
    contact_success: '✅ Thank you! Your message has been sent successfully.\n\nWe will reply to you soon.',

    // footer
    footer_tagline: 'The New Horizon of Service!',
    footer_bilingual: 'የሃዋሳ መሶብ አገልግሎት  |  Hawassa Mesob Service',
    footer_desc: 'Bringing government services closer to you.',
    footer_quick: 'Quick Links',
    footer_links: 'Quick Links',
    footer_services: 'Services',
    footer_support: 'Support',
    footer_help: 'Help Center',
    footer_faq: 'FAQ',
    footer_privacy: 'Privacy Policy',
    footer_contact: 'Contact',
    footer_copy: '© 2026 HAWASSA MESOB. All rights reserved.',
  },

  am: {
    // nav
    nav_home: 'መነሻ',
    nav_about: 'ስለ እኛ',
    nav_organizations: 'ድርጅቶች',
    nav_news: 'ዜና',
    nav_popular: 'ታዋቂ አገልግሎቶች',
    nav_address: 'አድራሻ',
    nav_contact: 'ያግኙን',
    nav_login: 'ግባ',

    // hero
    hero_title: 'የሃዋሳ መሶብ አገልግሎት',
    hero_subtitle: 'ዘመናዊ የኢትዮጵያ አገልግሎቶች ለተደራጀ ጥቅም።',
    hero_desc: '12+ የመንግሥት አገልግሎቶች በአንድ መሶብ ህይወትዎን ቀለል ለማድረግ።',
    hero_search: 'አገልግሎቶችን እና ድርጅቶችን ይፈልጉ',

    // about
    about_heading1: 'ማህበረሰባችንን',
    about_heading2: 'በብቃት',
    about_heading3: 'እናገለግላለን',
    about_body: 'በአንድ የመሶብ ማዕከል ውስጥ፣ አስፈላጊ የሆኑ የመንግሥት አገልግሎቶችን፣ ሀብቶችን እና መረጃዎችን ወደ አንድ ፕላትፎርም አዋህደናል። ፈቃዶችን ለማውጣት፣ የህዝብ መዝገቦችን ለማግኘት ወይም ማህበራዊ አገልግሎቶችን ለመጠቀም፣ ዜጋ ማዕከላዊ ፕላትፎርማችን ልምድዎን ፈጣን፣ ቀላል እና ግልፅ ያደርጋል።',
    about_btn1: 'አገልግሎቶችን ይመልከቱ',
    about_btn2: 'ተጨማሪ ይወቁ',
    about_card1_title: 'ዲጂታል አገልግሎቶች',
    about_card1_desc: 'ፈቃዶችን በኦንላይን ያመልክቱ',
    about_card2_title: 'የዜጎች ድጋፍ',
    about_card2_desc: '24/7',
    about_card3_title: 'ፈጣን ሂደት',
    about_card3_desc: 'ፈጣን እና ቀልጣፋ አገልግሎት',

    // organizations
    org_title: 'አገልግሎት ሰጪ ድርጅቶች',
    org_subtitle: 'አገልግሎቶችን፣ ሰነዶችን፣ ክፍያዎችን እና የሂደት ጊዜ ለማየት ተቋም ይምረጡ',
    org_btn: 'አገልግሎት',
    org_modal_suffix: '– አገልግሎቶች',
    org_time_label: 'የሂደት ጊዜ',
    org_fee_label: 'አገልግሎት ክፍያ',
    org_docs_label: 'የሚፈለጉ ሰነዶች',
    org_official: 'ኦፊሴላዊ ገፅ',

    // news
    news_title: 'የቅርብ ጊዜ ዜናዎች',
    news_subtitle: 'የመንግሥት ዝማኔዎች እና ማስታወቂያዎች',
    news_placeholder: 'ለማንበብ ከግራ የዜና ጽሑፍ ይምረጡ',
    news_back: '← ወደ ዜናዎች ተመለስ',
    news_read: 'ደቂቃ ንባብ',
    // news items
    news1_category: 'መንግሥት',
    news1_title: 'የመሶብ ማዕከል መመስረቻ 2025',
    news1_preview: 'ኢትዮጵያ የመሶብ ማዕከልን መመስረት ታከብራለች...',
    news1_source: 'የMESOB ኮሙኒኬሽን',
    news2_category: 'መንግሥት',
    news2_title: 'የአመራር ስልጠና ፕሮግራም 2026',
    news2_preview: 'FDRE MESOB አዲስ የአመራር ፕሮግራም ጀምሯል...',
    news2_source: 'መንግሥት',
    news3_category: 'መንግሥት',
    news3_title: 'FDRE MESOB 98.7% የዜጎች እርካታ አሳካ',
    news3_preview: 'በዜጎች እርካታ ዳሰሳ ልዩ ውጤት...',
    news3_source: 'መንግሥት',

    // videos
    videos_title: 'የMESOB አገልግሎቶች',
    videos_subtitle: 'ዋና ዋና ቪዲዮዎች እና ምርጦቹ',
    video1_title: 'የMESOB ማዕከል አጠቃላይ እይታ',
    video1_desc: 'ስለ አገልግሎቶቹ ይወቁ',
    video2_title: 'MESOBን እንዴት መጠቀም እንደሚቻል',
    video2_desc: 'ደረጃ በደረጃ መመሪያ',
    video3_title: 'የሲዳማ MESOB',
    video3_desc: 'የሲዳማ MESOB ማዕከል',
    video4_title: 'የአገልግሎቶች መመሪያ',
    video4_desc: 'ያሉ የመንግሥት አገልግሎቶች',

    // popular services
    pop_title: 'ታዋቂ አገልግሎቶች',
    pop_subtitle: 'በጣም ብዙ የሚጠየቁ የመንግሥት አገልግሎቶችን በፍጥነት ያግኙ',
    pop_search: 'አገልግሎቶችን ይፈልጉ (ለምሳሌ፡ ብሔራዊ መታወቂያ፣ ፓስፖርት...)',
    pop_time: 'የሂደት ጊዜ',
    pop_fee: 'ክፍያ',
    pop_apply: 'አሁን ያመልክቱ',
    // popular service items
    svc1_title: 'ብሔራዊ መታወቂያ ምዝገባ',
    svc1_org: 'የብሔራዊ መታወቂያ ፕሮግራም',
    svc2_title: 'የንግድ ፈቃድ',
    svc2_org: 'የንግድ ሚኒስቴር',
    svc3_title: 'የግብር ማጽጃ',
    svc3_org: 'ገቢዎች ሚኒስቴር',
    svc4_title: 'የሲም ካርድ ምዝገባ',
    svc4_org: 'ኢትዮ ቴሌኮም',

    // government services
    gov_title: 'የመንግሥት አገልግሎቶች',
    gov_subtitle: 'የተዋሃደ ዲጂታል ፕላትፎርማችን በኩል ለዜጎች፣ ለዓለም አቀፍ ደንበኞች እና ለንግድ ድርጅቶች።',
    gov_tag: 'አገልግሎቶቻችን',
    gov_card1_title: 'ለአካባቢ ደንበኞች',
    gov_card1_items: [
      'የ2 ቀን ፈጣን ፓስፖርት ታዛቢ',
      'የ5 ቀን ፓስፖርት ታዛቢ',
      'የጠፋ ፓስፖርት መተካት',
      'የተበላሸ ፓስፖርት ታዛቢ',
    ],
    gov_card2_title: 'ለዓለም አቀፍ እና ዲያስፖራ',
    gov_card2_items: [
      'ጊዜያዊ የመኖሪያ ፈቃድ',
      'ቋሚ የመኖሪያ ካርድ',
      'የኢንቨስትመንት ቪዛ',
      'የኢትዮጵያ ዝርያ መታወቂያ ካርድ',
    ],
    gov_card3_title: 'ለንግድ አገልግሎቶች',
    gov_card3_items: [
      'የንግድ ሰነድ ማረጋገጫ',
      'የወጪ ሠራተኛ ፈቃዶች',
      'የኢንቨስትመንት እና ሥራ ቪዛዎች',
      'የትምህርት ሰነድ ማረጋገጫ',
    ],
    gov_view_all: 'ሁሉንም አገልግሎቶች ይመልከቱ',
    // government service page extras
    gov_why_title: 'ለምን MESOBን ይምረጡ?',
    gov_why_body: 'MESOB ማዕከል ሁሉንም አስፈላጊ የመንግሥት አገልግሎቶች ከአንድ ቦታ ያቀርባል፤ ብዙ ቢሮዎችን መዞር አያስፈልግም። ጊዜ ይቆጥቡ፣ ድካምን ይቀንሱ እና ሰነዶችዎን ከበፊት በፍጥነት ያስሂዱ።',
    gov_stat1_label: 'ፈጣን ሂደት',
    gov_stat1_desc: 'ሁሉን ያካተተ የ1-5 ቀን አገልግሎት',
    gov_stat2_label: 'አንድ ቦታ',
    gov_stat2_desc: 'ሁሉም አገልግሎቶች በአንድ ቦታ',
    gov_stat3_label: 'ደህንነቱ የተጠበቀ ኦፊሴላዊ',
    gov_stat3_desc: 'በመንግሥት የተረጋገጠ',
    gov_browse_btn: 'የአገልግሎት ካታሎግ ይፈልጉ',
    gov_back_btn: 'ወደ መነሻ ተመለስ',

    // service catalogue page
    cat_title: 'የአገልግሎት ካታሎግ',
    cat_subtitle: 'ሁሉንም የተቋማት አገልግሎቶች በአንድ ቦታ ይፈልጉ',
    cat_search_ph: 'አገልግሎት ወይም ድርጅት ይፈልጉ...',
    cat_no_results: 'ምንም ውጤት አልተገኘም፡',
    cat_service: 'አገልግሎት',
    cat_services: 'አገልግሎቶች',
    cat_back: 'ወደ መነሻ ተመለስ',

    // address
    addr_title: 'ሃዋሳ-መሶብ',
    addr_place: 'ሃዋሳ መሶብ',
    addr_street: 'ከቅዱስ ገብርኤል ቤተ ክርስቲያን ጀርባ፣ ከኢሚግሬሽን ፊት ለፊት',
    addr_city: 'ሃዋሳ፣ ኢትዮጵያ',
    addr_phone_label: 'ስልክ',
    addr_hours_label: 'የስራ ሰዓት',
    addr_hours1: 'ሰኞ - አርብ፡ 8:30 AM - 5:30 PM',
    addr_hours2: 'ቅዳሜ፡ 8:30 AM - 12:30 PM',
    addr_directions: 'በGoogle Maps አቅጣጫ ያግኙ →',

    // contact
    contact_title: 'መልዕክት ይላኩልን',
    contact_desc: 'ጥያቄ አለዎት ወይም እርዳታ ይፈልጋሉ? መልዕክት ይላኩልን። ቡድናችን በቶሎ ምላሽ ይሰጥዎታል።',
    contact_email_label: 'ኢሜይል',
    contact_phone_label: 'ስልክ',
    contact_name: 'ሙሉ ስም',
    contact_name_ph: 'ለምሳሌ አበበ ከበደ',
    contact_tel: 'ስልክ ቁጥር',
    contact_tel_ph: '09xxxxxxxx',
    contact_email: 'ኢሜይል አድራሻ',
    contact_email_ph: 'ለምሳሌ abebe@gmail.com',
    contact_subject: 'ርዕሰ ጉዳይ',
    contact_subject_ph: 'ለምሳሌ የፓስፖርት ጥያቄ...',
    contact_message: 'መልዕክቶ',
    contact_message_ph: 'መልዕክትዎን እዚህ ይፃፉ...',
    contact_send: 'መልዕክት ይላኩ',
    contact_success: '✅ አመሰግናለሁ! መልዕክትዎ በተሳካ ሁኔታ ተልኳል።\n\nብዙም ሳይቆይ ምላሽ እንሰጥዎታለን።',

    // footer
    footer_tagline: 'The New Horizon of Service!',
    footer_bilingual: 'የሃዋሳ መሶብ አገልግሎት  |  Hawassa Mesob Service',
    footer_desc: 'የመንግሥት አገልግሎቶችን ወደ እርስዎ ያቀርባል።',
    footer_quick: 'ፈጣን ማስፈንጠሪያዎች',
    footer_links: 'ፈጣን ማስፈንጠሪያዎች',
    footer_services: 'አገልግሎቶች',
    footer_support: 'ድጋፍ',
    footer_help: 'የእርዳታ ማዕከል',
    footer_faq: 'ተደጋጋሚ ጥያቄዎች',
    footer_privacy: 'የግላዊነት ፖሊሲ',
    footer_contact: 'ያግኙን',
    footer_copy: '© 2026 ሃዋሳ መሶብ። መብቱ በሕግ የተጠበቀ ነው።',
  },
};
