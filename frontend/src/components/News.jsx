import { useState } from 'react';
import { newsData, newsContent } from '../data/services';
import { useApp } from '../context/AppContext';

export default function News() {
  const { t, lang } = useApp();
  const [selectedNews, setSelectedNews] = useState(null);

  return (
    <section id="news" className="news" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.news_title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3">{t.news_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: News List */}
          <div className="lg:col-span-5 space-y-6">
            {newsData.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="news-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-xl cursor-pointer transition border border-transparent hover:border-blue-200"
              >
                <span className="text-xs font-medium text-blue-600">{t[item.categoryKey]}</span>
                <h3 className="font-semibold text-xl mt-2 leading-tight dark:text-white">{t[item.titleKey]}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{t[item.previewKey]}</p>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  <span>{item.readTime} {t.news_read}</span>
                  <span>{t[item.sourceKey]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Article Content */}
          <div className="lg:col-span-7">
            {selectedNews ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12 shadow-xl min-h-[500px]">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: newsContent[selectedNews.id]?.[lang] || newsContent[selectedNews.id]?.en || ''
                  }}
                />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="mt-8 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  {t.news_back}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center h-full flex items-center justify-center min-h-[500px]">
                <p className="text-gray-400 text-xl">{t.news_placeholder}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
