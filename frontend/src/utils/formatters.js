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

const TIME_TRANSLATIONS_MAP = {
  'instant': 'ወዲያውኑ',
  'immediately': 'ወዲያውኑ',
  'instant to same day': 'ወዲያውኑ እስከ ዕለቱ',
  'same day': 'በዕለቱ',
  'varies': 'እንደ ሁኔታው ይለያያል',
  '5 days': '5 ቀናት',
  '15 minutes': '15 ደቂቃዎች',
  '20 minutes': '20 ደቂቃዎች',
  '25 minutes': '25 ደቂቃዎች',
  '30 minutes': '30 ደቂቃዎች',
  '5 minutes': '5 ደቂቃዎች',
  '3 to 7 minutes': 'ከ3 እስከ 7 ደቂቃዎች',
  'stage 1: 1 to 3 minutes, stage 2: 5 to 10 minutes, stage 3: 1 day': 'ደረጃ 1: ከ1 እስከ 3 ደቂቃዎች፣ ደረጃ 2: ከ5 እስከ 10 ደቂቃዎች፣ ደረጃ 3: 1 ቀን',
  '1 to 7 days (depending on destination)': 'ከ1 እስከ 7 ቀናት (እንደ መድረሻው ይወሰናል)',
  '5 to 21 days (depending on destination)': 'ከ5 እስከ 21 ቀናት (እንደ መድረሻው ይወሰናል)',
  '1 to 3 days (domestic), 3 to 7 days (international)': 'ከ1 እስከ 3 ቀናት (አገር ውስጥ)፣ ከ3 እስከ 7 ቀናት (ዓለም አቀፍ)',
  'same day to 3 days': 'ከዕለቱ እስከ 3 ቀናት',
  'same day to 3 days (depending on service level)': 'ከዕለቱ እስከ 3 ቀናት (እንደ አገልግሎቱ ደረጃ)',
  '3 to 7 days': 'ከ3 እስከ 7 ቀናት',
  '5 to 15 working days': 'ከ5 እስከ 15 የሥራ ቀናት',
  '1 to 3 working days': 'ከ1 እስከ 3 የሥራ ቀናት',
  'same day to 2 days': 'ከዕለቱ እስከ 2 ቀናት',
  '3 to 7 working days': 'ከ3 እስከ 7 የሥራ ቀናት',
  '15 to 30 working days': 'ከ15 እስከ 30 የሥራ ቀናት',
  '1-3 days': 'ከ1 እስከ 3 ቀናት',
  '3 days': '3 ቀናት'
};

const FEE_TRANSLATIONS_MAP = {
  'free': 'ነፃ',
  'none': 'ነፃ (ክፍያ የለውም)',
  'free / 100 etb': 'ነፃ / 100 ብር',
  'as per consumption': 'እንደ ፍጆታው',
  'as per tax assessment': 'እንደ ታክስ ግምገማው',
  'varies': 'እንደ ሁኔታው ይለያያል',
  '400 birr': '400 ብር',
  '300 birr': '300 ብር',
  '50 birr': '50 ብር',
  '100 birr': '100 ብር',
  '200 birr': '200 ብር',
  '500 etb': '500 ብር',
  '1500 etb': '1,500 ብር',
  '2000 etb': '2,000 ብር',
  'standard: 50 etb, vip: 1,000 etb': 'መደበኛ: 50 ብር፣ ቪአይፒ (ልዩ): 1,000 ብር',
  'none (transaction fees may apply)': 'ነፃ (የግብይት ክፍያዎች ሊኖሩ ይችላሉ)',
  'varies by box size and location': 'እንደ ሣጥኑ መጠን እና ቦታ ይለያያል',
  'based on weight and destination': 'እንደ ክብደት እና መድረሻው ይወሰናል',
  'based on weight, destination, and service type': 'እንደ ክብደት፣ መድረሻ እና የአገልግሎት ዓይነት ይወሰናል',
  'premium rates based on weight and destination': 'ፕሪሚየም ተመን እንደ ክብደት እና መድረሻው',
  'service charge based on amount sent': 'የአገልግሎት ክፍያ በተላከው ገንዘብ መጠን ይወሰናል',
  'varies by stamp type': 'እንደ ቴምብሩ ዓይነት ይለያያል',
  'based on weight, destination, and urgency': 'እንደ ክብደት፣ መድረሻ እና አስቸኳይነት ይወሰናል',
  'small service charge': 'አነስተኛ የአገልግሎት ክፍያ',
  'none for account opening; transaction fees may apply': 'ሂሳብ ለመክፈት ነፃ፤ የግብይት ክፍያዎች ሊኖሩ ይችላሉ',
  'varies by investment size and sector': 'እንደ ኢንቨስትመንቱ መጠን እና ዘርፍ ይለያያል',
  'varies by business type': 'እንደ ንግዱ ዓይነት ይለያያል',
  'varies by project size': 'እንደ ፕሮጀክቱ ስፋት ይለያያል'
};

export function formatServiceTime(time, lang = 'en') {
  if (lang !== 'am' || !time) return time;
  const str = String(time).trim();
  const lower = str.toLowerCase();

  // Check dictionary first for exact matches
  if (TIME_TRANSLATIONS_MAP[lower]) {
    return TIME_TRANSLATIONS_MAP[lower];
  }

  // Multi-part composite and regex fallback
  return str
    .replace(/\bStage\s*([0-9]+)\b/gi, 'ደረጃ $1')
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*working\s*days?\b/gi, 'ከ$1 እስከ $2 የሥራ ቀናት')
    .replace(/\b([0-9]+)\s*to\s*([0-9]+)\s*working\s*days?\b/gi, 'ከ$1 እስከ $2 የሥራ ቀናት')
    .replace(/\b([0-9]+)\s*working\s*days?\b/gi, '$1 የሥራ ቀናት')
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*days?\b/gi, 'ከ$1 እስከ $2 ቀናት')
    .replace(/\b([0-9]+)\s*to\s*([0-9]+)\s*days?\b/gi, 'ከ$1 እስከ $2 ቀናት')
    .replace(/\b([0-9]+)\s*days?\b/gi, '$1 ቀናት')
    .replace(/\b1\s*day\b/gi, '1 ቀን')
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*hours?\b/gi, 'ከ$1 እስከ $2 ሰዓታት')
    .replace(/\b([0-9]+)\s*to\s*([0-9]+)\s*hours?\b/gi, 'ከ$1 እስከ $2 ሰዓታት')
    .replace(/\b([0-9]+)\s*hours?\b/gi, '$1 ሰዓት')
    .replace(/\b([0-9]+)\s*-\s*([0-9]+)\s*minutes?\b/gi, 'ከ$1 እስከ $2 ደቂቃዎች')
    .replace(/\b([0-9]+)\s*to\s*([0-9]+)\s*minutes?\b/gi, 'ከ$1 እስከ $2 ደቂቃዎች')
    .replace(/\b([0-9]+)\s*minutes?\b/gi, '$1 ደቂቃዎች')
    .replace(/\b([0-9]+)\s*weeks?\b/gi, '$1 ሳምንታት')
    .replace(/\b([0-9]+)\s*months?\b/gi, '$1 ወራት')
    .replace(/\bInstant to Same Day\b/gi, 'ወዲያውኑ እስከ ዕለቱ')
    .replace(/\bInstant\b/gi, 'ወዲያውኑ')
    .replace(/\bImmediately\b/gi, 'ወዲያውኑ')
    .replace(/\bSame Day\b/gi, 'በዕለቱ')
    .replace(/\bVaries\b/gi, 'እንደ ሁኔታው ይለያያል')
    .replace(/\bdepending on destination\b/gi, 'እንደ መድረሻው ይወሰናል')
    .replace(/\bdepending on service level\b/gi, 'እንደ አገልግሎቱ ደረጃ')
    .replace(/\bdomestic\b/gi, 'አገር ውስጥ')
    .replace(/\binternational\b/gi, 'ዓለም አቀፍ')
    .replace(/\bto\b/gi, 'እስከ')
    .replace(/\bor\b/gi, 'ወይም');
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

  // Check dictionary first for exact matches
  if (FEE_TRANSLATIONS_MAP[lower]) {
    return FEE_TRANSLATIONS_MAP[lower];
  }

  // Composite multi-tier fee fallback
  return str
    .replace(/\bStandard\b/gi, 'መደበኛ')
    .replace(/\bVIP\b/gi, 'ቪአይፒ (ልዩ)')
    .replace(/\bFree\b/gi, 'ነፃ')
    .replace(/\bNone\b/gi, 'ነፃ (ክፍያ የለውም)')
    .replace(/\bBirr\b/gi, 'ብር')
    .replace(/\bETB\b/gi, 'ብር')
    .replace(/\bAs per consumption\b/gi, 'እንደ ፍጆታው')
    .replace(/\bAs per tax assessment\b/gi, 'እንደ ታክስ ግምገማው')
    .replace(/\bVaries by box size and location\b/gi, 'እንደ ሣጥኑ መጠን እና ቦታ ይለያያል')
    .replace(/\bBased on weight and destination\b/gi, 'እንደ ክብደት እና መድረሻው ይወሰናል')
    .replace(/\bBased on weight, destination, and service type\b/gi, 'እንደ ክብደት፣ መድረሻ እና የአገልግሎት ዓይነት ይወሰናል')
    .replace(/\bBased on weight, destination, and urgency\b/gi, 'እንደ ክብደት፣ መድረሻ እና አስቸኳይነት ይወሰናል')
    .replace(/\bPremium rates based on weight and destination\b/gi, 'ፕሪሚየም ተመን እንደ ክብደት እና መድረሻው')
    .replace(/\bService charge based on amount sent\b/gi, 'የአገልግሎት ክፍያ በተላከው ገንዘብ መጠን ይወሰናል')
    .replace(/\bVaries by stamp type\b/gi, 'እንደ ቴምብሩ ዓይነት ይለያያል')
    .replace(/\bSmall service charge\b/gi, 'አነስተኛ የአገልግሎት ክፍያ')
    .replace(/\bNone for account opening; transaction fees may apply\b/gi, 'ሂሳብ ለመክፈት ነፃ፤ የግብይት ክፍያዎች ሊኖሩ ይችላሉ')
    .replace(/\bTransaction fees may apply\b/gi, 'የግብይት ክፍያዎች ሊኖሩ ይችላሉ')
    .replace(/\bVaries by investment size and sector\b/gi, 'እንደ ኢንቨስትመንቱ መጠን እና ዘርፍ ይለያያል')
    .replace(/\bVaries by business type\b/gi, 'እንደ ንግዱ ዓይነት ይለያያል')
    .replace(/\bVaries by project size\b/gi, 'እንደ ፕሮጀክቱ ስፋት ይለያያል')
    .replace(/\bVaries\b/gi, 'እንደ ሁኔታው ይለያያል');
}
