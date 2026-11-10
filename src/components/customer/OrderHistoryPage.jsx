import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { STATUS_LABELS } from '../../lib/constants';
import { downloadText, orderReceipt, toCsv } from '../../lib/download';
import ordersStyles from '../../styles/customerOrders.module.css';
import accountStyles from '../../styles/customerAccount.module.css';
import { useToast } from '../common/Toast';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles, accountStyles);
const PAGE_SIZE = 5;
const RATINGS_KEY = 'aquapro_ratings';
const AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233b82f6'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16'%3EJD%3C/text%3E%3C/svg%3E";

const itemText = (order) => order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ');
const statusLabel = (status) => STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);

function matchesDate(order, filter, now) {
  if (!filter) return true;
  const date = new Date(`${order.date}T00:00:00`);
  const days = Math.floor((now - date) / 86400000);
  if (filter === '7days') return days >= 0 && days <= 7;
  if (filter === '30days') return days >= 0 && days <= 30;
  if (filter === '90days') return days >= 0 && days <= 90;
  if (filter === 'year') return date.getFullYear() === now.getFullYear();
  return true;
}

/** Header avatar with the profile/logout dropdown. */
export function UserMenu({ cx: pageCx = cx }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !e.target.closest('[data-user-menu]') && setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  function handleLogout(e) {
    e.preventDefault();
    if (window.confirm('Are you sure you want to logout?')) {
      store.logout();
      navigate('/login');
    }
  }

  return (
    <div className={pageCx('user-avatar dropdown')} data-user-menu>
      <img src={AVATAR} alt="User" onClick={() => setOpen((o) => !o)} />
      <div className={pageCx('dropdown-menu', open && 'show')}>
        <Link to="/profile"><i className={pageCx('fas fa-user')}></i> My Profile</Link>
        <a href="#" onClick={handleLogout}><i className={pageCx('fas fa-sign-out-alt')}></i> Logout</a>
      </div>
    </div>
  );
}

function RatingCard({ order, saved, onSubmit }) {
  const [rating, setRating] = useState(saved?.rating || 0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(saved?.review || '');
  const submitted = Boolean(saved);
  const shown = hover || rating;

  return (
    <div className={cx('rating-card')}>
      <div className={cx('rating-order-info')}>
        <strong>Order #{order.id}</strong>
        <span>Delivered {new Date(`${order.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span>{itemText(order)}</span>
      </div>
      <div className={cx('star-rating')} style={submitted ? { pointerEvents: 'none' } : undefined} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i
            key={n}
            className={cx(n <= shown ? 'fas' : 'far', 'fa-star', n <= rating && 'active')}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
          ></i>
        ))}
      </div>
      <textarea placeholder="Add a review (optional)..." rows="2" value={review} onChange={(e) => setReview(e.target.value)} disabled={submitted}></textarea>
      <button type="button" className={cx('btn btn-primary btn-sm')} disabled={submitted} onClick={() => onSubmit(order.id, rating, review.trim())}>
        {submitted ? 'Rating Submitted ✓' : 'Submit Rating'}
      </button>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onReorder }) {
  if (!order) return <div className={cx('modal')}></div>;
  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.deliveryFee ?? 20;
  const total = order.total ?? subtotal + deliveryFee;

  return (
    <div className={cx('modal active')} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal-content modal-large')}>
        <div className={cx('modal-header')}>
          <h2>Order Details</h2>
          <button type="button" className={cx('modal-close')} onClick={onClose}>×</button>
        </div>
        <div className={cx('modal-body')}>
          <div className={cx('order-detail-section')}>
            <h4>Order Information</h4>
            <Detail label="Order ID" value={`#${order.id}`} />
            <Detail label="Date" value={`${order.date} ${order.timeSlot || ''}`} />
            <Detail label="Status" value={<span className={cx('status-badge')}>{order.status}</span>} />
            <Detail label="Payment Method" value={order.payment || 'Cash on Delivery'} />
          </div>
          <div className={cx('order-detail-section')}>
            <h4>Items Ordered</h4>
            <table className={cx('detail-items-table')}>
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>₱{Number(item.price).toFixed(2)}</td>
                    <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="3">Subtotal</td><td>₱{Number(subtotal).toFixed(2)}</td></tr>
                <tr><td colSpan="3">Delivery Fee</td><td>₱{Number(deliveryFee).toFixed(2)}</td></tr>
                <tr><td colSpan="3"><strong>Total</strong></td><td><strong>₱{Number(total).toFixed(2)}</strong></td></tr>
              </tfoot>
            </table>
          </div>
          <div className={cx('order-detail-section')}>
            <h4>Delivery Information</h4>
            <Detail label="Address" value={order.address || ''} />
            <Detail label="Driver" value={order.driverEmail || 'Not assigned'} />
            <Detail label="Delivered At" value={order.deliveredAt || ''} />
          </div>
        </div>
        <div className={cx('modal-footer')}>
          <button type="button" className={cx('btn btn-outline')} onClick={onClose}>Close</button>
          <button type="button" className={cx('btn btn-primary')} onClick={() => onReorder(order.id)}>
            <i className={cx('fas fa-redo')}></i> Reorder
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className={cx('detail-row')}>
      <span className={cx('label')}>{label}</span>
      <span className={cx('value')}>{value}</span>
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const user = store.useStoreData(store.getCurrentUser);
  const orders = store.useStoreData(() =>
    store.getOrders()
      .filter((o) => o.email === user?.email && !o.hiddenByCustomer) // removed orders stay in the admin records
      .sort((a, b) => Number(b.id) - Number(a.id)), // newest placed order first
  );
  const ratings = store.useStoreData(() => store.read(RATINGS_KEY, {}));

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState(null);

  const now = new Date();
  const q = query.toLowerCase();
  const filtered = orders.filter((o) => {
    const text = `#${o.id} ${o.date} ${itemText(o)} ${o.total} ${statusLabel(o.status)} ${o.payment || ''}`.toLowerCase();
    return text.includes(q) && (!status || o.status === status) && matchesDate(o, dateFilter, now);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const bottles = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + Number(i.quantity), 0), 0);
  const spent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const counts = {};
  orders.forEach((o) => o.items.forEach((i) => { counts[i.name] = (counts[i.name] || 0) + Number(i.quantity); }));
  const mostOrdered = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const delivered = orders.filter((o) => o.status === 'delivered').slice(0, 3);

  function reorder(id) {
    if (window.confirm(`Add items from Order #${id} to cart?`)) navigate(`/order?reorder=${id}`);
  }

  // Only delivered or cancelled orders can be removed.
  // The order is just hidden from the customer; the admin still has it.
  function removeOrder(order) {
    if (!['delivered', 'cancelled'].includes(order.status)) {
      showToast('Only delivered or cancelled orders can be removed.', 'error');
      return;
    }
    if (!window.confirm(`Remove Order #${order.id} from your history?\nThis cannot be undone.`)) return;
    store.updateOrder(order.id, { hiddenByCustomer: true });
    showToast(`Order #${order.id} removed from your history.`, 'success');
  }

  function exportHistory() {
    const csv = toCsv([
      ['Order ID', 'Date', 'Items', 'Total', 'Status'],
      ...orders.map((o) => [o.id, o.date, o.items.map((i) => `${i.quantity}x ${i.name}`).join('; '), o.total, o.status]),
    ]);
    downloadText('aquapro-order-history.csv', csv, 'text/csv');
    showToast('Order history exported as CSV.', 'success');
  }

  function submitRating(orderId, rating, review) {
    if (!rating) {
      showToast('Please select a rating', 'error');
      return;
    }
    store.write(RATINGS_KEY, { ...store.read(RATINGS_KEY, {}), [orderId]: { rating, review, submittedAt: new Date().toISOString() } });
    showToast(`Thank you for your ${rating}-star rating!`, 'success');
  }

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>Order History</h1>
            <p>View and manage all your past water orders</p>
          </div>
          <div className={cx('header-right')}>
            <div className={cx('notification-bell')}>
              <i className={cx('fas fa-bell')}></i>
              <span className={cx('notification-badge')}>1</span>
            </div>
            <UserMenu />
          </div>
        </header>

        <div className={cx('history-container')}>
          {/* Search and Filter Bar */}
          <div className={cx('history-toolbar')}>
            <div className={cx('search-bar')}>
              <i className={cx('fas fa-search')}></i>
              <input type="text" placeholder="Search by Order ID or Item..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            </div>
            <div className={cx('filter-group')}>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivering">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}>
                <option value="">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 3 Months</option>
                <option value="year">This Year</option>
              </select>
              <button type="button" className={cx('btn btn-outline')} onClick={exportHistory}>
                <i className={cx('fas fa-download')}></i> Export
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className={cx('history-stats')}>
            <StatCard icon="fa-shopping-bag" value={orders.length} label="Total Orders" />
            <StatCard icon="fa-tint" value={bottles} label="Bottles Ordered" />
            <StatCard icon="fa-peso-sign" value={`₱${spent.toFixed(2)}`} label="Total Spent" />
            <StatCard icon="fa-star" value="Most Ordered" label={mostOrdered} />
          </div>

          {/* Orders Table */}
          <div className={cx('card')}>
            <div className={cx('card-header')}>
              <h3><i className={cx('fas fa-list')}></i> All Orders</h3>
              <span className={cx('order-count')}>Showing {filtered.length} orders</span>
            </div>
            <div className={cx('table-container')}>
              <table className={cx('data-table')}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>{new Date(`${order.date}T00:00:00`).toLocaleDateString('en-US')}</td>
                      <td>{itemText(order)}</td>
                      <td>₱{Number(order.total).toFixed(2)}</td>
                      <td><span className={cx('status-badge', `status-${order.status}`)}>{statusLabel(order.status)}</span></td>
                      <td>{order.payment || 'Cash on Delivery'}</td>
                      <td>
                        <div className={cx('action-buttons')}>
                          <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => setDetails(order)} title="View Details">
                            <i className={cx('fas fa-eye')}></i>
                          </button>
                          <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => downloadText(`aquapro-order-${order.id}-receipt.txt`, orderReceipt(order))} title="Download Receipt">
                            <i className={cx('fas fa-download')}></i>
                          </button>
                          <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => reorder(order.id)} title="Reorder">
                            <i className={cx('fas fa-redo')}></i>
                          </button>
                          {['delivered', 'cancelled'].includes(order.status) && (
                            <button type="button" className={cx('btn btn-sm btn-outline')} style={{ color: 'var(--danger)' }} onClick={() => removeOrder(order)} title="Remove from history">
                              <i className={cx('fas fa-trash')}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className={cx('table-pagination')}>
              <span>
                Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </span>
              <div className={cx('pagination-buttons')}>
                <button type="button" className={cx('btn btn-sm')} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button type="button" key={n} className={cx('btn btn-sm', n === currentPage && 'active')} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button type="button" className={cx('btn btn-sm')} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
              </div>
            </div>
          </div>

          {/* Order Rating Cards */}
          {delivered.length > 0 && (
            <div className={cx('recent-orders-ratings')}>
              <h3>Rate Recent Deliveries</h3>
              <div className={cx('rating-cards')}>
                {delivered.map((order) => (
                  <RatingCard key={order.id} order={order} saved={ratings[order.id]} onSubmit={submitRating} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <OrderDetailsModal
        order={details}
        onClose={() => setDetails(null)}
        onReorder={(id) => { setDetails(null); reorder(id); }}
      />
    </CustomerShell>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className={cx('history-stat-card')}>
      <i className={cx('fas', icon)}></i>
      <div>
        <span className={cx('stat-value')}>{value}</span>
        <span className={cx('stat-label')}>{label}</span>
      </div>
    </div>
  );
}
