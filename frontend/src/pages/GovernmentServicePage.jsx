import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CARDS = [
  { titleKey: 'gov_card1_title', itemsKey: 'gov_card1_items', bg: 'bg-blue-100 dark:bg-blue-900/30',    checkColor: 'text-blue-600',   icon: '🪪' },
  { titleKey: 'gov_card2_title', itemsKey: 'gov_card2_items', bg: 'bg-green-100 dark:bg-green-900/30',  checkColor: 'text-green-600',  icon: '🌍' },
  { titleKey: 'gov_card3_title', itemsKey: 'gov_card3_items', bg: 'bg-orange-100 dark:bg-orange-900/30',checkColor: 'text-orange-600', icon: '🏢' },
];

const STATS = [
  { icon: '⚡', labelKey: 'gov_stat1_label', descKey: 'gov_stat1_desc' },
  { icon: '📍', labelKey: 'gov_stat2_label', descKey: 'gov_stat2_desc' },
  { icon: '🔒', labelKey: 'gov_stat3_label', descKey: 'gov_stat3_desc' },
];

export default function GovernmentServicePage() {
  const { t } = useApp();

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-white dark:bg-gray-900">

        {/* Page Hero */}
        <div className="bg-mesob-gradient text-white py-14 px-6 text-center">
          <span className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-4">
            {t.gov_tag}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.gov_title}</h1>
          <p className="text-white/85 text-lg max-w-3xl mx-auto">{t.gov_subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16">

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARDS.map((card) => (
              <div key={card.titleKey}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
                <div className={`w-16 h-16 ${card.bg} rounded-2xl flex items-center justify-center mb-6 text-3xl`}>
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
                  {t[card.titleKey]}
                </h3>
                <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                  {(t[card.itemsKey] || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`${card.checkColor} font-bold mt-0.5`}>✔</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Why Choose MESOB */}
          <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-3xl p-10 md:p-14">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-5">
                {t.gov_why_title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
                {t.gov_why_body}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {STATS.map((stat) => (
                  <div key={stat.labelKey} className="p-5 bg-white dark:bg-gray-700 rounded-2xl shadow-sm">
                    <div className="text-4xl mb-2">{stat.icon}</div>
                    <p className="font-bold text-gray-900 dark:text-white">{t[stat.labelKey]}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t[stat.descKey]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/service-catalogue"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition duration-300"
            >
              {t.gov_browse_btn}
              <svg className="ml-3 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-full hover:border-blue-500 transition duration-300"
            >
              <svg className="mr-3 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t.gov_back_btn}
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
