import crypto from 'crypto';

/**
 * Normalize an email address (trim, lowercase)
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Validate whether an email is an approved official institutional address
 * Strictly requires domain @mesobcenterh.gov.et (no other domains allowed).
 * @param {string} email
 * @returns {boolean}
 */
export const isOfficialInstitutionalEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;

  // Local part must not be empty
  if (!localPart || localPart.length < 1) return false;

  // Strictly and exclusively @mesobcenterh.gov.et
  return domain === 'mesobcenterh.gov.et';
};

/**
 * Validate customer registration email (strictly @gmail.com)
 * @param {string} email
 * @returns {boolean}
 */
export const isValidCustomerGmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Strict regex for valid username before @gmail.com
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailRegex.test(normalized);
};

/**
 * Generate cryptographically secure random temporary password
 * Contains uppercase, lowercase, number, and special character
 * @param {number} length Default 12
 * @returns {string}
 */
export const generateSecureTemporaryPassword = (length = 12) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;

  let passwordChars = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    special[crypto.randomInt(0, special.length)]
  ];

  for (let i = 4; i < length; i++) {
    passwordChars.push(all[crypto.randomInt(0, all.length)]);
  }

  // Shuffle array using Fisher-Yates
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
};

/**
 * Generate 6-digit email verification code
 * @returns {string}
 */
export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Enforce standard secure password policy
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&* etc.)
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_=+]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.).' };
  }

  return { valid: true };
};
