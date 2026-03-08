import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import TabBar from './components/layout/TabBar';
import Spinner from './components/ui/Spinner';

import LoginPage from './pages/LoginPage';
import ReservationsPage from './pages/ReservationsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import InspectionWizardPage from './pages/InspectionWizardPage';
import InspectionListPage from './pages/InspectionListPage';
import TasksPage from './pages/TasksPage';
import PurchasesPage from './pages/PurchasesPage';
import TeamPage from './pages/TeamPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { profile } = useAuthStore();
  const role = profile?.role;

  const getDefaultRoute = () => '/reservations';

  return (
    <div className="h-full flex flex-col bg-ios-bg">
      <Routes>
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/:id" element={<ReservationDetailPage />} />
        <Route path="/inspection" element={<InspectionListPage />} />
        <Route path="/inspection/:reservationId/:inspectionType" element={<InspectionWizardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/team" element={role === 'owner' ? <TeamPage /> : <Navigate to={getDefaultRoute()} />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default function App() {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-ios-bg">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
