import { createContext, useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/admin', icon: 'fa-th-large', label: 'Dashboard' },
  { to: '/admin/orders', icon: 'fa-clipboard-list', label: 'Orders' },
  { to: '/admin/delivery', icon: 'fa-truck', label: 'Deliveries' },
  { to: '/admin/drivers', icon: 'fa-users', label: 'Drivers' },
  { to: '/admin/customers', icon: 'fa-address-book', label: 'Customers' },
  { to: '/admin/inventory', icon: 'fa-boxes', label: 'Inventory' },
  { to: '/admin/reports', icon: 'fa-chart-bar', label: 'Reports' },
  { to: '/admin/settings', icon: 'fa-cog', label: 'Settings' },
];

const SidebarToggle = createContext(() => {});
export const useSidebarToggle = () => useContext(SidebarToggle);

/** Sidebar and main area shared by every admin page. */
export default function AdminShell({ cx, children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <SidebarToggle.Provider value={() => setOpen((o) => !o)}>
      <div className={cx('app-container')}>
        <aside className={cx('sidebar admin-sidebar', open && 'open')}>
          <div className={cx('sidebar-header')}>
            <i className={cx('fas fa-water')}></i>
            <span>AquaPro Admin</span>
          </div>
          <nav className={cx('sidebar-nav')}>
            <ul>
              {LINKS.map((link) => (
                <li key={link.to} className={cx(pathname === link.to && 'active')}>
                  <Link to={link.to} onClick={() => setOpen(false)}>
                    <i className={cx('fas', link.icon)}></i>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
              <li className={cx('logout-item')}>
                <Link to="/login">
                  <i className={cx('fas fa-sign-out-alt')}></i>
                  <span>Logout</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className={cx('sidebar-footer')}>
            <span className={cx('station-name')}>Aqua Fresh Station</span>
            <span className={cx('admin-name')}>Admin: Maria Santos</span>
          </div>
        </aside>
        <main className={cx('main-content admin-main')}>{children}</main>
      </div>
    </SidebarToggle.Provider>
  );
}

/** Standard page header used by most admin pages. */
export function AdminHeader({ cx, title, subtitle, children }) {
  return (
    <header className={cx('admin-header')}>
      <div className={cx('header-left')}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </header>
  );
}
