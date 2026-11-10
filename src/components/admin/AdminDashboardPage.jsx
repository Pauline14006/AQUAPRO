import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { STATUS_LABELS } from '../../lib/constants';
import adminStyles from '../../styles/admin.module.css';
import { useToast } from '../common/Toast';
import AdminShell, { useSidebarToggle } from './AdminShell';

const cx = makeCx(adminStyles);
const STATUSES = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];

const NOTIFICATIONS = [
  { icon: 'fa-exclamation-triangle text-warning', text: 'Low stock alert: 5-Gallon bottles', time: '5 minutes ago', unread: true },
  { icon: 'fa-truck text-primary', text: 'Driver Roberto completed 5 deliveries', time: '15 minutes ago', unread: true },
  { icon: 'fa-user-plus text-success', text: 'New customer registered: Ana Reyes', time: '1 hour ago' },
  { icon: 'fa-clipboard-check text-info', text: 'Order #1050 marked as delivered', time: '2 hours ago' },
  { icon: 'fa-exclamation-circle text-danger', text: 'Customer complaint: Order #1048 delay', time: '3 hours ago' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Today's date in local time (toISOString() uses UTC, which can give the wrong day).
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const peso = (n) => `₱${Math.round(Number(n)).toLocaleString('en-US')}`;
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className={cx('notification-bell')} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
      <i className={cx('fas fa-bell')}></i>
      <span className={cx('notification-badge')}>5</span>
      <div className={cx('notification-dropdown', open && 'show')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('notification-header')}>
          <h4>Notifications</h4>
          <a href="#" onClick={(e) => e.preventDefault()}>Mark all read</a>
        </div>
        {NOTIFICATIONS.map((n) => (
          <div className={cx('notification-item', n.unread && 'unread')} key={n.text}>
            <i className={cx('fas', n.icon)}></i>
            <div>
              <p>{n.text}</p>
              <small>{n.time}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const showToast = useToast();
  const toggleSidebar = useSidebarToggle();
  const now = useClock();
  const [query, setQuery] = useState('');
  const orders = store.useStoreData(store.getOrders);
  const users = store.useStoreData(store.getUsers);
  const inventory = store.useStoreData(store.getInventory);

  const today = toISO(now);
  const yesterday = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const counted = orders.filter((o) => o.status !== 'cancelled');
  const salesOn = (iso) => counted.filter((o) => o.date === iso).reduce((sum, o) => sum + Number(o.total), 0);

  const todayOrders = orders.filter((o) => o.date === today);
  const orderDiff = todayOrders.length - orders.filter((o) => o.date === yesterday).length;
  const sales = salesOn(today);
  const salesDiff = sales - salesOn(yesterday);
  const pending = orders.filter((o) => ['pending', 'confirmed', 'delivering'].includes(o.status)).length;
  const needDriver = orders.filter((o) => ['pending', 'confirmed'].includes(o.status) && !o.driverEmail).length;
  const allDrivers = users.filter((u) => u.role === 'driver');
  const drivers = allDrivers.filter((u) => u.active !== false).length;
  const filledBottles = inventory.filter((i) => i.status === 'in-stock').length;
  const lowStock = filledBottles < 10; // same rule as the Inventory page warning
  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, todayOrders.filter((o) => o.status === s).length]));

  // Sales of the last 7 days (today is the last bar)
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    return { day: i === 6 ? 'Today' : DAY_NAMES[d.getDay()], total: salesOn(toISO(d)), highlight: i === 6 };
  });
  const weeklyMax = Math.max(...weekly.map((w) => w.total), 1);

  // Top 3 customers of the current month by amount spent
  const byCustomer = {};
  counted.filter((o) => String(o.date || '').startsWith(today.slice(0, 7))).forEach((o) => {
    const c = byCustomer[o.email] || { name: o.customer, barangay: o.barangay, orders: 0, total: 0 };
    c.orders += 1;
    c.total += Number(o.total);
    byCustomer[o.email] = c;
  });
  const topCustomers = Object.values(byCustomer).sort((x, y) => y.total - x.total).slice(0, 3);

  const recent = orders
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5)
    .filter((o) => {
      const text = `#${o.id} ${o.customer} ${o.barangay} ${o.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')} ${o.status}`;
      return text.toLowerCase().includes(query.toLowerCase());
    });

  function viewOrder(order) {
    window.alert(`Order #${order.id}\n${order.customer}\n${order.address}\nTotal: ₱${Number(order.total).toFixed(2)}\nStatus: ${order.status}`);
  }

  function updateStatus(order) {
    const status = window.prompt('Set order status: pending, confirmed, delivering, delivered, cancelled', order.status);
    if (status === null) return;
    if (STATUSES.includes(status.toLowerCase())) store.updateOrder(order.id, { status: status.toLowerCase() });
    else showToast('Choose a valid order status.', 'error');
  }

  const stats = [
    { icon: 'fa-shopping-bag', color: 'blue', value: todayOrders.length, label: "Today's Orders", change: `${signed(orderDiff)} vs yesterday`, tone: orderDiff >= 0 ? 'positive' : 'negative' },
    { icon: 'fa-clock', color: 'orange', value: pending, label: 'Pending Deliveries', change: `${needDriver} need a driver`, tone: needDriver > 0 ? 'negative' : 'neutral' },
    { icon: 'fa-peso-sign', color: 'green', value: `₱${sales.toFixed(2)}`, label: 'Total Sales Today', change: `${salesDiff >= 0 ? '+' : '-'}${peso(Math.abs(salesDiff))} vs yesterday`, tone: salesDiff >= 0 ? 'positive' : 'negative' },
    { icon: 'fa-id-card', color: 'blue', value: drivers, label: 'Active Drivers', change: `${allDrivers.length - drivers} off duty`, tone: 'neutral' },
    { icon: 'fa-exclamation-triangle', color: lowStock ? 'red' : 'green', value: filledBottles, label: 'Filled Bottles in Stock', change: lowStock ? 'Low stock - restock needed' : 'Stock is healthy', tone: lowStock ? 'negative' : 'positive' },
  ];

  return (
    <>
      {/* Header */}
      <header className={cx('admin-header')}>
        <div className={cx('header-left')}>
          <div className={cx('mobile-menu-btn')} onClick={toggleSidebar} role="button" aria-label="Toggle menu">
            <i className={cx('fas fa-bars')}></i>
          </div>
          <div>
            <h1>Admin Dashboard</h1>
            <p className={cx('date-time')}>
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className={cx('header-center')}>
          <div className={cx('search-bar')}>
            <i className={cx('fas fa-search')}></i>
            <input type="text" placeholder="Search orders, customers, drivers..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className={cx('header-right')}>
          <NotificationBell />
          <div className={cx('user-avatar admin-avatar')} title="Maria Santos - Admin">
            <span>MS</span>
          </div>
        </div>
      </header>

      <div className={cx('admin-dashboard')}>
        {/* Quick Action Buttons */}
        <div className={cx('quick-actions')}>
          <button type="button" className={cx('btn btn-primary')} onClick={() => navigate('/admin/orders')}>
            <i className={cx('fas fa-plus')}></i> New Order
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={() => navigate('/admin/delivery')}>
            <i className={cx('fas fa-truck')}></i> Assign Deliveries
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={() => navigate('/admin/inventory')}>
            <i className={cx('fas fa-box')}></i> Log Inventory
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={() => navigate('/admin/reports')}>
            <i className={cx('fas fa-download')}></i> Generate Report
          </button>
        </div>

        {/* Stat Cards */}
        <div className={cx('stat-cards')}>
          {stats.map((s) => (
            <div className={cx('stat-card')} key={s.label}>
              <div className={cx('stat-icon', s.color)}>
                <i className={cx('fas', s.icon)}></i>
              </div>
              <div className={cx('stat-info')}>
                <span className={cx('stat-value')}>{s.value}</span>
                <span className={cx('stat-label')}>{s.label}</span>
              </div>
              <span className={cx('stat-change', s.tone)}>{s.change}</span>
            </div>
          ))}
        </div>

        <div className={cx('dashboard-row')}>
          {/* Recent Orders Table */}
          <div className={cx('card recent-orders-card')}>
            <div className={cx('card-header')}>
              <h3>Recent Orders</h3>
              <Link to="/admin/orders" className={cx('view-all')}>
                View All Orders <i className={cx('fas fa-arrow-right')}></i>
              </Link>
            </div>
            <div className={cx('table-container')}>
              <table className={cx('data-table')}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>{order.customer}</td>
                      <td>{order.barangay}</td>
                      <td>{order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</td>
                      <td>₱{Number(order.total).toFixed(2)}</td>
                      <td><span className={cx('status-badge', `status-${order.status}`)}>{STATUS_LABELS[order.status] || order.status}</span></td>
                      <td>
                        <div className={cx('action-btns')}>
                          <button type="button" className={cx('btn btn-sm btn-primary')} onClick={() => viewOrder(order)}>View</button>
                          <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => updateStatus(order)}>Update</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Charts & Quick Info */}
          <div className={cx('right-column')}>
            <div className={cx('card sales-chart-card')}>
              <div className={cx('card-header')}>
                <h3>Weekly Sales Trend</h3>
                <span className={cx('chart-period')} style={{ border: 'none', background: 'none' }}>Last 7 days</span>
              </div>
              <div className={cx('chart-container')}>
                <div className={cx('bar-chart')}>
                  {weekly.map((bar, i) => (
                    <div className={cx('bar-group', bar.highlight && 'highlight')} key={`${bar.day}-${i}`}>
                      <div className={cx('bar')} style={{ height: `${Math.max(4, Math.round((bar.total / weeklyMax) * 100))}%` }}>
                        <span className={cx('bar-value')}>{peso(bar.total)}</span>
                      </div>
                      <span className={cx('bar-label')}>{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cx('card top-customers-card')}>
              <div className={cx('card-header')}>
                <h3>Top Customers This Month</h3>
                <Link to="/admin/customers" className={cx('view-all')}>View All</Link>
              </div>
              <div className={cx('card-body')}>
                {topCustomers.length === 0 && <p style={{ padding: '8px 0', opacity: 0.7 }}>No orders yet this month.</p>}
                {topCustomers.map((c, i) => (
                  <div className={cx('top-customer-item')} key={c.name + i}>
                    <div className={cx('customer-rank')}>{i + 1}</div>
                    <div className={cx('customer-info')}>
                      <strong>{c.name}</strong>
                      <span>{c.barangay}</span>
                    </div>
                    <div className={cx('customer-stats')}>
                      <span>{c.orders} orders</span>
                      <span className={cx('amount')}>{peso(c.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Status Overview */}
        <div className={cx('card delivery-overview-card')}>
          <div className={cx('card-header')}>
            <h3>Today's Delivery Status Overview</h3>
          </div>
          <div className={cx('card-body')}>
            <div className={cx('delivery-status-grid')}>
              {STATUSES.map((s) => (
                <div className={cx('delivery-status-item')} key={s}>
                  <div className={cx('status-circle', s)}>{statusCounts[s]}</div>
                  <span>{STATUS_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell cx={cx}>
      <DashboardContent />
    </AdminShell>
  );
}
