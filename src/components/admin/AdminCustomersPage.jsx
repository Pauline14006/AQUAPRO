import { useState } from 'react';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { downloadText, toCsv } from '../../lib/download';
import adminStyles from '../../styles/admin.module.css';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles);
const BARANGAY_FILTERS = ['Acacia', 'Baybay', 'Rizal', 'Washington', 'Cervantes'];

export default function AdminCustomersPage() {
  const users = store.useStoreData(store.getUsers);
  const orders = store.useStoreData(store.getOrders);
  const subscriptions = store.useStoreData(store.getSubscriptions);
  const [query, setQuery] = useState('');
  const [barangay, setBarangay] = useState('');
  const [sort, setSort] = useState('');

  const customers = users
    .filter((u) => u.role === 'customer')
    .map((u, index) => ({
      ...u,
      code: `#C${String(index + 1).padStart(3, '0')}`,
      orders: orders.filter((o) => o.email === u.email),
      subscribed: Boolean(subscriptions[u.email]?.active),
      isActive: u.active !== false,
    }));

  const rows = customers
    .filter((c) => {
      const text = `${c.code} ${c.name} ${c.email} ${c.phone || ''} ${c.barangay || ''} ${c.orders.length}`.toLowerCase();
      return text.includes(query.toLowerCase()) && (!barangay || c.barangay === barangay);
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'orders') return b.orders.length - a.orders.length;
      if (sort === 'date') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  function toggleActive(customer) {
    store.saveUsers(store.getUsers().map((u) => (u.email === customer.email ? { ...u, active: !(u.active !== false) } : u)));
  }

  function exportCustomers() {
    downloadText(
      'aquapro-customers.csv',
      toCsv([
        ['Customer ID', 'Name', 'Email', 'Phone', 'Barangay', 'Total Orders', 'Status'],
        ...customers.map((c) => [c.code, c.name, c.email, c.phone, c.barangay, c.orders.length, c.isActive ? 'Active' : 'Inactive']),
      ]),
      'text/csv',
    );
  }

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Customers Management" subtitle="View and manage registered customers">
        <div className={cx('header-actions')}>
          <button type="button" className={cx('btn btn-primary')}>
            <i className={cx('fas fa-plus')}></i> Add Customer
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={exportCustomers}>
            <i className={cx('fas fa-download')}></i> Export
          </button>
        </div>
      </AdminHeader>

      {/* Filters */}
      <div className={cx('filters-bar')}>
        <div className={cx('search-bar')}>
          <i className={cx('fas fa-search')}></i>
          <input type="text" placeholder="Search customers..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={cx('filter-select')} value={barangay} onChange={(e) => setBarangay(e.target.value)}>
          <option value="">All Barangays</option>
          {BARANGAY_FILTERS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className={cx('filter-select')} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort by</option>
          <option value="name">Name</option>
          <option value="orders">Total Orders</option>
          <option value="date">Registration Date</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className={cx('card')}>
        <div className={cx('table-container')}>
          <table className={cx('data-table')}>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Barangay</th>
                <th>Total Orders</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.email}>
                  <td>{c.code}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.phone || ''}</td>
                  <td>{c.barangay || ''}</td>
                  <td>{c.orders.length}</td>
                  <td>
                    <span className={cx('status-badge', c.subscribed ? 'status-confirmed' : 'status-cancelled')}>
                      {c.subscribed ? 'Active' : 'None'}
                    </span>
                  </td>
                  <td>
                    <span className={cx('status-badge', c.isActive ? 'status-delivered' : 'status-cancelled')}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={cx('action-btns')}>
                      <button
                        type="button"
                        className={cx('btn btn-sm btn-primary')}
                        title="View"
                        onClick={() => window.alert(`${c.name}\n${c.email}\n${c.phone || ''}\n${c.address || ''}\nOrders: ${c.orders.length}`)}
                      >
                        <i className={cx('fas fa-eye')}></i>
                      </button>
                      <button type="button" className={cx('btn btn-sm btn-outline')} title="Toggle status" onClick={() => toggleActive(c)}>
                        <i className={cx('fas fa-user-edit')}></i>
                      </button>
                      <button
                        type="button"
                        className={cx('btn btn-sm btn-outline')}
                        title="Order History"
                        onClick={() =>
                          window.alert(`${c.name}: ${c.orders.length} orders\n${c.orders.map((o) => `#${o.id} ${o.date} ${o.status}`).join('\n')}`)
                        }
                      >
                        <i className={cx('fas fa-history')}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cx('table-pagination')}>
          <span>Showing {rows.length} customers</span>
        </div>
      </div>
    </AdminShell>
  );
}
