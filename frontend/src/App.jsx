import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth, ROLE_ROUTES } from './context/AuthContext';
import { ServiceProvider } from './context/ServiceContext';
import { QueueProvider } from './context/QueueContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { NotificationProvider } from './context/NotificationContext';
import { AnnouncementProvider } from './context/AnnouncementContext';
import { FeedbackProvider } from './context/FeedbackContext';

// Public pages
import HomePage from './pages/HomePage';
import ServiceCataloguePage from './pages/ServiceCataloguePage';
import GovernmentServicePage from './pages/GovernmentServicePage';
import OnlineServicesPage from './pages/OnlineServicesPage';
import AboutUsPage from './pages/AboutUsPage';

// Auth pages
import LoginPage from './pages/dashboard/LoginPage';
import SignupPage from './pages/dashboard/SignupPage';
import ChangePasswordPage from './pages/dashboard/ChangePasswordPage';

// Dashboard pages - lazy loaded for code splitting
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const MesobManagerDashboard = lazy(() => import('./pages/dashboard/MesobManagerDashboard'));
const InstitutionManagerDashboard = lazy(() => import('./pages/dashboard/InstitutionManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'));
const TechnicianDashboard = lazy(() => import('./pages/dashboard/TechnicianDashboard'));
const CustomerDashboard = lazy(() => import('./pages/dashboard/CustomerDashboard'));

// Route guard
import RequireAuth from './components/dashboard/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';

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

// General Dashboard Route - redirects based on role to avoid duplicate route rendering
function DashboardRedirect() {
  const { user } = useAuth();
  const dest = (user && ROLE_ROUTES[user.role]) || '/dashboard/customer';
  return <Navigate to={dest} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ServiceProvider>
          <ApplicationProvider>
            <MaintenanceProvider>
              <NotificationProvider>
                <AnnouncementProvider>
                  <FeedbackProvider>
                    <QueueProvider>
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about-us" element={<AboutUsPage />} />
                  <Route path="/online-services" element={<OnlineServicesPage />} />
                  <Route path="/service-catalogue" element={<ServiceCataloguePage />} />
                  <Route path="/government-service" element={<GovernmentServicePage />} />

                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/change-password" element={<ChangePasswordPage />} />

                  {/* General Dashboard Route - redirects based on role */}
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth allowedRoles={['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'technician', 'customer', 'ict_staff']}>
                        <DashboardRedirect />
                      </RequireAuth>
                    }
                  />

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
                      <RequireAuth allowedRoles={['technician', 'ict_staff']}>
                        <TechnicianDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/dashboard/customer"
                    element={
                      <RequireAuth allowedRoles={['customer']}>
                        <CustomerDashboard />
                      </RequireAuth>
                    }
                  />
                  {/* Legacy route redirects */}
                  <Route path="/dashboard/ict-staff" element={<Navigate to="/dashboard/technician" replace />} />
                  <Route path="/dashboard/customer-alias" element={<Navigate to="/dashboard/customer" replace />} />
                </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </QueueProvider>
          </FeedbackProvider>
          </AnnouncementProvider>
        </NotificationProvider>
      </MaintenanceProvider>
    </ApplicationProvider>
  </ServiceProvider>
</AuthProvider>
</AppProvider>
  );
}
