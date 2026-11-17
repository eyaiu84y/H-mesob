/**
 * localizedContent.js
 * 
 * Provides safe, structured access to dynamic multilingual database records
 * (Institutions, Services, Announcements, etc.) supporting _en and _am schemas.
 */

import i18n from '../i18n/i18n.js';
import { organizationsData } from '../data/organizations.js';

/**
 * Returns localized string field from a database object (e.g. name_en / name_am, title_en / title_am)
 * @param {Object} obj Database row
 * @param {string} field Base field name without suffix (e.g., 'title', 'name', 'description')
 * @param {string} [lang] Language override ('en' or 'am'); defaults to current i18n language
 * @returns {string} Localized text or fallback
 */
export function getLocalized(obj, field, lang = null) {
  if (!obj) return '';
  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';

  if (currentLang === 'am') {
    return (
      obj[`${field}_am`] ||
      obj[`${field}Am`] ||
      obj[`${field}_en`] ||
      obj[`${field}En`] ||
      obj[field] ||
      ''
    );
  }

  return (
    obj[`${field}_en`] ||
    obj[`${field}En`] ||
    obj[field] ||
    obj[`${field}_am`] ||
    obj[`${field}Am`] ||
    ''
  );
}

/**
 * Specific helper for Service title
 */
export function getServiceTitle(service, lang = null) {
  return getLocalized(service, 'title', lang) || service?.name || service?.serviceName || '';
}

export const getServiceName = getServiceTitle;

/**
 * Specific helper for Service description
 */
export function getServiceDescription(service, lang = null) {
  return getLocalized(service, 'description', lang) || '';
}

/**
 * Specific helper for Institution name
 */
export function getInstitutionName(institution, lang = null) {
  return getLocalized(institution, 'name', lang) || '';
}

/**
 * Specific helper for Announcement title & content
 */
export function getAnnouncementTitle(announcement, lang = null) {
  return getLocalized(announcement, 'title', lang) || '';
}

export function getAnnouncementContent(announcement, lang = null) {
  return getLocalized(announcement, 'content', lang) || '';
}

/**
 * Specific helper for Service requirements / documents list
 * Accurately extracts document requirements in English or Amharic
 * from database joined records, localized object properties, or static catalogue.
 */
export function getServiceRequirements(service, lang = null) {
  if (!service) return [];
  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';

  const extractDocName = (item, isAmharic) => {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    if (isAmharic) {
      return (
        item.document_name_am ||
        item.requirement_am ||
        item.name_am ||
        item.document_name_en ||
        item.requirement_en ||
        item.document_name ||
        item.name ||
        item.title ||
        ''
      ).trim();
    }
    return (
      item.document_name_en ||
      item.requirement_en ||
      item.name_en ||
      item.document_name ||
      item.name ||
      item.title ||
      item.document_name_am ||
      item.requirement_am ||
      ''
    ).trim();
  };

  let docs = [];

  if (currentLang === 'am') {
    if (Array.isArray(service.docs_am) && service.docs_am.length > 0) {
      docs = service.docs_am;
    } else if (Array.isArray(service.required_documents_am) && service.required_documents_am.length > 0) {
      docs = service.required_documents_am;
    } else if (Array.isArray(service.requirements_am) && service.requirements_am.length > 0) {
      docs = service.requirements_am;
    } else if (Array.isArray(service.requirementsAm) && service.requirementsAm.length > 0) {
      docs = service.requirementsAm;
    } else if (Array.isArray(service.service_requirements) && service.service_requirements.length > 0) {
      docs = service.service_requirements.map(r => extractDocName(r, true));
    } else if (Array.isArray(service.docs_en) && service.docs_en.length > 0) {
      docs = service.docs_en;
    } else if (Array.isArray(service.required_documents_en) && service.required_documents_en.length > 0) {
      docs = service.required_documents_en;
    } else if (Array.isArray(service.requirements_en) && service.requirements_en.length > 0) {
      docs = service.requirements_en;
    } else if (Array.isArray(service.requirements) && service.requirements.length > 0) {
      docs = service.requirements;
    } else if (Array.isArray(service.documents) && service.documents.length > 0) {
      docs = service.documents;
    }
  } else {
    if (Array.isArray(service.docs_en) && service.docs_en.length > 0) {
      docs = service.docs_en;
    } else if (Array.isArray(service.required_documents_en) && service.required_documents_en.length > 0) {
      docs = service.required_documents_en;
    } else if (Array.isArray(service.requirements_en) && service.requirements_en.length > 0) {
      docs = service.requirements_en;
    } else if (Array.isArray(service.requirementsEn) && service.requirementsEn.length > 0) {
      docs = service.requirementsEn;
    } else if (Array.isArray(service.service_requirements) && service.service_requirements.length > 0) {
      docs = service.service_requirements.map(r => extractDocName(r, false));
    } else if (Array.isArray(service.docs_am) && service.docs_am.length > 0) {
      docs = service.docs_am;
    } else if (Array.isArray(service.required_documents_am) && service.required_documents_am.length > 0) {
      docs = service.required_documents_am;
    } else if (Array.isArray(service.requirements_am) && service.requirements_am.length > 0) {
      docs = service.requirements_am;
    } else if (Array.isArray(service.requirements) && service.requirements.length > 0) {
      docs = service.requirements;
    } else if (Array.isArray(service.documents) && service.documents.length > 0) {
      docs = service.documents;
    }
  }

  // Fallback to static organizationsData catalogue if array is empty
  if (!docs || docs.length === 0) {
    const sTitle = (service.title_en || service.name || service.title || '').trim().toLowerCase();
    const sTitleAm = (service.title_am || service.name_am || '').trim();
    const sCode = (service.code || '').trim().toLowerCase();

    for (const org of organizationsData) {
      const match = (org.services || []).find(s => {
        const tEn = (s.title_en || '').trim().toLowerCase();
        const tAm = (s.title_am || '').trim();
        const code = (s.code || '').trim().toLowerCase();
        return (
          (sTitle && tEn && (tEn === sTitle || tEn.includes(sTitle) || sTitle.includes(tEn))) ||
          (sTitleAm && tAm && tAm === sTitleAm) ||
          (sCode && code && code === sCode)
        );
      });

      if (match) {
        if (currentLang === 'am' && Array.isArray(match.docs_am) && match.docs_am.length > 0) {
          docs = match.docs_am;
          break;
        } else if (Array.isArray(match.docs_en) && match.docs_en.length > 0) {
          docs = match.docs_en;
          break;
        }
      }
    }
  }

  return (docs || [])
    .map(d => extractDocName(d, currentLang === 'am'))
    .filter(Boolean);
}

/**
 * Universal helper for status localization across all 6 dashboards
 */
export function getLocalizedStatus(status, lang = 'en') {
  if (!status) return '';
  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';
  if (currentLang !== 'am') return status;

  const norm = String(status).trim().toUpperCase().replace(/[\s-]/g, '_');
  const STATUS_MAP_AM = {
    PENDING: 'በመጠባበቅ ላይ',
    IN_PROGRESS: 'በሂደት ላይ',
    WAITING: 'በመጠባበቅ ላይ',
    WAITING_PARTS: 'መለዋወጫ በመጠባበቅ ላይ',
    COMPLETED: 'የተጠናቀቀ',
    RESOLVED: 'የተፈታ',
    CLOSED: 'የተዘጋ',
    SUBMITTED: 'የቀረበ',
    ASSIGNED: 'የተመደበ',
    APPROVED: 'የጸደቀ',
    REJECTED: 'ውድቅ የተደረገ',
    PENDING_APPROVAL: 'ማጽደቅ በመጠባበቅ ላይ',
    CALLED: 'የተጠራ',
    PROCESSING: 'በመስራት ላይ',
    IN_REVIEW: 'በግምገማ ላይ',
    UNDER_REVIEW: 'በግምገማ ላይ',
    DRAFT: 'ረቂቅ',
    ACTIVE: 'ንቁ',
    INACTIVE: 'የማይንቀሳቀስ',
    CANCELLED: 'የተሰረዘ',
    NORMAL: 'መደበኛ',
    BUSY: 'ስራ የበዛበት',
    ACTION_NEEDED: 'እርምጃ ያስፈልጋል',
    OPEN: 'ክፍት',
    ESCALATED: 'የተላለፈ',
  };

  return STATUS_MAP_AM[norm] || status;
}

/**
 * Universal helper for priority localization across all 6 dashboards
 */
export function getLocalizedPriority(priority, lang = 'en') {
  if (!priority) return '';
  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';
  if (currentLang !== 'am') return priority;

  const norm = String(priority).trim().toUpperCase();
  const PRIORITY_MAP_AM = {
    CRITICAL: 'ወሳኝ',
    HIGH: 'ከፍተኛ',
    MEDIUM: 'መካከለኛ',
    NORMAL: 'መደበኛ',
    LOW: 'ዝቅተኛ',
    URGENT: 'አስቸኳይ',
  };

  return PRIORITY_MAP_AM[norm] || priority;
}

/**
 * Universal helper for role localization across all 6 dashboards
 */
export function getLocalizedRole(role, lang = 'en') {
  if (!role) return '';
  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';
  const norm = String(role).trim().toLowerCase().replace(/[\s-]/g, '_');

  const ROLE_MAP = {
    super_admin: { en: 'Super Admin', am: 'ከፍተኛ አስተዳዳሪ' },
    mesob_manager: { en: 'MESOB Manager', am: 'የመሶብ አስተዳዳሪ' },
    institution_manager: { en: 'Institution Manager', am: 'የተቋም አስተዳዳሪ' },
    employee: { en: 'Employee', am: 'ሠራተኛ' },
    technician: { en: 'Technician', am: 'ቴክኒሻን' },
    customer: { en: 'Customer', am: 'ደንበኛ' },
  };

  if (ROLE_MAP[norm]) {
    return ROLE_MAP[norm][currentLang] || ROLE_MAP[norm].en;
  }
  return role;
}

