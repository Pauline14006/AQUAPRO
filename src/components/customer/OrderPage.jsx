import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import ordersStyles from '../../styles/customerOrders.module.css';
import { useToast } from '../common/Toast';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles);

export const PRODUCTS = [
  { id: 'slim', name: 'Slim Container', desc: '3-gallon container', price: 25 },
  { id: 'round', name: 'Round Container', desc: '4-gallon container', price: 30 },
  { id: 'bottle', name: '5-Gallon Bottle', desc: 'Large 5-gallon bottle', price: 35 },
];

// Today's date in the user's local time (same-day delivery is allowed).
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const clampQty = (n) => Math.max(0, Math.min(10, Number.parseInt(n, 10) || 0));

export default function OrderPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [params] = useSearchParams();
  const minDate = useMemo(todayISO, []);
  const [qty, setQty] = useState({ slim: 0, round: 0, bottle: 0 });
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [instructions, setInstructions] = useState('');

  // ?reorder=<id> pre-fills quantities from an earlier order
  const reorderId = params.get('reorder');
  useEffect(() => {
    if (!reorderId) return;
    const order = store.getOrders().find((o) => String(o.id) === reorderId);
    if (!order) {
      showToast('That order could not be found.', 'error');
      return;
    }
    const next = { slim: 0, round: 0, bottle: 0 };
    order.items.forEach((item) => {
      const product = PRODUCTS.find((p) => p.name === item.name);
      if (product) next[product.id] = clampQty(item.quantity);
    });
    setQty(next);
  }, [reorderId, showToast]);

  const items = PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => ({ name: p.name, price: p.price, quantity: qty[p.id] }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = items.length ? store.getDeliveryFee() : 0;

  function placeOrder() {
    const user = store.getCurrentUser();
    if (!items.length) {
      showToast('Select at least one product.', 'error');
      return;
    }
    if (!date || date < minDate) {
      showToast('Choose a valid delivery date.', 'error');
      return;
    }
    const order = store.createOrder({
      email: user.email,
      customer: user.name,
      phone: user.phone || '',
      barangay: user.barangay || '',
      address: user.address || '',
      items,
      subtotal,
      deliveryFee: store.getDeliveryFee(),
      total: subtotal + store.getDeliveryFee(),
      date,
      timeSlot,
      instructions: instructions.trim(),
      status: 'pending',
      driverEmail: '',
      payment: 'Cash on Delivery',
      createdAt: new Date().toISOString(),
    });
    navigate(`/order-history?new=${order.id}`);
  }

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>Place an Order</h1>
            <p>Choose your water products and delivery time.</p>
          </div>
        </header>
        <div className={cx('order-container')}>
          <div className={cx('order-products')}>
            <div className={cx('card')}>
              <div className={cx('card-header')}>
                <h3>Select Products</h3>
              </div>
              <div className={cx('card-body product-grid')}>
                {PRODUCTS.map((p) => (
                  <div className={cx('product-card')} key={p.id}>
                    <div className={cx('product-info')}>
                      <h3>{p.name}</h3>
                      <p className={cx('product-desc')}>{p.desc}</p>
                      <p className={cx('product-price')}>{store.formatCurrency(p.price)}</p>
                      <div className={cx('quantity-selector')}>
                        <button type="button" className={cx('qty-btn')} onClick={() => setQty((q) => ({ ...q, [p.id]: clampQty(q[p.id] - 1) }))}>−</button>
                        <input
                          className={cx('qty-input')}
                          type="number"
                          min="0"
                          max="10"
                          value={qty[p.id]}
                          onChange={(e) => setQty((q) => ({ ...q, [p.id]: clampQty(e.target.value) }))}
                          aria-label={`${p.name} quantity`}
                        />
                        <button type="button" className={cx('qty-btn')} onClick={() => setQty((q) => ({ ...q, [p.id]: clampQty(q[p.id] + 1) }))}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={cx('card')}>
              <div className={cx('card-header')}>
                <h3>Schedule Delivery</h3>
              </div>
              <div className={cx('card-body schedule-grid')}>
                <label>
                  Delivery Date
                  <input type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <label>
                  Time Slot
                  <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                    <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                  </select>
                </label>
                <label className={cx('full-width')}>
                  Special Instructions
                  <textarea
                    rows="3"
                    maxLength="300"
                    placeholder="Optional delivery instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  ></textarea>
                </label>
              </div>
            </div>
          </div>
          <aside className={cx('order-summary-sidebar')}>
            <div className={cx('card')}>
              <div className={cx('card-header')}>
                <h3>Order Summary</h3>
              </div>
              <div className={cx('card-body')}>
                <div>
                  {items.length === 0 ? (
                    <p className={cx('empty-cart')}>No items selected yet</p>
                  ) : (
                    items.map((item) => (
                      <div className={cx('summary-item')} key={item.name}>
                        <span className={cx('item-name')}>{item.name} x{item.quantity}</span>
                        <span className={cx('item-price')}>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className={cx('summary-totals')}>
                  <div className={cx('summary-row')}>
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className={cx('summary-row')}>
                    <span>Delivery Fee</span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className={cx('summary-row total')}>
                    <strong>Total</strong>
                    <strong>₱{(subtotal + deliveryFee).toFixed(2)}</strong>
                  </div>
                </div>
                <button type="button" className={cx('btn btn-primary btn-full')} disabled={!items.length} onClick={placeOrder}>
                  Place Order
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </CustomerShell>
  );
}
