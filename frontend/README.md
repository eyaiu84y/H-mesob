# HAWASSA MESOB SERVICE 🏛️

A modern Ethiopian government services portal that consolidates 12+ government services into one unified digital platform with bilingual support (English & Amharic).

![React](https://img.shields.io/badge/React-19.2.8-blue)
![Vite](https://img.shields.io/badge/Vite-8.2.0-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Functionality
- 🌍 **Bilingual Support** - Full English and Amharic translations
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🔐 **Authentication System** - Role-based access control
- 👥 **6 User Roles** - Different dashboards for different roles

### User Roles
1. **Super Admin** - Full system oversight and management
2. **MESOB Manager** - Service-wide management and analytics
3. **Institution Manager** - Institution-level control and monitoring
4. **Employee** - Service processing and queue management
5. **Technician** - ICT/Technical support and maintenance
6. **Citizen** - Service applications and tracking

### Government Services
- 🏛️ **12 Organizations** - Justice, Revenue, Land, Labor, Banking, Telecom, etc.
- 📋 **Service Catalogue** - Browse all services with requirements and fees
- ⏱️ **Processing Times** - Clear timelines for each service
- 💰 **Fee Information** - Transparent pricing for all services
- 📄 **Document Requirements** - Complete lists in both languages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mesob-react.git
   cd mesob-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173/
   ```

## 📦 Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint to check code quality
```

## 🎭 Demo Accounts

Try different roles with these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@mesobcenter.et | super123 |
| MESOB Manager | manager@mesobcenter.et | manager123 |
| Institution Manager | inst.manager@mesobcenter.et | inst123 |
| Employee | employee@mesobcenter.et | emp123 |
| Technician | technician@mesobcenter.et | ict123 |
| Citizen | citizen@example.com | citizen123 |

> **Note:** These are demo accounts for testing purposes only.

## 🏗️ Project Structure

```
mesob-react/
├── public/                 # Static assets
│   ├── image/             # Organization logos and banners
│   └── icons.svg          # Icon sprites
├── src/
│   ├── components/        # React components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── About.jsx
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   └── ...
│   ├── context/          # React Context providers
│   │   ├── AppContext.jsx    # Theme & i18n
│   │   └── AuthContext.jsx   # Authentication
│   ├── data/             # Static data & configurations
│   │   ├── organizations.js  # 12 government organizations
│   │   └── services.js
│   ├── pages/            # Page components
│   │   ├── dashboard/    # Role-based dashboards
│   │   ├── HomePage.jsx
│   │   ├── ServiceCataloguePage.jsx
│   │   └── GovernmentServicePage.jsx
│   ├── App.jsx           # Main app component with routes
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles & Tailwind
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies & scripts
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🎨 Tech Stack

- **Frontend Framework:** React 19.2.8
- **Build Tool:** Vite 8.2.0
- **Styling:** Tailwind CSS 3.4.17 + Custom CSS
- **Routing:** React Router v6.28.0
- **State Management:** React Context API
- **Language:** JavaScript (JSX)
- **Icons:** SVG sprites

## 🌐 Organizations Included

1. Justice Bureau Service
2. National ID Program (Fayda)
3. Ministry of Revenues
4. Land Administration & Investment Development
5. Labor & Skills Bureau
6. Commercial Bank of Ethiopia
7. Sidama Bank Service
8. Ethio Telecom
9. Trade & Market Development Bureau
10. Ethiopian Postal Service Enterprise
11. Ethiopian Electric Utility
12. Urban Development & Construction

## 🔧 Development

### Code Quality
The project uses ESLint for code quality. Run linting with:
```bash
npm run lint
```

All ESLint errors have been resolved. See `ESLINT_FIXES.md` for details.

### Adding New Services
1. Add organization data to `src/data/organizations.js`
2. Add organization images to `public/image/`
3. Update translations in `src/context/AppContext.jsx`

### Adding New Roles
1. Add role to `DEMO_USERS` in `src/context/AuthContext.jsx`
2. Add role route to `ROLE_ROUTES`
3. Add role label to `ROLE_LABELS`
4. Add role badge style to `ROLE_BADGE`
5. Create dashboard component in `src/pages/dashboard/`
6. Add route in `src/App.jsx`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please contact:
- Email: support@mesobcenter.et
- Website: https://mesobcenter.et

## 🙏 Acknowledgments

- Ethiopian Government for service information
- Community contributors
- Open source libraries used in this project

---

**Made with ❤️ for the Ethiopian Community**

**የሃዋሳ መሶብ አገልግሎት | Hawassa Mesob Service**
