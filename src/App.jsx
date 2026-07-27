import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import BookingsPage from './pages/BookingsPage';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import FundisPage from './pages/FundisPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentsPage from './pages/PaymentsPage';
import ReviewsPage from './pages/ReviewsPage';
import SettingsPage from './pages/SettingsPage';

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-bg-primary font-sans">
    <Sidebar />
    <div className="flex-1 md:ml-60">
      <TopBar />
      <main className="mt-16 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="fundis" element={<FundisPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
