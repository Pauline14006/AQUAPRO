import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import RequireRole from './components/common/RequireRole';

import HomePage from './components/public/HomePage';
import LoginPage from './components/public/LoginPage';
import WaterQualityPage from './components/public/WaterQualityPage';

import DashboardPage from './components/customer/DashboardPage';
import OrderPage from './components/customer/OrderPage';
import OrderHistoryPage from './components/customer/OrderHistoryPage';
import ProfilePage from './components/customer/ProfilePage';
import SubscriptionPage from './components/customer/SubscriptionPage';
import TrackingPage from './components/customer/TrackingPage';

import DriverMobilePage from './components/driver/DriverMobilePage';

import AdminDashboardPage from './components/admin/AdminDashboardPage';
import AdminOrdersPage from './components/admin/AdminOrdersPage';
import AdminCustomersPage from './components/admin/AdminCustomersPage';
import AdminDriversPage from './components/admin/AdminDriversPage';
import AdminReportsPage from './components/admin/AdminReportsPage';
import AdminSettingsPage from './components/admin/AdminSettingsPage';
import DeliveryManagementPage from './components/admin/DeliveryManagementPage';
import InventoryPage from './components/admin/InventoryPage';

/** Scroll to `#hash` targets after navigation, otherwise to the top. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Old static URLs (e.g. /admin/admin-orders.html) keep working. */
const LEGACY_REDIRECTS = {
  '/index.html': '/',
  '/login.html': '/login',
  '/dashboard.html': '/dashboard',
  '/order.html': '/order',
  '/order-history.html': '/order-history',
  '/profile.html': '/profile',
  '/subscription.html': '/subscription',
  '/tracking.html': '/tracking',
  '/water-quality.html': '/water-quality',
  '/driver-mobile.html': '/driver',
  '/admin/admin.html': '/admin',
  '/admin/admin-orders.html': '/admin/orders',
  '/admin/admin-customers.html': '/admin/customers',
  '/admin/admin-drivers.html': '/admin/drivers',
  '/admin/admin-reports.html': '/admin/reports',
  '/admin/admin-settings.html': '/admin/settings',
  '/admin/delivery-management.html': '/admin/delivery',
  '/admin/inventory.html': '/admin/inventory',
  '/customer/order-history.html': '/order-history',
  '/customer/profile.html': '/profile',
  '/customer/order-history': '/order-history',
  '/customer/profile': '/profile',
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ScrollManager />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/water-quality" element={<WaterQualityPage />} />

          {/* Customer */}
          <Route element={<RequireRole roles={['customer']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
          </Route>

          {/* Driver */}
          <Route element={<RequireRole roles={['driver']} />}>
            <Route path="/driver" element={<DriverMobilePage />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<RequireRole roles={['admin']} />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="drivers" element={<AdminDriversPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="delivery" element={<DeliveryManagementPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
