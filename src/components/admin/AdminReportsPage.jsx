import { useState } from 'react';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { downloadText, toCsv } from '../../lib/download';
import adminStyles from '../../styles/admin.module.css';
import { useToast } from '../common/Toast';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles);

function filterByPeriod(orders, period, start, end) {
  const now = new Date();
  if (period === 'custom') {
    if (!start || !end || start > end) return [];
    return orders.filter((o) => o.date >= start && o.date <= end);
  }
  return orders.filter((o) => {
    const date = new Date(`${o.date}T00:00:00`);
    if (period === 'last7') return date >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    if (period === 'last30') return date >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    if (period === 'thisMonth') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (period === 'lastMonth') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === last.getMonth() && date.getFullYear() === last.getFullYear();
    }
    return true;
  });
}

function BarChart({ bars }) {
  const max = Math.max(...bars.map((b) => b.value), 0);
  return (
    <div className={cx('bar-chart')}>
      {bars.map((bar) => (
        <div className={cx('bar-group')} key={bar.key}>
          <div className={cx('bar')} style={{ height: `${max ? Math.max(4, (bar.value / max) * 100) : 0}%` }}>
            <span className={cx('bar-value')}>{bar.display}</span>
          </div>
          <span className={cx('bar-label')}>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const showToast = useToast();
  const allOrders = store.useStoreData(store.getOrders);
  const users = store.useStoreData(store.getUsers);
  const [period, setPeriod] = useState('last7');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const orders = filterByPeriod(allOrders, period, start, end);
  const eligible = orders.filter((o) => o.status !== 'cancelled');
  const delivered = eligible.filter((o) => o.status === 'delivered').length;
  const revenue = eligible.reduce((s, o) => s + Number(o.total), 0);
  const activeCustomers = users.filter((u) => u.role === 'customer' && u.active !== false).length;

  const products = {};
  eligible.forEach((o) => o.items.forEach((i) => {
    products[i.name] = products[i.name] || { quantity: 0, revenue: 0 };
    products[i.name].quantity += Number(i.quantity);
    products[i.name].revenue += Number(i.quantity) * Number(i.price);
  }));

  const drivers = users.filter((u) => u.role === 'driver').map((d) => {
    const assigned = eligible.filter((o) => o.driverEmail === d.email);
    const done = assigned.filter((o) => o.status === 'delivered').length;
    return { name: d.name, done, total: assigned.length, rate: assigned.length ? Math.round((done / assigned.length) * 100) : 0 };
  });

  const salesBars = Array.from(new Set(orders.map((o) => o.date))).sort().slice(-7).map((key) => {
    const total = orders.filter((o) => o.date === key && o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
    return { key, label: new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }), value: total, display: `₱${total.toFixed(2)}` };
  });

  const now = new Date();
  const customers = users.filter((u) => u.role === 'customer');
  const growthBars = Array.from({ length: 4 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 3 + i, 1)).map((month) => {
    const count = customers.filter((u) => {
      if (!u.createdAt) return false;
      const created = new Date(u.createdAt);
      return created.getFullYear() === month.getFullYear() && created.getMonth() === month.getMonth();
    }).length;
    return { key: month.toISOString(), label: month.toLocaleDateString('en-US', { month: 'short' }), value: count, display: count };
  });

  function exportReport() {
    const csv = toCsv([['Order ID', 'Date', 'Customer', 'Status', 'Total'], ...orders.map((o) => [o.id, o.date, o.customer, o.status, o.total])]);
    downloadText(`aquapro-report-${period || 'all'}.csv`, csv, 'text/csv');
    showToast('Report exported as CSV.', 'success');
  }

  const stats = [
    { icon: 'fa-shopping-cart', color: 'blue', value: orders.length, label: 'Total Orders' },
    { icon: 'fa-peso-sign', color: 'green', value: `₱${revenue.toFixed(2)}`, label: 'Total Revenue' },
    { icon: 'fa-users', color: 'blue', value: activeCustomers, label: 'Active Customers' },
    { icon: 'fa-truck', color: 'orange', value: eligible.length ? `${Math.round((delivered / eligible.length) * 100)}%` : '0%', label: 'Delivery Rate' },
  ];

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Reports & Analytics" subtitle="Generate and view business reports">
        <div className={cx('header-actions')}>
          <select className={cx('filter-select')} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <input type="date" aria-label="Report start date" hidden={period !== 'custom'} value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" aria-label="Report end date" hidden={period !== 'custom'} value={end} onChange={(e) => setEnd(e.target.value)} />
          <button type="button" className={cx('btn btn-primary')} onClick={exportReport}>
            <i className={cx('fas fa-download')}></i> Export Report
          </button>
        </div>
      </AdminHeader>

      {/* Summary Stats */}
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
          </div>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className={cx('reports-grid')}>
        <div className={cx('card')}>
          <div className={cx('card-header')}>
            <h3><i className={cx('fas fa-chart-line')}></i> Sales Report</h3>
          </div>
          <div className={cx('card-body')}>
            <BarChart bars={salesBars} />
          </div>
        </div>

        <div className={cx('card')}>
          <div className={cx('card-header')}>
            <h3><i className={cx('fas fa-box')}></i> Top Products</h3>
          </div>
          <div className={cx('card-body')}>
            <table className={cx('data-table')}>
              <thead>
                <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {Object.keys(products).length === 0 && <tr><td colSpan="3">No order data for this period.</td></tr>}
                {Object.entries(products).map(([name, p]) => (
                  <tr key={name}><td>{name}</td><td>{p.quantity}</td><td>₱{p.revenue.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cx('card')}>
          <div className={cx('card-header')}>
            <h3><i className={cx('fas fa-users')}></i> Customer Growth</h3>
          </div>
          <div className={cx('card-body')}>
            <BarChart bars={growthBars} />
          </div>
        </div>

        <div className={cx('card')}>
          <div className={cx('card-header')}>
            <h3><i className={cx('fas fa-truck')}></i> Driver Performance</h3>
          </div>
          <div className={cx('card-body')}>
            <table className={cx('data-table')}>
              <thead>
                <tr><th>Driver</th><th>Deliveries</th><th>Rate</th></tr>
              </thead>
              <tbody>
                {drivers.length === 0 && <tr><td colSpan="3">No driver data.</td></tr>}
                {drivers.map((d) => (
                  <tr key={d.name}><td>{d.name}</td><td>{d.done}/{d.total}</td><td>{d.rate}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
