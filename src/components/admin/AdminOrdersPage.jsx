import { useState } from 'react';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { STATUS_LABELS } from '../../lib/constants';
import { downloadText, toCsv } from '../../lib/download';
import { printOrderReceipt } from '../../lib/html';
import adminStyles from '../../styles/admin.module.css';
import ordersStyles from '../../styles/adminCustomerOrders.module.css';
import { useToast } from '../common/Toast';
import Pagination, { paginate } from '../common/Pagination';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles, ordersStyles);
const STATUSES = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];
const PRICES = { '5-Gallon Bottle': 35, 'Round Container': 30, 'Slim Container': 25 };
const PAGE_SIZE = 10;

function matchesDate(order, filter) {
  if (!filter) return true;
  const date = new Date(`${order.date}T00:00:00`);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (filter === 'today') return days === 0;
  if (filter === 'yesterday') return days === 1;
  if (filter === 'week') return days >= 0 && days <= 7;
  if (filter === 'month') return date.getMonth() === new Date().getMonth();
  return true;
}

function promptStatus(message, current) {
  const next = window.prompt(message, current);
  if (next === null) return null;
  return STATUSES.includes(next.toLowerCase()) ? next.toLowerCase() : false;
}

function NewOrderModal({ open, onClose }) {
  const showToast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const customers = store.useStoreData(() => store.getUsers().filter((u) => u.role === 'customer'));
  const [form, setForm] = useState({ email: '', date: today, product: '5-Gallon Bottle', quantity: 1 });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function create() {
    const quantity = Number(form.quantity);
    const customer = customers.find((u) => u.email === form.email);
    if (!customer || !form.date || quantity < 1 || quantity > 10) {
      showToast('Select a customer, delivery date, and quantity from 1 to 10.', 'error');
      return;
    }
    const price = PRICES[form.product];
    const fee = store.getDeliveryFee();
    store.createOrder({
      email: customer.email, customer: customer.name, phone: customer.phone || '', barangay: customer.barangay || '',
      address: customer.address || '', items: [{ name: form.product, quantity, price }],
      subtotal: price * quantity, deliveryFee: fee, total: price * quantity + fee, date: form.date,
      timeSlot: 'morning', instructions: '', status: 'pending', driverEmail: '',
      payment: 'Cash on Delivery', createdAt: new Date().toISOString(),
    });
    onClose();
    showToast('Order created.', 'success');
  }

  return (
    <div className={cx('modal', open && 'active')} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal-content modal-lg')}>
        <div className={cx('modal-header')}>
          <h2>New Order</h2>
          <button type="button" className={cx('modal-close')} onClick={onClose}>×</button>
        </div>
        <div className={cx('modal-body')}>
          <div className={cx('form-row')}>
            <div className={cx('form-group')}>
              <label htmlFor="new-order-customer">Customer</label>
              <select id="new-order-customer" value={form.email} onChange={set('email')}>
                <option value="">Select customer...</option>
                {customers.map((u) => <option key={u.email} value={u.email}>{u.name}</option>)}
              </select>
            </div>
            <div className={cx('form-group')}>
              <label htmlFor="new-order-date">Delivery Date</label>
              <input id="new-order-date" type="date" min={today} value={form.date} onChange={set('date')} />
            </div>
          </div>
          <div className={cx('form-row')}>
            <div className={cx('form-group')}>
              <label htmlFor="new-order-product">Product</label>
              <select id="new-order-product" value={form.product} onChange={set('product')}>
                {Object.keys(PRICES).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={cx('form-group')}>
              <label htmlFor="new-order-qty">Quantity</label>
              <input id="new-order-qty" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
            </div>
          </div>
        </div>
        <div className={cx('modal-footer')}>
          <button type="button" className={cx('btn btn-outline')} onClick={onClose}>Cancel</button>
          <button type="button" className={cx('btn btn-primary')} onClick={create}>Create Order</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const showToast = useToast();
  const orders = store.useStoreData(() => store.getOrders().sort((a, b) => Number(b.id) - Number(a.id)));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = orders.filter((o) => {
    const text = `${o.id} ${o.customer} ${o.email} ${o.address} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (!status || o.status === status) && matchesDate(o, dateFilter);
  });
  const info = paginate(filtered, page, PAGE_SIZE);
  const allChecked = info.visible.length > 0 && info.visible.every((o) => selected.has(o.id));

  const toggle = (id) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = (checked) => setSelected(checked ? new Set(info.visible.map((o) => o.id)) : new Set());
  const resetPage = (fn) => (e) => { fn(e.target.value); setPage(1); };

  function viewOrder(order) {
    window.alert(
      `Order #${order.id}\nCustomer: ${order.customer}\nAddress: ${order.address}\nItems: ${order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}\nTotal: ₱${Number(order.total).toFixed(2)}\nStatus: ${order.status}`,
    );
  }

  function updateStatus(order) {
    const next = promptStatus('Set status: pending, confirmed, delivering, delivered, cancelled', order.status);
    if (next) store.updateOrder(order.id, { status: next });
    else if (next === false) showToast('Choose a valid order status.', 'error');
  }

  function bulkUpdate() {
    const next = promptStatus('Set status for selected orders: pending, confirmed, delivering, delivered, cancelled', '');
    if (next) {
      selected.forEach((id) => store.updateOrder(id, { status: next }));
      setSelected(new Set());
    } else if (next === false) showToast('Choose a valid order status.', 'error');
  }

  function exportOrders() {
    const csv = toCsv([
      ['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Total'],
      ...store.getOrders().map((o) => [o.id, o.customer, o.email, o.date, o.status, o.total]),
    ]);
    downloadText('aquapro-orders.csv', csv, 'text/csv');
  }

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Orders Management" subtitle="View and manage all customer orders">
        <div className={cx('header-actions')}>
          <button type="button" className={cx('btn btn-primary')} onClick={() => setModalOpen(true)}>
            <i className={cx('fas fa-plus')}></i> New Order
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={exportOrders}>
            <i className={cx('fas fa-download')}></i> Export
          </button>
        </div>
      </AdminHeader>

      {/* Filters & Search */}
      <div className={cx('filters-bar')}>
        <div className={cx('search-bar')}>
          <i className={cx('fas fa-search')}></i>
          <input type="text" placeholder="Search by Order ID, Customer Name..." value={search} onChange={resetPage(setSearch)} />
        </div>
        <select className={cx('filter-select')} value={status} onChange={resetPage(setStatus)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className={cx('filter-select')} value={dateFilter} onChange={resetPage(setDateFilter)}>
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select className={cx('filter-select')}>
          <option value="">All Payment Methods</option>
          <option value="cod">Cash on Delivery</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className={cx('card')}>
        <div className={cx('table-container')}>
          <table className={cx('data-table')}>
            <thead>
              <tr>
                <th><input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all" /></th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {info.visible.map((order) => (
                <tr key={order.id}>
                  <td><input type="checkbox" checked={selected.has(order.id)} onChange={() => toggle(order.id)} aria-label={`Select order ${order.id}`} /></td>
                  <td><strong>#{order.id}</strong></td>
                  <td>{order.customer}</td>
                  <td>{order.phone}</td>
                  <td>{order.barangay}</td>
                  <td>{order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</td>
                  <td>₱{Number(order.total).toFixed(2)}</td>
                  <td>{order.date}</td>
                  <td><span className={cx('status-badge', `status-${order.status}`)}>{STATUS_LABELS[order.status] || order.status}</span></td>
                  <td>
                    <div className={cx('action-btns')}>
                      <button type="button" className={cx('btn btn-sm btn-primary')} title="View Details" onClick={() => viewOrder(order)}><i className={cx('fas fa-eye')}></i></button>
                      <button type="button" className={cx('btn btn-sm btn-outline')} title="Update Status" onClick={() => updateStatus(order)}><i className={cx('fas fa-check')}></i></button>
                      <button
                        type="button"
                        className={cx('btn btn-sm btn-outline')}
                        title="Print Receipt"
                        onClick={() => printOrderReceipt(order) || showToast('Allow pop-ups to print the receipt.', 'error')}
                      >
                        <i className={cx('fas fa-print')}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cx('table-footer')}>
          <div className={cx('bulk-actions')}>
            <button type="button" className={cx('btn btn-sm btn-outline')} disabled={!selected.size} onClick={bulkUpdate}>Bulk Update Status</button>
            <button type="button" className={cx('btn btn-sm btn-outline')} disabled={!selected.size} onClick={() => window.print()}>Bulk Print</button>
          </div>
          <Pagination cx={cx} info={info} onPage={setPage} />
        </div>
      </div>

      <NewOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AdminShell>
  );
}
