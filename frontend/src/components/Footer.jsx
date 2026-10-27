import { useApp } from '../context/AppContext';

/* ─── Social icon SVGs ─────────────────────────────────── */
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SOCIAL_LINKS = [
  {
    name: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61588798515029',
    icon: <FacebookIcon />,
    hover: 'hover:bg-blue-600',
  },
  {
    name: 'linkedin',
    href: 'https://www.linkedin.com/company/mesob-center/posts/?feedView=all',
    icon: <LinkedInIcon />,
    hover: 'hover:bg-blue-500',
  },
  {
    name: 'telegram',
    href: 'https://t.me/hawasamesob',
    icon: <TelegramIcon />,
    hover: 'hover:bg-sky-500',
  },
  {
    name: 'twitter',
    href: 'https://x.com/MesobCenter',
    icon: <TwitterIcon />,
    hover: 'hover:bg-gray-600',
  },
];

export default function Footer() {
  const { t, lang } = useApp();

  return (
    <footer style={{ background: '#0d1a3a' }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 flex flex-col items-center text-center gap-5">

        {/* Logo */}
        <div
          className="w-16 h-16 overflow-hidden flex items-center justify-center"

        >
          <img
            src="https://mesobcenter.et/Companies/Logo.png"
            alt="Mesob Logo"
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Bilingual name */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-white/70 text-sm font-medium tracking-wide">
            {t.footer_bilingual}
          </p>
        </div>

        {/* Main title */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
          {lang === 'am' ? 'የሃዋሳ መሶብ አገልግሎት' : 'HAWASSA MESOB SERVICE'}
        </h2>

        {/* Tagline */}
        <p className="text-white/65 text-base">
          {t.footer_tagline}
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-4 mt-1">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:text-white transition-all duration-200 ${s.hover}`}
            >
              {s.icon}
            </a>
          ))}
        </div>

      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-white/50">
          {t.footer_copy}
        </div>
      </div>
    </footer>
  );
}
