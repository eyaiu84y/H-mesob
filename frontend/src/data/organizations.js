/**
 * organizationsData - Complete MESOB Service Catalogue
 * Source: Official MESOB PDF Document
 * Each org: name_en, name_am, officialUrl
 * Each service: title_en, title_am, time, fee, officialUrl, docs_en[], docs_am[]
 */
export const organizationsData = [
  {
    id: "electric",
    name_en: "Ethiopian Electric Utility",
    name_am: "የኢትዮጵያ ኤሌክትሪክ አገልግሎት",
    image: "/image/ethio electric.png",
    officialUrl: "https://eeu.gov.et",
    services: [
      {
        title_en: "Electricity Bill Payment",
        title_am: "የኤሌክትሪክ ክፍያ ማስታወሻ",
        time: "Instant",
        fee: "As per consumption",
        officialUrl: "https://eeu.gov.et",
        docs_en: [
          "Customer account number",
          "Payment method (cash, bank transfer, mobile money)"
        ],
        docs_am: [
          "የደንበኛ ሂሳብ ቁጥር",
          "የክፍያ ዘዴ (ጥሬ ገንዘብ፣ የባንክ ዝውውር፣ ሞባይል ገንዘብ)"
        ],
      },
    ],
  },
  {
    id: "revenue",
    name_en: "Revenues Bureau",
    name_am: "ገቢዎች ባለስልጣን",
    image: "/image/revenue.jpg",
    officialUrl: "https://www.aarevenue.gov.et",
    services: [
      {
        title_en: "Tax Payment",
        title_am: "የታክስ ክፍያ",
        time: "Instant to Same Day",
        fee: "As per tax assessment",
        officialUrl: "https://www.aarevenue.gov.et",
        docs_en: [
          "TIN (Taxpayer Identification Number)",
          "Tax assessment notice",
          "Payment receipt or confirmation"
        ],
        docs_am: [
          "የታክስ ከፋይ መለያ ቁጥር (TIN)",
          "የታክስ ግምገማ ማስታወቂያ",
          "የክፍያ ደረሰኝ ወይም ማረጋገጫ"
        ],
      },
    ],
  },
  {
    id: "justice",
    name_en: "Ministry of Justice",
    name_am: "የፍትህ ሚኒስቴር",
    image: "/image/ፍትሕ መምሪያ አገልግሎት.jpg",
    officialUrl: "https://justice.gov.et/en",
    services: [
      {
        title_en: "Issuance of Practice Licenses for Federal Attorneys",
        title_am: "ለፌዴራል ጠበቆች የልምምድ ፈቃድ አሰጣጥ",
        time: "5 days",
        fee: "400 Birr",
        officialUrl: "https://justice.gov.et/en",
        docs_en: [
          "National ID card",
          "Educational qualification/degree credentials",
          "Documented proof of legal work experience",
          "Letter of good conduct/character reference",
          "Clearance/release letter from the previous employer",
          "Police clearance/criminal record check letter",
          "Entrance competency exam result (if entry via examination is required)",
          "Signed Oath of Office (Note: This must be done in person and cannot be executed via a Power of Attorney)",
          "Legal Power of Attorney (applicable only for the delivery/submission of files)"
        ],
        docs_am: [
          "የብሔራዊ መታወቂያ ካርድ",
          "የትምህርት ብቃት/የዲግሪ ማረጋገጫዎች",
          "የሕግ ሥራ ልምድ የተመዘገበ ማስረጃ",
          "የመልካም ስነምግባር ደብዳቤ/የባህሪ ማጣቀሻ",
          "ከቀድሞው ቀጣሪ የተሰጠ የፈቃድ/የመልቀቂያ ደብዳቤ",
          "የፖሊስ ማረጋገጫ/የወንጀል መዝገብ ማረጋገጫ ደብዳቤ",
          "የመግቢያ ብቃት ፈተና ውጤት (በፈተና በኩል መግባት ከተፈለገ)",
          "የተፈረመ የቃለ መሓላ (ማስታወሻ: ይህ በአካል መከናወን አለበት እና በውክልና ሥልጣን ሊፈጸም አይችልም)",
          "የሕግ ውክልና ሥልጣን (ለፋይሎች ማድረስ/ማቅረብ ብቻ የሚተገበር)"
        ],
      },
      {
        title_en: "Renewal of Federal Attorney Practice Licenses",
        title_am: "የፌዴራል ጠበቃ የልምምድ ፈቃድ ማደስ",
        time: "15 minutes",
        fee: "300 Birr",
        officialUrl: "https://justice.gov.et/en",
        docs_en: [
          "National ID card",
          "Pro bono legal service performance report",
          "A valid tax/business license issued by the Revenues Authority",
          "Legal Power of Attorney (applicable only for the delivery/submission of files)",
          "Penalty fee receipt (required if the standard renewal deadline has passed)"
        ],
        docs_am: [
          "የብሔራዊ መታወቂያ ካርድ",
          "ነፃ የሕግ አገልግሎት አፈጻጸም ሪፖርት",
          "በገቢዎች ባለስልጣን የተሰጠ ትክክለኛ የታክስ/የንግድ ፈቃድ",
          "የሕግ ውክልና ሥልጣን (ለፋይሎች ማድረስ/ማቅረብ ብቻ የሚተገበር)",
          "የቅጣት ክፍያ ደረሰኝ (መደበኛው የማደስ ቀነ ገደብ ካለፈ የሚያስፈልግ)"
        ],
      },
      {
        title_en: "Upgrading of Federal Attorney Practice Licenses",
        title_am: "የፌዴራል ጠበቃ የልምምድ ፈቃድ ማሻሻያ",
        time: "5 days",
        fee: "400 Birr",
        officialUrl: "https://justice.gov.et/en",
        docs_en: [
          "The previously issued Federal First Instance Court advocacy/practice license",
          "Educational qualification/degree credentials",
          "Documented proof of legal work experience",
          "Letter of good conduct/character reference",
          "Clearance/release letter from the previous employer",
          "Police clearance/criminal record check letter",
          "Entrance competency exam result (if entry via examination is required)",
          "Signed Oath of Office (Note: This must be done in person and cannot be executed via a Power of Attorney)",
          "Legal Power of Attorney (applicable only for the delivery/submission of files)"
        ],
        docs_am: [
          "ቀደም ሲል የተሰጠው የፌዴራል የመጀመሪያ ደረጃ ፍርድ ቤት የድጋፍ/የልምምድ ፈቃድ",
          "የትምህርት ብቃት/የዲግሪ ማረጋገጫዎች",
          "የሕግ ሥራ ልምድ የተመዘገበ ማስረጃ",
          "የመልካም ስነምግባር ደብዳቤ/የባህሪ ማጣቀሻ",
          "ከቀድሞው ቀጣሪ የተሰጠ የፈቃድ/የመልቀቂያ ደብዳቤ",
          "የፖሊስ ማረጋገጫ/የወንጀል መዝገብ ማረጋገጫ ደብዳቤ",
          "የመግቢያ ብቃት ፈተና ውጤት (በፈተና በኩል መግባት ከተፈለገ)",
          "የተፈረመ የቃለ መሓላ (ማስታወሻ: ይህ በአካል መከናወን አለበት እና በውክልና ሥልጣን ሊፈጸም አይችልም)",
          "የሕግ ውክልና ሥልጣን (ለፋይሎች ማድረስ/ማቅረብ ብቻ የሚተገበር)"
        ],
      },
    ],
  },
  {
    id: "cbe",
    name_en: "Commercial Bank of Ethiopia",
    name_am: "የኢትዮጵያ ንግድ ባንክ",
    image: "/image/cbe.jpg",
    officialUrl: "https://combanketh.et",
    services: [
      {
        title_en: "Account Opening",
        title_am: "ሂሳብ መክፈቻ",
        time: "25 minutes",
        fee: "None",
        officialUrl: "https://combanketh.et",
        docs_en: [
          "Valid Identification: Original and copy of your National ID (Fayda) / Renewed Resident ID or Passport",
          "Photographs: Recent passport-size photographs",
          "Mobile Number: An active mobile number registered in the applicant's name",
          "Initial Deposit"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: የብሔራዊ መታወቂያ ዋና እና ቅጂ (ፋይዳ) / የታደሰ የነዋሪ መታወቂያ ወይም ፓስፖርት",
          "ፎቶግራፎች: የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፎች",
          "የሞባይል ቁጥር: በማመልከቻው ስም የተመዘገበ ንቁ የሞባይል ቁጥር",
          "የመጀመሪያ ተቀማጭ"
        ],
      },
      {
        title_en: "Mobile Banking",
        title_am: "የሞባይል ባንክ አገልግሎት",
        time: "5 minutes",
        fee: "None",
        officialUrl: "https://combanketh.et",
        docs_en: [
          "Valid Identification: National ID (Fayda) / Renewed Resident ID or Passport",
          "A Bank Account"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ (ፋይዳ) / የታደሰ የነዋሪ መታወቂያ ወይም ፓስፖርት",
          "የባንክ ሂሳብ"
        ],
      },
    ],
  },
  {
    id: "ethiotel",
    name_en: "Ethio Telecom",
    name_am: "ኢትዮ ቴሌኮም",
    image: "/image/ethiotel.png",
    officialUrl: "https://www.ethiotelecom.et",
    services: [
      {
        title_en: "New SIM Card Registration",
        title_am: "አዲስ ሲም ካርድ ምዝገባ",
        time: "Stage 1: 1 to 3 Minutes, Stage 2: 5 to 10 Minutes, Stage 3: 1 Day",
        fee: "Standard: 50 ETB, VIP: 1,000 ETB",
        officialUrl: "https://www.ethiotelecom.et",
        docs_en: [
          "Valid Identification: Original and copy of National ID (Fayda) / Renewed Resident ID or Passport",
          "Photograph: Passport-size photo (for manual registration)",
          "Application Form: Completed SIM registration form"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: የብሔራዊ መታወቂያ ዋና እና ቅጂ (ፋይዳ) / የታደሰ የነዋሪ መታወቂያ ወይም ፓስፖርት",
          "ፎቶግራፍ: የፓስፖርት መጠን ፎቶ (ለእጅ ምዝገባ)",
          "የማመልከቻ ቅጽ: የተሞላ የሲም ምዝገባ ቅጽ"
        ],
      },
      {
        title_en: "Telebirr Registration and Services",
        title_am: "ቴሌብር ምዝገባ እና አገልግሎቶች",
        time: "Instant",
        fee: "None (Transaction fees may apply)",
        officialUrl: "https://www.ethiotelecom.et",
        docs_en: [
          "Active Ethio Telecom SIM card",
          "National ID (Fayda) or valid ID for verification",
          "PIN setup for security"
        ],
        docs_am: [
          "ንቁ የኢትዮ ቴሌኮም ሲም ካርድ",
          "ብሔራዊ መታወቂያ (ፋይዳ) ወይም ለማረጋገጥ ትክክለኛ መታወቂያ",
          "ለደህንነት የፒን ማዋቀር"
        ],
      },
    ],
  },
  {
    id: "ethiopost",
    name_en: "Ethiopian Postal Service Enterprise",
    name_am: "የኢትዮጵያ ፖስታ አገልግሎት ድርጅት",
    image: "/image/Ethiopost-2.jpg",
    officialUrl: "https://ethio.post",
    services: [
      {
        title_en: "P.O. Box Rental",
        title_am: "የፖስታ ሳጥን ኪራይ",
        time: "Same Day",
        fee: "Varies by box size and location",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Valid Identification: National ID or Passport",
          "Application Form: Completed at the postal office",
          "Payment: Annual or semi-annual rental fee"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ ወይም ፓስፖርት",
          "የማመልከቻ ቅጽ: በፖስታ ቤት የተሞላ",
          "ክፍያ: ዓመታዊ ወይም ግማሽ ዓመት የኪራይ ክፍያ"
        ],
      },
      {
        title_en: "Domestic Parcel and Letter Services",
        title_am: "የሀገር ውስጥ ጥቅል እና ደብዳቤ አገልግሎቶች",
        time: "1 to 7 Days (depending on destination)",
        fee: "Based on weight and destination",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender's Information: Full name, address, and contact number",
          "Recipient's Information: Full name, address, and contact number",
          "Package Details: Contents description for customs (if applicable)"
        ],
        docs_am: [
          "የላኪ መረጃ: ሙሉ ስም፣ አድራሻ እና የግንኙነት ቁጥር",
          "የተቀባይ መረጃ: ሙሉ ስም፣ አድራሻ እና የግንኙነት ቁጥር",
          "የጥቅል ዝርዝር: ለጉምሩክ የይዘት መግለጫ (ከተፈለገ)"
        ],
      },
      {
        title_en: "International Parcel and Letter Services",
        title_am: "ዓለም አቀፍ ጥቅል እና ደብዳቤ አገልግሎቶች",
        time: "5 to 21 Days (depending on destination)",
        fee: "Based on weight, destination, and service type",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender's Information: Full name, address, and contact",
          "Recipient's Information: Full name, address, and contact in the destination country",
          "Customs Declaration: Detailed contents description and value",
          "Payment: International postage fee"
        ],
        docs_am: [
          "የላኪ መረጃ: ሙሉ ስም፣ አድራሻ እና ግንኙነት",
          "የተቀባይ መረጃ: በመድረሻ ሀገር ውስጥ ሙሉ ስም፣ አድራሻ እና ግንኙነት",
          "የጉምሩክ መግለጫ: ዝርዝር የይዘት መግለጫ እና ዋጋ",
          "ክፍያ: ዓለም አቀፍ የፖስታ ክፍያ"
        ],
      },
      {
        title_en: "Express Mail Service (EMS)",
        title_am: "ፈጣን የፖስታ አገልግሎት (EMS)",
        time: "1 to 3 Days (domestic), 3 to 7 Days (international)",
        fee: "Premium rates based on weight and destination",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender and Recipient Details",
          "Package Contents: Detailed description",
          "Customs Forms: For international EMS",
          "Payment: EMS fee"
        ],
        docs_am: [
          "የላኪ እና ተቀባይ ዝርዝሮች",
          "የጥቅል ይዘቶች: ዝርዝር መግለጫ",
          "የጉምሩክ ቅጾች: ለዓለም አቀፍ EMS",
          "ክፍያ: የEMS ክፍያ"
        ],
      },
      {
        title_en: "Postal Money Order",
        title_am: "የፖስታ ገንዘብ ትዕዛዝ",
        time: "Same Day to 3 Days",
        fee: "Service charge based on amount sent",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender's Identification: National ID",
          "Recipient's Full Name and Address",
          "Amount to Send",
          "Service Fee Payment"
        ],
        docs_am: [
          "የላኪ መታወቂያ: ብሔራዊ መታወቂያ",
          "የተቀባይ ሙሉ ስም እና አድራሻ",
          "ለመላክ የሚፈለግ መጠን",
          "የአገልግሎት ክፍያ ክፍያ"
        ],
      },
      {
        title_en: "Philatelic Services (Stamp Collection)",
        title_am: "ፊላቴሊክ አገልግሎቶች (የማህተም ስብስብ)",
        time: "Instant",
        fee: "Varies by stamp type",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Interest in stamp collection",
          "Payment for stamps"
        ],
        docs_am: [
          "በማህተም ስብስብ ላይ ፍላጎት",
          "ለማህተሞች ክፍያ"
        ],
      },
      {
        title_en: "Courier Services",
        title_am: "የኩሪየር አገልግሎቶች",
        time: "Same Day to 3 Days (depending on service level)",
        fee: "Based on weight, destination, and urgency",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender and Recipient Information",
          "Package Contents Description",
          "Service Level Selection: Standard or Express",
          "Payment"
        ],
        docs_am: [
          "የላኪ እና ተቀባይ መረጃ",
          "የጥቅል ይዘት መግለጫ",
          "የአገልግሎት ደረጃ ምርጫ: መደበኛ ወይም ፈጣን",
          "ክፍያ"
        ],
      },
      {
        title_en: "Registered Mail",
        title_am: "የተመዘገበ ፖስታ",
        time: "3 to 7 Days",
        fee: "Based on weight and destination",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Sender's Information",
          "Recipient's Full Address",
          "Contents Description",
          "Registration Fee Payment"
        ],
        docs_am: [
          "የላኪ መረጃ",
          "የተቀባይ ሙሉ አድራሻ",
          "የይዘት መግለጫ",
          "የምዝገባ ክፍያ ክፍያ"
        ],
      },
      {
        title_en: "Bill Payment Services",
        title_am: "የሂሳብ ክፍያ አገልግሎቶች",
        time: "Instant",
        fee: "Small service charge",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Bill or Invoice",
          "Payment Amount",
          "Service Charge"
        ],
        docs_am: [
          "ሂሳብ ወይም ደረሰኝ",
          "የክፍያ መጠን",
          "የአገልግሎት ክፍያ"
        ],
      },
      {
        title_en: "Postal Banking Services",
        title_am: "የፖስታ ባንክ አገልግሎቶች",
        time: "Same Day",
        fee: "None for account opening; transaction fees may apply",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Valid Identification: National ID or Passport",
          "Passport-size Photograph",
          "Minimum Deposit (if required)",
          "Application Form"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ ወይም ፓስፖርት",
          "የፓስፖርት መጠን ፎቶግራፍ",
          "ዝቅተኛ ተቀማጭ (ከተፈለገ)",
          "የማመልከቻ ቅጽ"
        ],
      },
      {
        title_en: "Track and Trace Services",
        title_am: "ክትትል እና ፍለጋ አገልግሎቶች",
        time: "Instant",
        fee: "None",
        officialUrl: "https://ethio.post",
        docs_en: [
          "Tracking Number from Receipt"
        ],
        docs_am: [
          "ከደረሰኝ የመከታተያ ቁጥር"
        ],
      },
    ],
  },
  {
    id: "investment",
    name_en: "Investment Commission",
    name_am: "ኢንቨስትመንት ኮሚሽን",
    image: "/image/መሬት አስተዳደርና ኢንቨስትመንት ልማት.jpg",
    officialUrl: "https://investethiopia.gov.et",
    services: [
      {
        title_en: "Investment License / Permit",
        title_am: "የኢንቨስትመንት ፈቃድ / ፍቃድ",
        time: "5 to 15 Working Days",
        fee: "Varies by investment size and sector",
        officialUrl: "https://investethiopia.gov.et",
        docs_en: [
          "Business Plan: Detailed proposal outlining the investment project",
          "Valid Identification: National ID or Passport",
          "Educational and Professional Credentials: Copies of relevant qualifications",
          "Capital Verification: Proof of financial capacity (bank statement, capital verification letter)",
          "Land or Premises: Lease agreement or ownership documents for business location",
          "Environmental Impact Assessment (EIA): If applicable to the sector",
          "Application Form: Completed investment application",
          "Payment Receipt: License fee payment confirmation"
        ],
        docs_am: [
          "የንግድ እቅድ: የኢንቨስትመንት ፕሮጀክትን የሚገልጽ ዝርዝር ሀሳብ",
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ ወይም ፓስፖርት",
          "የትምህርት እና ሙያዊ ማረጋገጫዎች: ተዛማጅ ብቃቶች ቅጂዎች",
          "የካፒታል ማረጋገጫ: የገንዘብ አቅም ማስረጃ (የባንክ መግለጫ፣ የካፒታል ማረጋገጫ ደብዳቤ)",
          "መሬት ወይም ቦታ: ለንግድ ቦታ የኪራይ ስምምነት ወይም የባለቤትነት ሰነዶች",
          "የአካባቢ ተፅእኖ ግምገማ (EIA): ለዘርፉ ከተፈለገ",
          "የማመልከቻ ቅጽ: የተሞላ የኢንቨስትመንት ማመልከቻ",
          "የክፍያ ደረሰኝ: የፈቃድ ክፍያ ክፍያ ማረጋገጫ"
        ],
      },
    ],
  },
  {
    id: "labor",
    name_en: "Labor and Skills Bureau",
    name_am: "ሠራተኛ እና ክህሎት ቢሮ",
    image: "/image/ሥራና ክህሎት.png",
    officialUrl: "https://mols.gov.et",
    services: [
      {
        title_en: "Issuance of a New Work Permit for Foreign Nationals",
        title_am: "ለውጭ ዜጎች አዲስ የሥራ ፈቃድ አሰጣጥ",
        time: "30 minutes",
        fee: "2000 ETB",
        officialUrl: "https://mols.gov.et",
        docs_en: [
          "A passport-sized photograph (3 × 4 cm)",
          "A formal application letter",
          "A letter of authorization/Power of Attorney (along with the authorized representative's Kebele and company ID cards). Additionally, the company's Business License, Minutes of the meeting, and Memorandum of Association must be attached",
          "A valid passport (with at least six months of remaining validity)",
          "A valid (unexpired) entry visa and airport arrival stamp",
          "An employment contract (accompanied by the company's Business License, Minutes of the meeting, and Memorandum of Association)",
          "A letter of support from the relevant government institution (accompanied by the company's Business License, Minutes of the meeting, and Memorandum of Association)",
          "Authenticated educational credentials (verified/authenticated by the Ministry of Foreign Affairs). Additionally, the hiring company's Business License, Minutes of the meeting, and Memorandum of Association must be attached",
          "A professional Certificate of Competency (specifically required from the Ministry of Health for professionals entering the healthcare sector)",
          "Proof of fee payment (processed via Telebirr)"
        ],
        docs_am: [
          "የፓስፖርት መጠን ያለው ፎቶግራፍ (3 × 4 ሴ.ሜ)",
          "መደበኛ የማመልከቻ ደብዳቤ",
          "የውክልና ደብዳቤ/የውክልና ሥልጣን (ከተወካዩ የቀበሌ እና የኩባንያ መታወቂያ ካርዶች ጋር). በተጨማሪም የኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ መያያዝ አለባቸው",
          "ትክክለኛ ፓስፖርት (ቢያንስ ለስድስት ወራት የሚቀርበት)",
          "ትክክለኛ (ጊዜው ያላለፈ) የመግቢያ ቪዛ እና የአየር ማረፊያ መድረሻ ማህተም",
          "የሥራ ውል (ከኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ ጋር)",
          "ከተዛማጅ መንግስታዊ ተቋም የድጋፍ ደብዳቤ (ከኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ ጋር)",
          "የተረጋገጡ የትምህርት ማረጋገጫዎች (በውጭ ጉዳይ ሚኒስቴር የተረጋገጠ). በተጨማሪም የቀጣሪው ኩባንያ የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ መያያዝ አለባቸው",
          "የሙያ ብቃት ምስክር ወረቀት (በተለይ ወደ ጤና ዘርፍ ለሚገቡ ባለሙያዎች ከጤና ሚኒስቴር የሚያስፈልግ)",
          "የክፍያ ማስረጃ (በቴሌብር የተሰራ)"
        ],
      },
      {
        title_en: "Work Permit Renewal for Foreign Nationals",
        title_am: "ለውጭ ዜጎች የሥራ ፈቃድ ማደስ",
        time: "20 minutes",
        fee: "1500 ETB",
        officialUrl: "https://mols.gov.et",
        docs_en: [
          "A valid passport (with at least six months of remaining validity)",
          "A passport-sized photograph (3 × 4 cm)",
          "A formal application letter",
          "A letter of authorization/Power of Attorney (along with the authorized representative's Kebele and company ID cards). Additionally, the company's Business License, Minutes of the meeting, and Memorandum of Association must be attached",
          "The current work permit ID and valid residence permit",
          "An employment contract (accompanied by the company's Business License, Minutes of the meeting, and Memorandum of Association)",
          "A letter of support from the relevant government institution (accompanied by the company's Business License, Minutes of the meeting, and Memorandum of Association)",
          "Authenticated educational credentials (verified/authenticated by the Ministry of Foreign Affairs). Additionally, the hiring company's Business License, Minutes of the meeting, and Memorandum of Association must be attached",
          "A renewed Business/Investment License of the employing organization",
          "Proof of fee payment (processed via Telebirr)"
        ],
        docs_am: [
          "ትክክለኛ ፓስፖርት (ቢያንስ ለስድስት ወራት የሚቀርበት)",
          "የፓስፖርት መጠን ያለው ፎቶግራፍ (3 × 4 ሴ.ሜ)",
          "መደበኛ የማመልከቻ ደብዳቤ",
          "የውክልና ደብዳቤ/የውክልና ሥልጣን (ከተወካዩ የቀበሌ እና የኩባንያ መታወቂያ ካርዶች ጋር). በተጨማሪም የኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ መያያዝ አለባቸው",
          "ያለው የሥራ ፈቃድ መታወቂያ እና ትክክለኛ የመኖሪያ ፈቃድ",
          "የሥራ ውል (ከኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ ጋር)",
          "ከተዛማጅ መንግስታዊ ተቋም የድጋፍ ደብዳቤ (ከኩባንያው የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ ጋር)",
          "የተረጋገጡ የትምህርት ማረጋገጫዎች (በውጭ ጉዳይ ሚኒስቴር የተረጋገጠ). በተጨማሪም የቀጣሪው ኩባንያ የንግድ ፈቃድ፣ የስብሰባ ፕሮቶኮል እና የመመስረቻ ደንብ መያያዝ አለባቸው",
          "የቀጣሪ ድርጅት የታደሰ የንግድ/የኢንቨስትመንት ፈቃድ",
          "የክፍያ ማስረጃ (በቴሌብር የተሰራ)"
        ],
      },
    ],
  },
  {
    id: "trade",
    name_en: "Trade Bureau",
    name_am: "ንግድ ቢሮ",
    image: "/image/ንግድና ገበያ.jpg",
    officialUrl: "https://motri.gov.et/en",
    services: [
      {
        title_en: "New Business Registration",
        title_am: "አዲስ የንግድ ምዝገባ",
        time: "1 to 3 Working Days",
        fee: "Varies by business type",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Valid Identification: National ID (Fayda) or Passport (for foreign investors)",
          "Business Name Reservation: Certificate of reserved business name",
          "Memorandum and Articles of Association: For companies and partnerships",
          "Capital Verification: Bank statement or capital deposit certificate",
          "TIN: Taxpayer Identification Number",
          "Business Address: Lease agreement or ownership document",
          "Passport-size Photographs: For individual applicants",
          "Application Form: Completed business registration form",
          "Payment Receipt: Registration fee confirmation"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ (ፋይዳ) ወይም ፓስፖርት (ለውጭ ባለሃብቶች)",
          "የንግድ ስም ማስያዣ: የተያዘ የንግድ ስም ምስክር ወረቀት",
          "የማስታወሻ እና የመመስረቻ ደንብ: ለኩባንያዎች እና አጋርነቶች",
          "የካፒታል ማረጋገጫ: የባንክ መግለጫ ወይም የካፒታል ተቀማጭ ምስክር ወረቀት",
          "TIN: የታክስ ከፋይ መለያ ቁጥር",
          "የንግድ አድራሻ: የኪራይ ስምምነት ወይም የባለቤትነት ሰነድ",
          "የፓስፖርት መጠን ፎቶግራፎች: ለግለሰብ አመልካቾች",
          "የማመልከቻ ቅጽ: የተሞላ የንግድ ምዝገባ ቅጽ",
          "የክፍያ ደረሰኝ: የምዝገባ ክፍያ ማረጋገጫ"
        ],
      },
      {
        title_en: "Business License Renewal",
        title_am: "የንግድ ፈቃድ ታዳሽ",
        time: "Same Day to 2 Days",
        fee: "Varies by business type",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Existing Business License",
          "TIN Certificate",
          "Tax Clearance Certificate",
          "Renewal Application Form",
          "Payment Receipt"
        ],
        docs_am: [
          "ያለው የንግድ ፈቃድ",
          "የTIN ምስክር ወረቀት",
          "የታክስ ማረጋገጫ ምስክር ወረቀት",
          "የታዳሽ ማመልከቻ ቅጽ",
          "የክፍያ ደረሰኝ"
        ],
      },
      {
        title_en: "Trade Name Reservation",
        title_am: "የንግድ ስም ማስያዣ",
        time: "Same Day",
        fee: "50 Birr",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Proposed Business Name",
          "National ID",
          "Application Form",
          "Payment Receipt"
        ],
        docs_am: [
          "የታቀደ የንግድ ስም",
          "ብሔራዊ መታወቂያ",
          "የማመልከቻ ቅጽ",
          "የክፍያ ደረሰኝ"
        ],
      },
      {
        title_en: "Import/Export License",
        title_am: "የማስመጣት/የመላኪያ ፈቃድ",
        time: "3 to 7 Working Days",
        fee: "Varies",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Business Registration Certificate",
          "TIN Certificate",
          "Bank Account Details",
          "Warehouse or Storage Facility Document",
          "Application Form",
          "Payment Receipt"
        ],
        docs_am: [
          "የንግድ ምዝገባ ምስክር ወረቀት",
          "የTIN ምስክር ወረቀት",
          "የባንክ ሂሳብ ዝርዝሮች",
          "መጋዘን ወይም ማከማቻ ተቋም ሰነድ",
          "የማመልከቻ ቅጽ",
          "የክፍያ ደረሰኝ"
        ],
      },
      {
        title_en: "Certificate of Origin",
        title_am: "የመነሻ ምስክር ወረቀት",
        time: "Same Day to 2 Days",
        fee: "Varies",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Export License",
          "Commercial Invoice",
          "Product Details and Origin Documentation",
          "Application Form",
          "Payment Receipt"
        ],
        docs_am: [
          "የመላኪያ ፈቃድ",
          "የንግድ ደረሰኝ",
          "የምርት ዝርዝሮች እና የመነሻ ሰነድ",
          "የማመልከቻ ቅጽ",
          "የክፍያ ደረሰኝ"
        ],
      },
      {
        title_en: "Consumer Protection Services",
        title_am: "የሸማቾች ጥበቃ አገልግሎቶች",
        time: "Varies",
        fee: "None",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Complaint Form",
          "Supporting Documents (receipts, contracts, photos)",
          "National ID"
        ],
        docs_am: [
          "የቅሬታ ቅጽ",
          "ድጋፍ ሰጪ ሰነዶች (ደረሰኞች፣ ውሎች፣ ፎቶዎች)",
          "ብሔራዊ መታወቂያ"
        ],
      },
      {
        title_en: "Fair Trade Practice Certification",
        title_am: "ፍትሃዊ ንግድ ልምምድ ምስክር ወረቀት",
        time: "Varies",
        fee: "Varies",
        officialUrl: "https://motri.gov.et/en",
        docs_en: [
          "Business Registration",
          "Compliance Documentation",
          "Inspection Report",
          "Application Form"
        ],
        docs_am: [
          "የንግድ ምዝገባ",
          "የማክበር ሰነድ",
          "የምርመራ ሪፖርት",
          "የማመልከቻ ቅጽ"
        ],
      },
    ],
  },
  {
    id: "construction",
    name_en: "Construction Authority",
    name_am: "ግንባታ ባለስልጣን",
    image: "/image/ልማት.jpg",
    officialUrl: "", // Official URL not available in approved source
    services: [
      {
        title_en: "Building Permit",
        title_am: "የግንባታ ፈቃድ",
        time: "15 to 30 Working Days",
        fee: "Varies by project size",
        officialUrl: "", // Official URL not available in approved source
        docs_en: [
          "Land Title or Lease Agreement",
          "Architectural Drawings: Approved by certified architect",
          "Structural Drawings: Approved by certified engineer",
          "Site Plan",
          "Environmental Impact Assessment (if applicable)",
          "Proof of Ownership or Lease",
          "National ID or Business License",
          "Application Form",
          "Payment Receipt"
        ],
        docs_am: [
          "የመሬት ርዕስ ወይም የኪራይ ስምምነት",
          "የስነ-ህንፃ ስዕሎች: በተረጋገጠ አርክቴክት የተፈቀደ",
          "መዋቅራዊ ስዕሎች: በተረጋገጠ መሐንዲስ የተፈቀደ",
          "የቦታ እቅድ",
          "የአካባቢ ተፅእኖ ግምገማ (ከተፈለገ)",
          "የባለቤትነት ወይም የኪራይ ማስረጃ",
          "ብሔራዊ መታወቂያ ወይም የንግድ ፈቃድ",
          "የማመልከቻ ቅጽ",
          "የክፍያ ደረሰኝ"
        ],
      },
    ],
  },
  {
    id: "fayda",
    name_en: "National ID Program / Fayda",
    name_am: "ብሔራዊ መታወቂያ ፕሮግራም / ፋይዳ",
    image: "/image/fayda.png",
    officialUrl: "https://www.id.gov.et",
    services: [
      {
        title_en: "Fayda National Digital ID Registration (New ID)",
        title_am: "ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ምዝገባ (አዲስ መታወቂያ)",
        time: "Stage 1: 1 to 3 Minutes, Stage 2: 5 to 10 Minutes, Stage 3: 1 Day",
        fee: "100 Birr",
        officialUrl: "https://www.id.gov.et",
        docs_en: [
          "Birth Certificate or Previous ID",
          "Kebele ID or local government support letter",
          "Two passport-size photographs",
          "Proof of residence (utility bill, lease agreement)",
          "Biometric data capture at registration center"
        ],
        docs_am: [
          "የልደት ምስክር ወረቀት ወይም ቀዳሚ መታወቂያ",
          "የቀበሌ መታወቂያ ወይም የአካባቢ መንግስት ድጋፍ ደብዳቤ",
          "ሁለት የፓስፖርት መጠን ፎቶግራፎች",
          "የመኖሪያ ማስረጃ (የመገልገያ ሂሳብ፣ የኪራይ ስምምነት)",
          "በምዝገባ ማእከል የባዮሜትሪክ ዳታ ቅንጥብ"
        ],
      },
      {
        title_en: "Fayda Demographic and Biometric Data Update / Renewal",
        title_am: "ፋይዳ ስነ-ሕዝብ እና ባዮሜትሪክ ዳታ ማሻሻያ / ታዳሽ",
        time: "Stage 1: 1 to 3 Minutes, Stage 2: 5 to 10 Minutes, Stage 3: 1 Day",
        fee: "50 Birr",
        officialUrl: "https://www.id.gov.et",
        docs_en: [
          "Existing Fayda ID or registration slip",
          "Supporting documents for changes (marriage certificate, court order, etc.)",
          "Proof of residence (if address changed)",
          "One passport-size photograph"
        ],
        docs_am: [
          "ያለው ፋይዳ መታወቂያ ወይም የምዝገባ ስሊፕ",
          "ለለውጦች ድጋፍ ሰጪ ሰነዶች (የጋብቻ ምስክር ወረቀት፣ የፍርድ ቤት ትእዛዝ፣ ወዘተ)",
          "የመኖሪያ ማስረጃ (አድራሻ ከተቀየረ)",
          "አንድ የፓስፖርት መጠን ፎቶግራፍ"
        ],
      },
      {
        title_en: "Fayda National Digital ID Replacement (Lost / Damaged)",
        title_am: "ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ምትክ (ጠፍቷል / ተበላሽቷል)",
        time: "Stage 1: 1 to 3 Minutes, Stage 2: 5 to 10 Minutes, Stage 3: 1 Day",
        fee: "200 Birr",
        officialUrl: "https://www.id.gov.et",
        docs_en: [
          "Police report (for lost ID)",
          "Existing damaged ID (if applicable)",
          "Registration / Fayda Number",
          "One passport-size photograph"
        ],
        docs_am: [
          "የፖሊስ ሪፖርት (ለጠፋ መታወቂያ)",
          "ያለው የተበላሸ መታወቂያ (ከተፈለገ)",
          "ምዝገባ / ፋይዳ ቁጥር",
          "አንድ የፓስፖርት መጠን ፎቶግራፍ"
        ],
      },
      {
        title_en: "Fayda National Digital ID Grievance and Dispute Resolution System (Level 1)",
        title_am: "ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ቅሬታ እና ክርክር መፍትሄ ስርዓት (ደረጃ 1)",
        time: "3 to 7 Minutes",
        fee: "100 Birr",
        officialUrl: "https://www.id.gov.et",
        docs_en: [
          "Registration / Fayda Number",
          "The name and phone number used during the initial registration"
        ],
        docs_am: [
          "ምዝገባ / ፋይዳ ቁጥር",
          "በመጀመሪያው ምዝገባ ወቅት የተጠቀሙበት ስም እና ስልክ ቁጥር"
        ],
      },
    ],
  },
  {
    id: "sidama-bank",
    name_en: "Sidama Bank",
    name_am: "ሲዳማ ባንክ",
    image: "/image/የሲዳማ ባንክ አገልግሎት.png",
    officialUrl: "https://sidamabanksc.com",
    services: [
      {
        title_en: "Account Opening",
        title_am: "ሂሳብ መክፈቻ",
        time: "25 minutes",
        fee: "None",
        officialUrl: "https://sidamabanksc.com",
        docs_en: [
          "Valid Identification: Original and copy of your National ID (Fayda) / Renewed Resident ID or Passport",
          "Photographs: Recent passport-size photographs",
          "Mobile Number: An active mobile number registered in the applicant's name",
          "Initial Deposit"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: የብሔራዊ መታወቂያ ዋና እና ቅጂ (ፋይዳ) / የታደሰ የነዋሪ መታወቂያ ወይም ፓስፖርት",
          "ፎቶግራፎች: የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፎች",
          "የሞባይል ቁጥር: በማመልከቻው ስም የተመዘገበ ንቁ የሞባይል ቁጥር",
          "የመጀመሪያ ተቀማጭ"
        ],
      },
      {
        title_en: "Mobile Banking",
        title_am: "የሞባይል ባንክ አገልግሎት",
        time: "5 minutes",
        fee: "None",
        officialUrl: "https://sidamabanksc.com",
        docs_en: [
          "Valid Identification: National ID (Fayda) / Renewed Resident ID or Passport",
          "A Bank Account"
        ],
        docs_am: [
          "ትክክለኛ መታወቂያ: ብሔራዊ መታወቂያ (ፋይዳ) / የታደሰ የነዋሪ መታወቂያ ወይም ፓስፖርት",
          "የባንክ ሂሳብ"
        ],
      },
    ],
  },
];

