import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { NotificationProvider } from './context/NotificationContext';

// Public pages
import HomePage from './pages/HomePage';
import ServiceCataloguePage from './pages/ServiceCataloguePage';
import GovernmentServicePage from './pages/GovernmentServicePage';

// Auth pages
import LoginPage from './pages/dashboard/LoginPage';
import SignupPage from './pages/dashboard/SignupPage';

// Dashboard pages - lazy loaded for code splitting
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const MesobManagerDashboard = lazy(() => import('./pages/dashboard/MesobManagerDashboard'));
const InstitutionManagerDashboard = lazy(() => import('./pages/dashboard/InstitutionManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'));
const ICTStaffDashboard = lazy(() => import('./pages/dashboard/ICTStaffDashboard'));
const CitizenDashboard = lazy(() => import('./pages/dashboard/CitizenDashboard'));

// Route guard
import RequireAuth from './components/dashboard/RequireAuth';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <QueueProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/service-catalogue" element={<ServiceCataloguePage />} />
            <Route path="/government-service" element={<GovernmentServicePage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Dashboards */}
            <Route
              path="/dashboard/super-admin"
              element={
                <RequireAuth allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/mesob-manager"
              element={
                <RequireAuth allowedRoles={['mesob_manager']}>
                  <MesobManagerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/institution-manager"
              element={
                <RequireAuth allowedRoles={['institution_manager']}>
                  <InstitutionManagerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/employee"
              element={
                <RequireAuth allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/technician"
              element={
                <RequireAuth allowedRoles={['technician']}>
                  <ICTStaffDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/citizen"
              element={
                <RequireAuth allowedRoles={['citizen']}>
                  <CitizenDashboard />
                </RequireAuth>
              }
            />
          </Routes>
          </Suspense>
        </QueueProvider>
      </NotificationProvider>
      </AuthProvider>
    </AppProvider>
  );
}
