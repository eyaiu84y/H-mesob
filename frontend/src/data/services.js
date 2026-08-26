export const servicesData = [
  { id: 1, titleKey: 'svc1_title', orgKey: 'svc1_org', image: '/image/fayda.png',      time: '1-3 Days', fee: 'Free / 100 ETB', link: '#' },
  { id: 2, titleKey: 'svc2_title', orgKey: 'svc2_org', image: '/image/ንግድና ገበያ.jpg', time: '3 Days',   fee: '500 ETB',        link: '#' },
  { id: 3, titleKey: 'svc3_title', orgKey: 'svc3_org', image: '/image/revenue.jpg',    time: 'Instant',  fee: 'Varies',         link: '#' },
  { id: 4, titleKey: 'svc4_title', orgKey: 'svc4_org', image: '/image/ethiotel.png',   time: 'Instant',  fee: 'Free',           link: '#' },
];

export const newsData = [
  { id: 1, categoryKey: 'news1_category', titleKey: 'news1_title', previewKey: 'news1_preview', readTime: '3', sourceKey: 'news1_source' },
  { id: 2, categoryKey: 'news2_category', titleKey: 'news2_title', previewKey: 'news2_preview', readTime: '3', sourceKey: 'news2_source' },
  { id: 3, categoryKey: 'news3_category', titleKey: 'news3_title', previewKey: 'news3_preview', readTime: '3', sourceKey: 'news3_source' },
];

const P = 'mb-5 text-lg leading-8 text-gray-700 dark:text-gray-300';
const H = 'text-3xl font-bold mb-6 leading-tight dark:text-white';

/** Full news article content — bilingual */
export const newsContent = {
  1: {
    en: `
      <h1 class="${H}">Ethiopia Celebrates the Inauguration of the MESOB Center – A New Era of Innovation and Convenience</h1>
      <p class="${P}">Ethiopia proudly marked a significant milestone with the official inauguration of the MESOB Center, a modern one-stop public service hub designed to transform the way citizens access government services.</p>
      <p class="${P}">The inauguration ceremony brought together senior government officials, development partners, representatives from public institutions, and invited guests to celebrate the launch of a center that reflects the country's commitment to digital transformation, transparency, and efficient public service delivery.</p>
      <p class="${P}">The MESOB Center integrates multiple government institutions under one roof, allowing citizens to access a wide range of services in a single location — from identification and documentation services to licensing, registration, and other essential government processes.</p>
      <p class="${P}">Government leaders emphasized that the MESOB Center represents a major step toward building a more citizen-centered public administration.</p>
    `,
    am: `
      <h1 class="${H}">ኢትዮጵያ የMESOB ማዕከልን መመስረት ታከብራለች – የፈጠራ እና ምቹነት አዲስ ዘመን</h1>
      <p class="${P}">ኢትዮጵያ የዜጎችን የመንግሥት አገልግሎት የማግኛ መንገድ ለመቀየር የተዘጋጀ ዘመናዊ አንድ ማቆሚያ የህዝብ አገልግሎት ማዕከል የሆነውን MESOB ማዕከልን በይፋ ስታቋቁም አስፈላጊ ምዕራፍ ላይ ደርሳለች።</p>
      <p class="${P}">የምስረታ ሥነ ሥርዓቱ ከፍተኛ የመንግሥት ባለሥልጣናት፣ የልማት አጋሮች፣ ከህዝባዊ ተቋማት ተወካዮች እና ተጋባዥ እንግዶችን ያሰባሰበ ሲሆን ሀገሪቱ ለዲጂታል ሽግግር፣ ለግልፅነት እና ለቀልጣፋ የህዝብ አገልግሎት ማቅረቢያ ያላትን ቁርጠኝነት ያሳያል።</p>
      <p class="${P}">MESOB ማዕከል ብዙ የመንግሥት ተቋማትን ከአንድ ጣሪያ ስር ያዋህዳል፣ ዜጎች ከምርመራ እና ሰነድ አገልግሎቶች አንስቶ እስከ ፈቃድ፣ ምዝገባ እና ሌሎች አስፈላጊ የመንግሥት ሂደቶች ድረስ ያሉ አገልግሎቶችን ከአንድ ቦታ ማግኘት እንዲችሉ ያደርጋል።</p>
      <p class="${P}">የመንግሥት ባለሥልጣናት MESOB ማዕከል የዜጋ ተኮር ህዝባዊ አስተዳደርን ለመገንባት ወሳኝ እርምጃ እንደሆነ አጽንኦት ሰጥተዋል።</p>
    `,
  },
  2: {
    en: `
      <h1 class="${H}">Leadership Introduction Program 2026</h1>
      <p class="${P}">The MESOB Center officially launched the Leadership Introduction Program 2026, an initiative designed to strengthen leadership capacity among public sector professionals and institutional managers.</p>
      <p class="${P}">The program brings together participants from various government organizations to develop practical leadership skills, promote ethical governance, and enhance decision-making capabilities.</p>
      <p class="${P}">Key focus areas include strategic planning, public service excellence, digital transformation, communication, teamwork, and organizational management.</p>
      <p class="${P}">This reflects MESOB Center's commitment to building a skilled and forward-thinking public service workforce.</p>
    `,
    am: `
      <h1 class="${H}">የአመራር ስልጠና ፕሮግራም 2026</h1>
      <p class="${P}">MESOB ማዕከል በይፋ የ2026 የአመራር ስልጠና ፕሮግራምን ጀምሯል፣ ይህም ለህዝባዊ ዘርፍ ባለሙያዎች እና ተቋማዊ አስተዳዳሪዎች የአመራር አቅምን ለማጠናከር የተዘጋጀ ተነሳሽነት ነው።</p>
      <p class="${P}">ፕሮግራሙ ከተለያዩ የመንግሥት ድርጅቶች ተሳታፊዎችን አሰባስቦ ተግባራዊ የአመራር ክህሎቶችን ለማዳበር፣ ሥነ ምግባራዊ አስተዳደርን ለማፋፋም እና የውሳኔ አሰጣጥ ችሎታን ለማሳደግ ያስችላል።</p>
      <p class="${P}">ዋና የትኩረት መስኮች ስትራቴጂካዊ ዕቅድ ማውጣት፣ የህዝብ አገልግሎት ብቃት፣ ዲጂታል ሽግግር፣ ግንኙነት፣ ቡድን ሥራ እና ድርጅታዊ አስተዳደርን ያካትታሉ።</p>
      <p class="${P}">ይህ ብቁ እና ወደፊት የሚያስብ የህዝብ አገልግሎት ሠራተኞችን ለመፍጠር MESOB ማዕከል ያለውን ቁርጠኝነት ያሳያል።</p>
    `,
  },
  3: {
    en: `
      <h1 class="${H}">FDRE MESOB Service Achieves 98.7% Citizen Satisfaction Rate</h1>
      <p class="${P}">The Federal Democratic Republic of Ethiopia (FDRE) MESOB Center has announced an outstanding citizen satisfaction rate of <strong>98.7%</strong>, reflecting its continued commitment to efficient, reliable, and citizen-centered public services.</p>
      <p class="${P}">Visitors highly appreciated the professionalism of customer service officers, the availability of modern digital systems, and the convenience of accessing multiple government services in one location.</p>
      <p class="${P}">MESOB Center officials emphasized that achieving 98.7% satisfaction is an important milestone — and they remain committed to continuous improvement.</p>
    `,
    am: `
      <h1 class="${H}">FDRE MESOB 98.7% የዜጎች እርካታ ደረጃ አሳካ</h1>
      <p class="${P}">የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ (FDRE) MESOB ማዕከል ቀልጣፋ፣ ታማኝ እና ዜጋ ተኮር አገልግሎቶችን ለማቅረብ ያለውን ቁርጠኝነት የሚያሳይ <strong>98.7%</strong> አስደናቂ የዜጎች እርካታ ደረጃ አስታወቀ።</p>
      <p class="${P}">ጎብኝዎች የደንበኞች አገልግሎት ሠራተኞችን ሙያዊነት፣ ዘመናዊ ዲጂታል ሥርዓቶች ተደራሽነት እና ከርካሽ ቦታ ብዙ የመንግሥት አገልግሎቶች ማግኘት ያለውን ምቾት አስደናቂ ሆኖ ያገኙት።</p>
      <p class="${P}">MESOB ማዕከል ባለሥልጣናት 98.7% እርካታ ማሳካት አስፈላጊ ምዕራፍ መሆኑን አጽንኦት ሰጥተው — ቀጣይ መሻሻልን ለማድረግ ቁርጠኞች ናቸው።</p>
    `,
  },
};

export const videosData = [
  { id: 'RW5YfmmAF5o', titleKey: 'video1_title', descKey: 'video1_desc' },
  { id: 'C8RNlxG6aK4', titleKey: 'video2_title', descKey: 'video2_desc' },
  { id: '8AJfJG8zn3w', titleKey: 'video3_title', descKey: 'video3_desc' },
  { id: 'fIjm0jY5S3o', titleKey: 'video4_title', descKey: 'video4_desc' },
];
