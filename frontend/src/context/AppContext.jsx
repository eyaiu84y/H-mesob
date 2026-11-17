/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import enTranslation from '../i18n/locales/en/translation.json';
import amTranslation from '../i18n/locales/am/translation.json';

const AppContext = createContext(null);

export const translations = {
  en: enTranslation,
  am: amTranslation,
};

export function AppProvider({ children }) {
  const { t: i18nT, i18n } = useTranslation();

  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch { /* ignore storage error */ }
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch { /* ignore storage error */ }
    }
  }, [isDark]);

  // Synchronize theme across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDark(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('lang') || localStorage.getItem('i18nextLng') || i18n.language;
      return saved && saved.startsWith('am') ? 'am' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    const handleLangChange = (lng) => {
      const code = lng && lng.startsWith('am') ? 'am' : 'en';
      setLang(code);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = code;
        if (code === 'am') {
          document.documentElement.classList.add('lang-am');
        } else {
          document.documentElement.classList.remove('lang-am');
        }
      }
    };

    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  function switchLang(code) {
    const target = code && code.startsWith('am') ? 'am' : 'en';
    i18n.changeLanguage(target);
    setLang(target);
    try {
      localStorage.setItem('lang', target);
      localStorage.setItem('i18nextLng', target);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = target;
        if (target === 'am') {
          document.documentElement.classList.add('lang-am');
        } else {
          document.documentElement.classList.remove('lang-am');
        }
      }
    } catch (err) {
      console.warn('Failed to save language preference:', err);
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'am') {
      document.documentElement.classList.add('lang-am');
    } else {
      document.documentElement.classList.remove('lang-am');
    }
  }, [lang]);

  // Backward-compatible smart translation proxy
  // Supports both function call: t('common.save') and property access: t.nav_home
  const t = useMemo(() => {
    const KNOWN_LABELS = {
      dashboard: lang === 'am' ? 'ዳሽቦርድ' : 'Dashboard',
      maintenance: lang === 'am' ? 'ጥገና' : 'Maintenance',
      queue: lang === 'am' ? 'ሰልፍ' : 'Queue',
      announcements: lang === 'am' ? 'ማስታወቂያዎች' : 'Announcements',
      announcement: lang === 'am' ? 'ማስታወቂያዎች' : 'Announcements',
      feedback: lang === 'am' ? 'አስተያየት' : 'Feedback',
      users: lang === 'am' ? 'ተጠቃሚዎች' : 'Users',
      institutions: lang === 'am' ? 'ተቋማት' : 'Institutions',
      application: lang === 'am' ? 'ማመልከቻዎች' : 'Applications',
      applications: lang === 'am' ? 'ማመልከቻዎች' : 'Applications',
      status: lang === 'am' ? 'ሁኔታ' : 'Status',
      reports: lang === 'am' ? 'ሪፖርቶች' : 'Reports',
      analytics: lang === 'am' ? 'ትንታኔ' : 'Analytics',
      approvals: lang === 'am' ? 'ማጽደቆች' : 'Approvals',
      profile: lang === 'am' ? 'መገለጫ' : 'Profile',
      my_profile: lang === 'am' ? 'የእኔ መገለጫ' : 'My Profile',
      settings: lang === 'am' ? 'ቅንብሮች' : 'Settings',
      'common.mesobcenter': lang === 'am' ? 'ሀዋሳ ሜሶብ ማዕከል' : 'Hawassa MESOB Center',
      mesobcenter: lang === 'am' ? 'ሀዋሳ ሜሶብ ማዕከል' : 'Hawassa MESOB Center',
    };

    return new Proxy(i18nT, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) return target[prop];

          const lowerProp = prop.toLowerCase();
          if (lowerProp in KNOWN_LABELS) return KNOWN_LABELS[lowerProp];

          const val = target(prop, { returnObjects: false });

          // If translation key wasn't found in hierarchical namespaces, check flat baseline dictionary
          if (val === prop || (typeof val === 'string' && val === prop)) {
            const flatVal = translations[lang]?.[prop] || translations.en?.[prop];
            if (flatVal !== undefined) {
              if (Array.isArray(flatVal)) return flatVal;
              if (typeof flatVal === 'object' && flatVal !== null) {
                return KNOWN_LABELS[lowerProp] || flatVal.title || flatVal.label || undefined;
              }
              return flatVal;
            }
            return undefined;
          }

          // If i18next returned a plain object (e.g. namespace), NEVER pass a plain object to React JSX
          if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            return KNOWN_LABELS[lowerProp] || val.title || val.label || prop;
          }

          return val;
        }
        return target[prop];
      },
      apply(target, thisArg, argumentsList) {
        const key = argumentsList[0];
        const opts = argumentsList[1] || {};

        if (typeof key === 'string') {
          const lowerKey = key.toLowerCase();
          if (lowerKey in KNOWN_LABELS) return KNOWN_LABELS[lowerKey];
        }

        const res = Reflect.apply(target, thisArg, [key, { returnObjects: false, ...opts }]);
        if (res === key && typeof key === 'string') {
          const lowerKey = key.toLowerCase();
          const flatVal = translations[lang]?.[key] || translations.en?.[key];
          if (flatVal !== undefined) {
            if (Array.isArray(flatVal)) return flatVal;
            if (typeof flatVal === 'object' && flatVal !== null) {
              return KNOWN_LABELS[lowerKey] || flatVal.title || flatVal.label || key;
            }
            return flatVal;
          }
        }
        if (typeof res === 'object' && res !== null && !Array.isArray(res) && !opts.returnObjects) {
          const lowerKey = typeof key === 'string' ? key.toLowerCase() : '';
          return KNOWN_LABELS[lowerKey] || res.title || res.label || (typeof key === 'string' ? key : '');
        }
        return res;
      }
    });
  }, [i18nT, lang]);

  const getStatusLabel = (status) => getApplicationStatusLabel(status, lang);
  const getStaffNotes = (notes) => formatStaffNotes(notes, lang);

  return (
    <AppContext.Provider value={{ isDark, toggleTheme, lang, switchLang, t, i18n, getStatusLabel, getStaffNotes }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

// ─── Status Mapping Helper ─────────────────────────────────────────
export function getApplicationStatusLabel(status, lang = 'en') {
  if (!status) return '';
  const norm = String(status).trim().toUpperCase().replace(/[\s-]/g, '_');
  const labels = {
    SUBMITTED: { en: 'Submitted', am: 'ቀርቧል' },
    UNDER_REVIEW: { en: 'Under Review', am: 'በግምገማ ላይ' },
    PENDING_DOCUMENTS: { en: 'Needs Information', am: 'ተጨማሪ መረጃ ያስፈልጋል' },
    NEEDS_INFORMATION: { en: 'Needs Information', am: 'ተጨማሪ መረጃ ያስፈልጋል' },
    APPROVED: { en: 'Approved', am: 'ጸድቋል' },
    ACKNOWLEDGED: { en: 'Approved', am: 'ጸድቋል' },
    IN_PROGRESS: { en: 'In Progress', am: 'በሂደት ላይ' },
    COMPLETED: { en: 'Completed', am: 'ተጠናቋል' },
    RESOLVED: { en: 'Resolved', am: 'የተፈታ' },
    REJECTED: { en: 'Rejected', am: 'ውድቅ ተደርጓል' },
    CANCELLED: { en: 'Cancelled', am: 'ተሰርዟል' },
    DRAFT: { en: 'Draft', am: 'ረቂቅ' },
  };
  return labels[norm]?.[lang] || labels[norm]?.en || status;
}

// ─── Staff Notes Helper ────────────────────────────────────────────
export function formatStaffNotes(notes, lang = 'en') {
  if (!notes) return null;
  if (typeof notes === 'string' && notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(notes);
      if (parsed[lang]) return { text: parsed[lang], isUntranslated: false, label: '' };
    } catch {
      // Ignore parse error and fallback to raw string
    }
  }
  const lower = String(notes).toLowerCase();
  if (lower.includes('incomplete') || lower.includes('missing') || lower.includes('provide')) {
    return {
      text: lang === 'am' 
        ? 'ማመልከቻዎ ያልተሟላ ነው። እባክዎ የጎደሉትን አስፈላጊ ሰነዶች ያቅርቡና ማመልከቻዎን እንደገና ያስገቡ።' 
        : 'Your application is incomplete. Please provide the missing required documents and resubmit your application.',
      isUntranslated: false,
      label: ''
    };
  }
  return {
    text: notes,
    isUntranslated: lang === 'am' && /[a-zA-Z]{4,}/.test(notes),
    label: lang === 'am' ? 'የሰራተኛ አስተያየት (በእንግሊዝኛ)' : 'Staff Review Notes'
  };
}
