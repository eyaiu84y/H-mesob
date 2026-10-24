import fs from 'fs';

const cssPath = 'frontend/src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

const startMarker = '/* ==========================================================================\n   AUTHENTICATED DASHBOARDS - ENTERPRISE DARK MODE SYSTEM';
const endMarker = 'html.dark .dashboard-bg .border-gray-300 {\n  border-color: #334155 !important;\n}';

const startIdx = css.indexOf(startMarker);
const endIdx = css.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const newThemeCSS = `/* ==========================================================================
   AUTHENTICATED DASHBOARDS - UNIFIED ENTERPRISE DESIGN SYSTEM
   Guarantees 100% readability, beautiful contrast, and professional UX
   in BOTH Dark Mode and Light Mode across all 6 role dashboards:
   - Super Admin Dashboard
   - MESOB Manager Dashboard
   - Institution Manager Dashboard
   - Employee Dashboard
   - Technician Dashboard
   - Customer Dashboard
   ========================================================================== */

/* Typography & Smoothing Base across Dashboards */
.dashboard-bg {
  font-family: 'Inter', 'Noto Sans Ethiopic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  color: #0f172a;
}
html.dark .dashboard-bg,
html.dark .dashboard-bg > div,
html.dark .dashboard-bg main {
  color: #f8fafc !important;
}

/* ===== Top Header Navigation Bar ===== */
html:not(.dark) .dashboard-bg header {
  background-color: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04) !important;
}
html:not(.dark) .dashboard-bg header h1,
html:not(.dark) .dashboard-bg header h2,
html:not(.dark) .dashboard-bg header h3 {
  color: #0f172a !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
}
html:not(.dark) .dashboard-bg header .text-slate-500,
html:not(.dark) .dashboard-bg header .text-slate-400 {
  color: #64748b !important;
}

html.dark .dashboard-bg header {
  background-color: #0f172a !important;
  border-bottom: 1px solid #1e293b !important;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.45) !important;
}
html.dark .dashboard-bg header .text-slate-800,
html.dark .dashboard-bg header .text-slate-900,
html.dark .dashboard-bg header h1,
html.dark .dashboard-bg header h2,
html.dark .dashboard-bg header h3 {
  color: #f8fafc !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
}
html.dark .dashboard-bg header .text-slate-600,
html.dark .dashboard-bg header .text-slate-500,
html.dark .dashboard-bg header .text-slate-400 {
  color: #94a3b8 !important;
}
html.dark .dashboard-bg header button.text-slate-700,
html.dark .dashboard-bg header button.text-slate-500 {
  color: #cbd5e1 !important;
}
html.dark .dashboard-bg header button:hover {
  background-color: #1e293b !important;
  color: #ffffff !important;
}
html.dark .dashboard-bg header .bg-slate-100 {
  background-color: #1e293b !important;
  border-color: #334155 !important;
}
html.dark .dashboard-bg header .bg-slate-50 {
  background-color: rgba(30, 41, 59, 0.8) !important;
  border-color: #334155 !important;
}
html.dark .dashboard-bg header .bg-blue-100 {
  background-color: rgba(30, 58, 138, 0.6) !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
  color: #93c5fd !important;
}
html.dark .dashboard-bg header .border-slate-200 {
  border-color: #1e293b !important;
}

/* ===== Card Surfaces, Elevation & Sub-Bands ===== */
html:not(.dark) .dashboard-bg .bg-white {
  background-color: #ffffff !important;
  border-color: #e2e8f0 !important;
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05) !important;
}
html:not(.dark) .dashboard-bg .bg-slate-50,
html:not(.dark) .dashboard-bg .bg-slate-50\\/50,
html:not(.dark) .dashboard-bg .bg-slate-50\\/60,
html:not(.dark) .dashboard-bg .bg-slate-50\\/70,
html:not(.dark) .dashboard-bg .bg-slate-50\\/80,
html:not(.dark) .dashboard-bg .bg-gray-50 {
  background-color: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

html.dark .dashboard-bg .bg-slate-50,
html.dark .dashboard-bg .bg-slate-50\\/50,
html.dark .dashboard-bg .bg-slate-50\\/60,
html.dark .dashboard-bg .bg-slate-50\\/70,
html.dark .dashboard-bg .bg-slate-50\\/80,
html.dark .dashboard-bg .bg-gray-50 {
  background-color: #141f32 !important;
  border-color: #334155 !important;
  color: #cbd5e1 !important;
}

html:not(.dark) .dashboard-bg .bg-slate-100 {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}
html.dark .dashboard-bg .bg-slate-100,
html.dark .dashboard-bg .bg-slate-200,
html.dark .dashboard-bg .bg-gray-100,
html.dark .dashboard-bg .bg-gray-200 {
  background-color: #334155 !important;
  border-color: #475569 !important;
  color: #e2e8f0 !important;
}

/* ===== Typography Hierarchy & Contrast Standards ===== */
/* Light Mode Typography */
html:not(.dark) .dashboard-bg h1,
html:not(.dark) .dashboard-bg h2,
html:not(.dark) .dashboard-bg h3,
html:not(.dark) .dashboard-bg h4,
html:not(.dark) .dashboard-bg h5,
html:not(.dark) .dashboard-bg h6 {
  color: #0f172a !important;
  letter-spacing: -0.015em;
}
html:not(.dark) .dashboard-bg .text-slate-900,
html:not(.dark) .dashboard-bg .text-slate-800 {
  color: #0f172a !important;
}
html:not(.dark) .dashboard-bg .text-slate-700 {
  color: #334155 !important;
}
html:not(.dark) .dashboard-bg .text-slate-600 {
  color: #475569 !important;
}
html:not(.dark) .dashboard-bg .text-slate-500 {
  color: #64748b !important;
}
html:not(.dark) .dashboard-bg .text-slate-400 {
  color: #64748b !important;
}

/* Dark Mode Typography */
html.dark .dashboard-bg .text-slate-900,
html.dark .dashboard-bg .text-slate-800,
html.dark .dashboard-bg .text-gray-900,
html.dark .dashboard-bg .text-gray-800,
html.dark .dashboard-bg .text-black,
html.dark .dashboard-bg h1:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg h2:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg h3:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg h4:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg h5:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg h6:not([class*="text-blue-"]):not([class*="text-emerald-"]):not([class*="text-amber-"]):not([class*="text-rose-"]),
html.dark .dashboard-bg strong:not([class*="text-amber-"]):not([class*="text-emerald-"]):not([class*="text-rose-"]) {
  color: #f8fafc !important;
}
html.dark .dashboard-bg .text-slate-700,
html.dark .dashboard-bg .text-gray-700 {
  color: #e2e8f0 !important;
}
html.dark .dashboard-bg .text-slate-600,
html.dark .dashboard-bg .text-gray-600 {
  color: #cbd5e1 !important;
}
html.dark .dashboard-bg .text-slate-500,
html.dark .dashboard-bg .text-gray-500,
html.dark .dashboard-bg .text-slate-400,
html.dark .dashboard-bg .text-gray-400 {
  color: #94a3b8 !important;
}

/* Primary Brand Accents */
html.dark .dashboard-bg .text-\\[\\#314ea1\\],
html.dark .dashboard-bg .text-\\[\\#1e3a8a\\],
html.dark .dashboard-bg .text-\\[\\#253d82\\],
html.dark .dashboard-bg .text-blue-950,
html.dark .dashboard-bg .text-blue-900,
html.dark .dashboard-bg .text-blue-800,
html.dark .dashboard-bg .text-blue-700,
html.dark .dashboard-bg .text-blue-600 {
  color: #60a5fa !important;
}
html.dark .dashboard-bg strong.text-\\[\\#1e3a8a\\] {
  color: #60a5fa !important;
}
html.dark .dashboard-bg a.text-\\[\\#314ea1\\]:hover,
html.dark .dashboard-bg button.text-\\[\\#314ea1\\]:hover,
html.dark .dashboard-bg .hover\\:text-\\[\\#1e3a8a\\]:hover,
html.dark .dashboard-bg .hover\\:text-\\[\\#314ea1\\]:hover,
html.dark .dashboard-bg .hover\\:text-blue-800:hover {
  color: #93c5fd !important;
}

/* Amber Accents (Active Queue, Pending, Warning) */
html.dark .dashboard-bg .text-amber-800,
html.dark .dashboard-bg .text-amber-700,
html.dark .dashboard-bg .text-amber-600 {
  color: #fbbf24 !important;
}
html.dark .dashboard-bg .bg-amber-50,
html.dark .dashboard-bg .bg-amber-100\\/50,
html.dark .dashboard-bg .bg-amber-100 {
  background-color: rgba(245, 158, 11, 0.15) !important;
  border-color: rgba(245, 158, 11, 0.35) !important;
  color: #fde68a !important;
}

/* Emerald Accents (Completed, Active, Approved, Success) */
html.dark .dashboard-bg .text-emerald-800,
html.dark .dashboard-bg .text-emerald-700,
html.dark .dashboard-bg .text-emerald-600,
html.dark .dashboard-bg .text-green-800,
html.dark .dashboard-bg .text-green-700 {
  color: #34d399 !important;
}
html.dark .dashboard-bg .bg-emerald-50,
html.dark .dashboard-bg .bg-emerald-100,
html.dark .dashboard-bg .bg-green-50 {
  background-color: rgba(16, 185, 129, 0.15) !important;
  border-color: rgba(16, 185, 129, 0.35) !important;
  color: #a7f3d0 !important;
}

/* Rose / Red Accents (Rejected, Urgency, Errors, Deactivate) */
html.dark .dashboard-bg .text-rose-800,
html.dark .dashboard-bg .text-rose-700,
html.dark .dashboard-bg .text-rose-600,
html.dark .dashboard-bg .text-red-800,
html.dark .dashboard-bg .text-red-700 {
  color: #fb7185 !important;
}
html.dark .dashboard-bg .bg-rose-50,
html.dark .dashboard-bg .bg-rose-100,
html.dark .dashboard-bg .bg-red-50 {
  background-color: rgba(244, 63, 94, 0.15) !important;
  border-color: rgba(244, 63, 94, 0.35) !important;
  color: #fecdd3 !important;
}

/* Violet / Purple Accents */
html.dark .dashboard-bg .text-violet-900,
html.dark .dashboard-bg .text-violet-800,
html.dark .dashboard-bg .text-violet-700,
html.dark .dashboard-bg .text-purple-800,
html.dark .dashboard-bg .text-purple-700 {
  color: #c4b5fd !important;
}
html.dark .dashboard-bg .bg-violet-50,
html.dark .dashboard-bg .bg-violet-100,
html.dark .dashboard-bg .bg-purple-50 {
  background-color: rgba(139, 92, 246, 0.15) !important;
  border-color: rgba(139, 92, 246, 0.35) !important;
  color: #e9d5ff !important;
}

/* Info Banner and Subtle Blue Pill Styling */
html.dark .dashboard-bg .bg-blue-50,
html.dark .dashboard-bg .bg-blue-50\\/70,
html.dark .dashboard-bg .bg-blue-50\\/50,
html.dark .dashboard-bg .bg-blue-50\\/80 {
  background-color: rgba(30, 58, 138, 0.25) !important;
  border-color: rgba(59, 130, 246, 0.35) !important;
  color: #bfdbfe !important;
}

/* Status Badges & Role Badges (.badge) - Tuned for WCAG Contrast */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.015em;
  border-width: 1px;
}
html:not(.dark) .dashboard-bg .badge.bg-blue-50 {
  background-color: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1e40af !important;
}
html:not(.dark) .dashboard-bg .badge.bg-emerald-50 {
  background-color: #ecfdf5 !important;
  border-color: #a7f3d0 !important;
  color: #065f46 !important;
}
html:not(.dark) .dashboard-bg .badge.bg-amber-50 {
  background-color: #fffbeb !important;
  border-color: #fde68a !important;
  color: #92400e !important;
}
html:not(.dark) .dashboard-bg .badge.bg-rose-50 {
  background-color: #fff1f2 !important;
  border-color: #fecdd3 !important;
  color: #9f1239 !important;
}
html:not(.dark) .dashboard-bg .badge.bg-slate-100 {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

html.dark .dashboard-bg .badge.bg-blue-50,
html.dark .dashboard-bg .badge[class*="text-\\[\\#1e3a8a\\]"],
html.dark .dashboard-bg .badge[class*="text-blue-"] {
  background-color: rgba(30, 58, 138, 0.45) !important;
  border-color: rgba(96, 165, 250, 0.4) !important;
  color: #93c5fd !important;
}
html.dark .dashboard-bg .badge.bg-emerald-50,
html.dark .dashboard-bg .badge[class*="text-emerald-"],
html.dark .dashboard-bg .badge[class*="text-green-"] {
  background-color: rgba(6, 78, 59, 0.45) !important;
  border-color: rgba(52, 211, 153, 0.4) !important;
  color: #6ee7b7 !important;
}
html.dark .dashboard-bg .badge.bg-amber-50,
html.dark .dashboard-bg .badge[class*="text-amber-"],
html.dark .dashboard-bg .badge[class*="text-yellow-"] {
  background-color: rgba(120, 53, 15, 0.45) !important;
  border-color: rgba(251, 191, 36, 0.4) !important;
  color: #fde047 !important;
}
html.dark .dashboard-bg .badge.bg-rose-50,
html.dark .dashboard-bg .badge[class*="text-rose-"],
html.dark .dashboard-bg .badge[class*="text-red-"] {
  background-color: rgba(136, 19, 55, 0.45) !important;
  border-color: rgba(251, 113, 133, 0.4) !important;
  color: #fda4af !important;
}
html.dark .dashboard-bg .badge.bg-slate-100,
html.dark .dashboard-bg .badge[class*="text-slate-"] {
  background-color: rgba(30, 41, 59, 0.8) !important;
  border-color: #475569 !important;
  color: #cbd5e1 !important;
}

/* Table Contrast & Elevation in Both Modes */
.table-container {
  overflow-x: auto;
  border-radius: 0.875rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
}
table.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
table.data-table th {
  text-align: left;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}
table.data-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}
table.data-table tr:last-child td {
  border-bottom: none;
}
table.data-table tbody tr:hover {
  background-color: #f8fafc;
}

html.dark .dashboard-bg .table-container {
  background-color: #1e293b !important;
  border-color: #334155 !important;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.3) !important;
}
html.dark .dashboard-bg table.data-table,
html.dark .dashboard-bg table {
  background-color: transparent !important;
}
html.dark .dashboard-bg table.data-table th,
html.dark .dashboard-bg table th,
html.dark .dashboard-bg table thead tr,
html.dark .dashboard-bg table.data-table thead tr {
  background-color: #0f172a !important;
  color: #94a3b8 !important;
  border-bottom: 1px solid #334155 !important;
}
html.dark .dashboard-bg table.data-table td,
html.dark .dashboard-bg table td {
  color: #f1f5f9 !important;
  border-bottom: 1px solid #1e293b !important;
}
html.dark .dashboard-bg table tbody tr:hover,
html.dark .dashboard-bg table.data-table tbody tr:hover {
  background-color: #273549 !important;
}
html.dark .dashboard-bg .divide-slate-100 > :not([hidden]) ~ :not([hidden]),
html.dark .dashboard-bg .divide-slate-200 > :not([hidden]) ~ :not([hidden]) {
  border-color: #334155 !important;
}

/* Form Controls: Inputs, Selects, and Textareas */
html:not(.dark) .dashboard-bg input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
html:not(.dark) .dashboard-bg textarea,
html:not(.dark) .dashboard-bg select,
html:not(.dark) .fixed input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
html:not(.dark) .fixed textarea,
html:not(.dark) .fixed select {
  background-color: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
  color-scheme: light !important;
}
html:not(.dark) .dashboard-bg input:focus,
html:not(.dark) .dashboard-bg textarea:focus,
html:not(.dark) .dashboard-bg select:focus,
html:not(.dark) .fixed input:focus,
html:not(.dark) .fixed textarea:focus,
html:not(.dark) .fixed select:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
  outline: none !important;
}
html:not(.dark) .dashboard-bg input::placeholder,
html:not(.dark) .dashboard-bg textarea::placeholder,
html:not(.dark) .fixed input::placeholder,
html:not(.dark) .fixed textarea::placeholder {
  color: #94a3b8 !important;
}
html:not(.dark) .dashboard-bg select option,
html:not(.dark) .fixed select option {
  background-color: #ffffff !important;
  color: #0f172a !important;
}

html.dark .dashboard-bg input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
html.dark .dashboard-bg textarea,
html.dark .dashboard-bg select,
html.dark .fixed input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
html.dark .fixed textarea,
html.dark .fixed select {
  background-color: #0f172a !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
  color-scheme: dark !important;
}
html.dark .dashboard-bg input:focus,
html.dark .dashboard-bg textarea:focus,
html.dark .dashboard-bg select:focus,
html.dark .fixed input:focus,
html.dark .fixed textarea:focus,
html.dark .fixed select:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
  outline: none !important;
}
html.dark .dashboard-bg input::placeholder,
html.dark .dashboard-bg textarea::placeholder,
html.dark .fixed input::placeholder,
html.dark .fixed textarea::placeholder {
  color: #64748b !important;
}
html.dark .dashboard-bg select option,
html.dark .fixed select option {
  background-color: #0f172a !important;
  color: #f8fafc !important;
}

/* Dashboard Modals, Dialogs, and Popovers */
html:not(.dark) .fixed .bg-white.rounded-2xl,
html:not(.dark) .fixed .bg-white.rounded-xl,
html:not(.dark) .fixed .bg-white.rounded-3xl,
html:not(.dark) .fixed [role="dialog"] {
  background-color: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}
html:not(.dark) .fixed label {
  color: #334155 !important;
  font-weight: 600 !important;
}

html.dark .fixed .bg-white.rounded-2xl,
html.dark .fixed .bg-white.rounded-xl,
html.dark .fixed .bg-white.rounded-3xl,
html.dark .fixed [role="dialog"],
html.dark .fixed .p-6.bg-white,
html.dark .fixed .p-8.bg-white {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
  color: #f8fafc !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
}
html.dark .fixed .bg-slate-50,
html.dark .fixed .bg-slate-50\\/70,
html.dark .fixed .bg-slate-50\\/50 {
  background-color: #0f172a !important;
  border-color: #334155 !important;
}
html.dark .fixed label {
  color: #e2e8f0 !important;
  font-weight: 600 !important;
}
html.dark .fixed p.text-slate-400,
html.dark .fixed p.text-slate-500 {
  color: #94a3b8 !important;
}

/* Border Dividers */
html:not(.dark) .dashboard-bg .border-slate-100,
html:not(.dark) .dashboard-bg .border-slate-200,
html:not(.dark) .dashboard-bg .border-slate-200\\/90,
html:not(.dark) .dashboard-bg .border-slate-200\\/80,
html:not(.dark) .dashboard-bg .border-slate-200\\/60,
html:not(.dark) .dashboard-bg .border-slate-300 {
  border-color: #e2e8f0 !important;
}

html.dark .dashboard-bg .border-slate-100,
html.dark .dashboard-bg .border-slate-200,
html.dark .dashboard-bg .border-slate-200\\/90,
html.dark .dashboard-bg .border-slate-200\\/80,
html.dark .dashboard-bg .border-slate-200\\/60,
html.dark .dashboard-bg .border-slate-300,
html.dark .dashboard-bg .border-gray-100,
html.dark .dashboard-bg .border-gray-200,
html.dark .dashboard-bg .border-gray-300 {
  border-color: #334155 !important;
}`;

const fullEnd = endIdx + endMarker.length;
const updatedCSS = css.substring(0, startIdx) + newThemeCSS + css.substring(fullEnd);

fs.writeFileSync(cssPath, updatedCSS, 'utf8');
console.log('✅ Updated frontend/src/index.css with unified enterprise theme system!');
