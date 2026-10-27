/**
 * Service and date formatting helpers for multilingual support (English & Amharic)
 */

export const AMHARIC_MONTHS = [
  'ጥር',      // January (Month 0 in JS Date)
  'የካቲት',    // February (Month 1)
  'መጋቢት',    // March (Month 2)
  'ሚያዝያ',    // April (Month 3)
  'ግንቦት',    // May (Month 4)
  'ሰኔ',       // June (Month 5)
  'ሐምሌ',     // July (Month 6)
  'ነሐሴ',     // August (Month 7)
  'መስከረም',   // September (Month 8)
  'ጥቅምት',    // October (Month 9)
  'ኅዳር',      // November (Month 10)
  'ታኅሣሥ',    // December (Month 11)
];

const TRANSLITERATED_MONTHS_MAP = {
  'ጃንዋሪ': 'ጥር',
  'ፌብሩወሪ': 'የካቲት',
  'ማርች': 'መጋቢት',
  'ኤፕሪል': 'ሚያዝያ',
  'ሜይ': 'ግንቦት',
  'ጁን': 'ሰኔ',
  'ጁላይ': 'ሐምሌ',
  'ኦገስት': 'ነሐሴ',
  'ሴፕቴምበር': 'መስከረም',
  'ኦክቶበር': 'ጥቅምት',
  'ኖቬምበር': 'ኅዳር',
  'ዲሴምበር': 'ታኅሣሥ',
  'January': 'ጥር',
  'February': 'የካቲት',
  'March': 'መጋቢት',
  'April': 'ሚያዝያ',
  'May': 'ግንቦት',
  'June': 'ሰኔ',
  'July': 'ሐምሌ',
  'August': 'ነሐሴ',
  'September': 'መስከረም',
  'October': 'ጥቅምት',
  'November': 'ኅዳር',
  'December': 'ታኅሣሥ',
  'Jan': 'ጥር',
  'Feb': 'የካቲት',
  'Mar': 'መጋቢት',
  'Apr': 'ሚያዝያ',
  'Jun': 'ሰኔ',
  'Jul': 'ሐምሌ',
  'Aug': 'ነሐሴ',
  'Sep': 'መስከረም',
  'Oct': 'ጥቅምት',
  'Nov': 'ኅዳር',
  'Dec': 'ታኅሣሥ',
};

export function formatDisplayDate(dateInput, lang = 'en') {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    if (lang === 'am') {
      const day = date.getDate();
      const month = AMHARIC_MONTHS[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  let str = String(dateInput);
  if (lang === 'am') {
    for (const [translit, amharic] of Object.entries(TRANSLITERATED_MONTHS_MAP)) {
      if (str.includes(translit)) {
        str = str.replace(new RegExp(translit, 'g'), amharic);
      }
    }
  }
  return str;
}

export function formatServiceTime(time, lang = 'en') {
  if (lang !== 'am' || !time) return time;
  const str = String(time).trim();
  const lower = str.toLowerCase();

  if (lower === 'instant' || lower === 'immediately') return 'ወዲያውኑ';
  if (lower === 'instant to same day') return 'ወዲያውኑ እስከ ዕለቱ';
  if (lower === 'same day') return 'በዕለቱ';
  if (lower === 'varies') return 'እንደ ሁኔታው ይለያያል';

  return str
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*days?\b/gi, '$1-$2 ቀናት')
    .replace(/\b([0-9]+)\s*days?\b/gi, '$1 ቀናት')
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*hours?\b/gi, '$1-$2 ሰዓታት')
    .replace(/\b([0-9]+)\s*hours?\b/gi, '$1 ሰዓት')
    .replace(/\b([0-9]+)\s*minutes?\b/gi, '$1 ደቂቃዎች')
    .replace(/\b([0-9]+)\s*weeks?\b/gi, '$1 ሳምንታት')
    .replace(/\b([0-9]+)\s*months?\b/gi, '$1 ወራት')
    .replace(/Instant/gi, 'ወዲያውኑ')
    .replace(/Same Day/gi, 'በዕለቱ')
    .replace(/Varies/gi, 'ይለያያል');
}

export function getYouTubeVideoId(url) {
  if (!url) return null;
  const str = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function formatServiceFee(fee, lang = 'en') {
  if (lang !== 'am' || !fee) return fee;
  const str = String(fee).trim();
  const lower = str.toLowerCase();

  if (lower === 'free') return 'ነፃ';
  if (lower === 'as per consumption') return 'እንደ ፍጆታው';
  if (lower === 'as per tax assessment') return 'እንደ ታክስ ግምገማው';
  if (lower === 'varies') return 'እንደ ሁኔታው ይለያያል';
  if (lower === 'free / 100 etb') return 'ነፃ / 100 ብር';

  return str
    .replace(/\bBirr\b/gi, 'ብር')
    .replace(/\bETB\b/gi, 'ብር')
    .replace(/\bFree\b/gi, 'ነፃ')
    .replace(/\bAs per consumption\b/gi, 'እንደ ፍጆታው')
    .replace(/\bAs per tax assessment\b/gi, 'እንደ ታክስ ግምገማው')
    .replace(/\bVaries\b/gi, 'ይለያያል');
}
