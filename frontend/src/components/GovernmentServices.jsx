import { useApp } from '../context/AppContext';

const CARDS = [
  { titleKey: 'gov_card1_title', itemsKey: 'gov_card1_items', bg: 'bg-blue-100 dark:bg-blue-900/30',   checkColor: 'text-blue-600',   img: '/images/passport.png',  imgAlt: 'Passport' },
  { titleKey: 'gov_card2_title', itemsKey: 'gov_card2_items', bg: 'bg-green-100 dark:bg-green-900/30', checkColor: 'text-green-600',  img: '/images/world.png',     imgAlt: 'International' },
  { titleKey: 'gov_card3_title', itemsKey: 'gov_card3_items', bg: 'bg-orange-100 dark:bg-orange-900/30',checkColor: 'text-orange-600',img: '/images/business.png',  imgAlt: 'Business' },
];

export default function GovernmentServices() {
  const { t } = useApp();

  return (
    <section id="government-services" className="government py-16 sm:py-20 lg:py-24 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
            {t.gov_title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal">
            {t.gov_subtitle}
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CARDS.map((card) => (
            <div key={card.titleKey}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200/90 dark:border-gray-700 p-8 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center mb-6`}>
                <img src={card.img} alt={card.imgAlt} className="w-8 h-8"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t[card.titleKey]}
              </h3>
              <ul className="space-y-3.5 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                {(t[card.itemsKey] || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`${card.checkColor} font-bold mt-0.5`}>✔</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
