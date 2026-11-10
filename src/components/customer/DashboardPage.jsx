import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { STATUS_LABELS } from '../../lib/constants';
import ordersStyles from '../../styles/customerOrders.module.css';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles);
const STAGES = ['pending', 'confirmed', 'delivering', 'delivered'];
const STAGE_META = [
  { label: 'Pending', icon: 'fa-check' },
  { label: 'Confirmed', icon: 'fa-check' },
  { label: 'Out for Delivery', icon: 'fa-truck' },
  { label: 'Delivered', icon: 'fa-box' },
];
const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

function NotificationBell() {
  const [open, setOpen] = useState(false);

  // close when clicking anywhere else
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className={cx('notification-bell')} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
      <i className={cx('fas fa-bell')}></i>
      <span className={cx('notification-badge')}>3</span>
      <div className={cx('notification-dropdown')} style={{ display: open ? 'block' : 'none' }}>
        <div className={cx('notification-item')}>
          <i className={cx('fas fa-truck')}></i>
          <p>Your delivery is on the way!</p>
          <small>5 minutes ago</small>
        </div>
        <div className={cx('notification-item')}>
          <i className={cx('fas fa-check-circle')}></i>
          <p>Order #1005 confirmed</p>
          <small>2 hours ago</small>
        </div>
        <div className={cx('notification-item')}>
          <i className={cx('fas fa-sync')}></i>
          <p>Subscription auto-refill scheduled</p>
          <small>1 day ago</small>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = store.useStoreData(store.getCurrentUser);
  const orders = store.useStoreData(() =>
    store.getOrders()
      .filter((order) => order.email === user?.email && !order.hiddenByCustomer)
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)),
  );
  const subscriptionActive = store.useStoreData(() => Boolean(store.getSubscriptions()[user?.email]?.active));
  if (!user) return null;

  const latest = orders[0];
  const statusText = latest ? STATUS_LABELS[latest.status] || latest.status : '';
  // A delivered order has finished every stage, so mark all of them completed.
  const isDelivered = latest?.status === 'delivered';
  const activeIndex = latest ? (isDelivered ? STAGES.length : STAGES.indexOf(latest.status)) : -1;
  const showEstimate = latest && ['pending', 'confirmed', 'delivering'].includes(latest.status);
  const now = new Date();
  const ordersThisMonth = orders.filter((order) => {
    const date = new Date(`${order.date}T00:00:00`);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        {/* Top Header */}
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>Welcome back, <span>{user.name.split(/\s+/)[0]}</span>!</h1>
            <p>Here's your water delivery summary</p>
          </div>
          <div className={cx('header-right')}>
            <NotificationBell />
            <div className={cx('user-avatar')}>
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233b82f6'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16'%3EJD%3C/text%3E%3C/svg%3E"
                alt="User"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className={cx('dashboard-content')}>
          {/* Summary Cards */}
          <div className={cx('summary-cards')}>
            <div className={cx('card next-delivery-card')} hidden={!latest || ['delivered', 'cancelled'].includes(latest.status)}>
              <div className={cx('card-header')}>
                <i className={cx('fas fa-calendar-check')}></i>
                <h3>Next Scheduled Delivery</h3>
              </div>
              {latest && (
                <div className={cx('card-body')}>
                  <div className={cx('delivery-date')}>{longDate(latest.date)}</div>
                  <div className={cx('delivery-time')}>Morning (8:00 AM - 12:00 PM)</div>
                  <span className={cx('status-badge status-scheduled')}>Scheduled</span>
                  <div className={cx('delivery-items')}>
                    {latest.items.map((item) => `${item.quantity} x ${item.name}`).join(', ')}
                  </div>
                </div>
              )}
            </div>
            <div className={cx('card quick-order-card')}>
              <div className={cx('card-body')}>
                <i className={cx('fas fa-plus-circle')}></i>
                <h3>Need water now?</h3>
                <p>Place a quick order for immediate delivery</p>
                <button type="button" className={cx('btn btn-primary')} onClick={() => navigate('/order')}>Quick Order</button>
              </div>
            </div>
          </div>

          {/* Order Status Tracker */}
          {latest && (
            <div className={cx('card order-tracker-card')}>
              <div className={cx('card-header')}>
                <i className={cx('fas fa-map-signs')}></i>
                <h3>Current Order Status</h3>
                <span className={cx('order-number')}>Order #{latest.id}</span>
              </div>
              <div className={cx('card-body')}>
                <div className={cx('progress-tracker')}>
                  {STAGE_META.map((stage, index) => (
                    <StageStep key={stage.label} stage={stage} index={index} activeIndex={activeIndex} />
                  ))}
                </div>
                <div className={cx('tracker-info')}>
                  <p>Your order is <strong>{statusText}</strong></p>
                  {showEstimate && <p className={cx('estimated-time')}>Estimated delivery by 11:30 AM</p>}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className={cx('quick-stats')}>
            <div className={cx('stat-card')}>
              <i className={cx('fas fa-shopping-bag')}></i>
              <div>
                <span className={cx('stat-value')}>{ordersThisMonth}</span>
                <span className={cx('stat-label')}>Orders This Month</span>
              </div>
            </div>
            <div className={cx('stat-card')}>
              <i className={cx('fas fa-sync-alt')}></i>
              <div>
                <span className={cx('stat-value')}>{subscriptionActive ? 'Active' : 'None'}</span>
                <span className={cx('stat-label')}>Subscription Status</span>
              </div>
            </div>
            <div className={cx('stat-card')}>
              <i className={cx('fas fa-tint')}></i>
              <div>
                <span className={cx('stat-value')}>—</span>
                <span className={cx('stat-label')}>Bottles on Hand</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </CustomerShell>
  );
}

function StageStep({ stage, index, activeIndex }) {
  const state = activeIndex > index ? 'completed' : activeIndex === index ? 'active' : '';
  const line = index === 0 ? null : (
    <div className={cx('progress-line', activeIndex >= index ? (activeIndex === index ? 'active' : 'completed') : '')}></div>
  );
  return (
    <>
      {line}
      <div className={cx('progress-step', state)}>
        <div className={cx('step-icon')}>
          <i className={cx('fas', state === 'completed' ? 'fa-check' : stage.icon)}></i>
        </div>
        <span>{stage.label}</span>
      </div>
    </>
  );
}
