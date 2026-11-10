import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard', icon: 'fa-th-large', label: 'Dashboard' },
  { to: '/order', icon: 'fa-shopping-cart', label: 'Place Order' },
  { to: '/subscription', icon: 'fa-sync-alt', label: 'Order Preferences' },
  { to: '/tracking', icon: 'fa-truck', label: 'Track Delivery' },
  { to: '/order-history', icon: 'fa-history', label: 'Order History' },
  { to: '/profile', icon: 'fa-user', label: 'My Profile' },
];

/** Sidebar and layout shared by every customer page. */
export default function CustomerShell({ cx, children }) {
  const { pathname } = useLocation();

  return (
    <div className={cx('app-container')}>
      <aside className={cx('sidebar')}>
        <div className={cx('sidebar-header')}>
          <i className={cx('fas fa-water')}></i>
          <span>AquaPro</span>
        </div>
        <nav className={cx('sidebar-nav')}>
          <ul>
            {LINKS.map((link) => (
              <li key={link.to} className={cx(pathname === link.to && 'active')}>
                <Link to={link.to}>
                  <i className={cx('fas', link.icon)}></i>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={cx('sidebar-footer')}>
          <Link className={cx('logout-btn')} to="/login">
            <i className={cx('fas fa-sign-out-alt')}></i>
            <span>Logout</span>
          </Link>
        </div>
      </aside>
      {children}
    </div>
  );
}
