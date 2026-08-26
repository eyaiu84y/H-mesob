import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CARDS = [
  { titleKey: 'gov_card1_title', itemsKey: 'gov_card1_items', bg: 'bg-blue-100 dark:bg-blue-900/30',   checkColor: 'text-blue-600',   img: '/images/passport.png',  imgAlt: 'Passport' },
  { titleKey: 'gov_card2_title', itemsKey: 'gov_card2_items', bg: 'bg-green-100 dark:bg-green-900/30', checkColor: 'text-green-600',  img: '/images/world.png',     imgAlt: 'International' },
  { titleKey: 'gov_card3_title', itemsKey: 'gov_card3_items', bg: 'bg-orange-100 dark:bg-orange-900/30',checkColor: 'text-orange-600',img: '/images/business.png',  imgAlt: 'Business' },
];

export default function GovernmentServices() {
  const { t } = useApp();

  return (
    <section id="government-services" className="government" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-4">
            {t.gov_tag}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {t.gov_title}
          </h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t.gov_subtitle}
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CARDS.map((card) => (
            <div key={card.titleKey}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
              <div className={`w-16 h-16 ${card.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <img src={card.img} alt={card.imgAlt} className="w-8 h-8"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
                {t[card.titleKey]}
              </h3>
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                {(t[card.itemsKey] || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`${card.checkColor} font-bold mt-0.5`}>✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="text-center mt-16">
          <Link
            to="/service-catalogue"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition duration-300"
          >
            {t.gov_view_all}
            <svg className="ml-3 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
