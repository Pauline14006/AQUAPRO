import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import { TIME_SLOTS } from '../../lib/constants';
import ordersStyles from '../../styles/customerOrders.module.css';
import pageStyles from '../../styles/subscription.module.css';
import { useToast } from '../common/Toast';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles, pageStyles);

const PRODUCTS = [
  { id: 'slim', name: 'Slim Container', desc: 'Compact 3-gallon slim container', price: 25, icon: 'fa-wine-bottle' },
  { id: 'round', name: 'Round Container', desc: 'Standard 4-gallon round container', price: 30, icon: 'fa-droplet' },
  { id: 'bottle', name: '5-Gallon Bottle', desc: 'Large 5-gallon bottle', price: 35, icon: 'fa-wine-bottle' },
];
const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];
const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', custom: 'Custom Days' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REMINDER_KEY = 'aquapro_reminder_preferences';

const inputStyle = { padding: '6px 10px', border: '2px solid #dce3eb', borderRadius: '10px', fontSize: '13px' };

function loadInitialState() {
  const user = store.getCurrentUser();
  const saved = user ? store.getSubscriptions()[user.email] : null;
  const reminder = store.read(REMINDER_KEY, null);
  return {
    preference: saved?.preference || 'one-time',
    frequency: saved?.frequency || 'weekly',
    days: saved?.frequency === 'custom' && saved.days ? saved.days : ['Mon', 'Thu'],
    reminderEnabled: reminder ? reminder.reminderEnabled : true,
    reminderPreset: reminder ? (reminder.isCustom ? 'custom' : reminder.reminderInterval) : '7',
    customValue: reminder?.customValue ?? '3',
    customUnit: reminder?.customUnit ?? 'days',
  };
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [qty, setQty] = useState({ slim: 1, round: 0, bottle: 0 });
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('morning');
  const [instructions, setInstructions] = useState('');
  const [prefs, setPrefs] = useState(loadInitialState);
  const [confirmation, setConfirmation] = useState(null);

  const setPref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  const changeQty = (id, delta) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(10, q[id] + delta)) }));

  const items = PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => ({ name: p.name, quantity: qty[p.id], price: p.price }));
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const deliveryFee = subtotal > 0 ? store.getDeliveryFee() : 0;
  const total = subtotal + deliveryFee;

  const closeModal = () => {
    setConfirmation(null);
    navigate('/order-history');
  };

  useEffect(() => {
    if (!confirmation) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeModal();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmation]);

  function placeOrder() {
    if (!items.length) {
      showToast('Select at least one product before placing your order.', 'error');
      return;
    }
    if (!date || date < today) {
      showToast('Choose a valid delivery date.', 'error');
      return;
    }
    const { preference, frequency, days } = prefs;
    if (preference === 'scheduled' && frequency === 'custom' && !days.length) {
      showToast('Choose at least one day for your custom schedule.', 'error');
      return;
    }

    const user = store.getCurrentUser();
    const order = store.createOrder({
      email: user.email,
      customer: user.name,
      phone: user.phone || '',
      barangay: user.barangay || '',
      address: user.address || '',
      items,
      subtotal,
      deliveryFee,
      total,
      date,
      timeSlot,
      instructions,
      status: 'pending',
      driverEmail: '',
      payment: 'Cash on Delivery',
      createdAt: new Date().toISOString(),
    });

    store.write(REMINDER_KEY, {
      reminderEnabled: prefs.reminderEnabled,
      reminderInterval: prefs.reminderPreset,
      isCustom: prefs.reminderPreset === 'custom',
      customValue: prefs.customValue,
      customUnit: prefs.customUnit,
    });

    const subscriptions = store.getSubscriptions();
    if (preference === 'scheduled') {
      const selectedDays = frequency === 'custom' ? days : [];
      subscriptions[user.email] = { active: true, frequency, days: selectedDays, preference, orderId: order.id };
      store.saveSubscriptions(subscriptions);
    } else if (subscriptions[user.email]) {
      subscriptions[user.email] = { ...subscriptions[user.email], active: false, preference };
      store.saveSubscriptions(subscriptions);
    }

    setConfirmation({ order, items, subtotal, deliveryFee, total, date, timeSlot, preference, frequency, instructions, reminder: prefs.reminderEnabled });
  }

  const showCustomReminder = prefs.reminderEnabled && prefs.reminderPreset === 'custom';

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>Order Preferences</h1>
            <p>Select products, schedule delivery &amp; set your preferences</p>
          </div>
        </header>

        <div className={cx('order-container')}>
          {/* Left Column */}
          <div className={cx('order-products')}>
            {/* Products */}
            <div className={cx('card')}>
              <div className={cx('card-header icon-right')}>
                <h3>1. Select Products</h3>
                <i className={cx('fas fa-box-open')}></i>
              </div>
              <div className={cx('card-body')}>
                <div className={cx('product-grid')}>
                  {PRODUCTS.map((p) => (
                    <div className={cx('product-card')} key={p.id}>
                      <div className={cx('product-image')}>
                        <i className={cx('fas', p.icon)}></i>
                      </div>
                      <div className={cx('product-info')}>
                        <h3>{p.name}</h3>
                        <p className={cx('product-desc')}>{p.desc}</p>
                        <p className={cx('product-price')}>{store.formatCurrency(p.price)}</p>
                        <div className={cx('quantity-selector')}>
                          <button type="button" className={cx('qty-btn minus')} onClick={() => changeQty(p.id, -1)}>−</button>
                          <input type="number" value={qty[p.id]} min="0" max="10" className={cx('qty-input')} readOnly aria-label={`${p.name} quantity`} />
                          <button type="button" className={cx('qty-btn plus')} onClick={() => changeQty(p.id, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className={cx('card delivery-schedule')} style={{ marginBottom: '0' }}>
              <div className={cx('card-header')}>
                <i className={cx('fas fa-calendar-check')}></i>
                <h3>2. Schedule Delivery</h3>
              </div>
              <div className={cx('card-body')}>
                <div className={cx('schedule-grid')}>
                  <div className={cx('schedule-item')}>
                    <label htmlFor="delivery-date">Delivery Date</label>
                    <input type="date" id="delivery-date" className={cx('date-picker')} min={today} value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className={cx('schedule-item')}>
                    <label htmlFor="time-slot">Time Slot</label>
                    <select id="time-slot" className={cx('time-slot-select')} value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                      <option value="morning">{TIME_SLOTS.morning}</option>
                      <option value="afternoon">{TIME_SLOTS.afternoon}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className={cx('card special-instructions')} style={{ marginBottom: '0' }}>
              <div className={cx('card-header')}>
                <i className={cx('fas fa-comment-alt')}></i>
                <h3>Special Instructions (Optional)</h3>
              </div>
              <div className={cx('card-body')}>
                <textarea
                  rows="3"
                  placeholder="E.g., Leave at the gate, call before arriving, etc."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={cx('order-summary-sidebar')}>
            {/* Preferences */}
            <div className={cx('card')}>
              <div className={cx('card-header icon-right')}>
                <h3>3. Delivery Preferences</h3>
                <i className={cx('fas fa-sliders-h')}></i>
              </div>
              <div className={cx('card-body')}>
                {[
                  { value: 'one-time', title: '📋 One-Time Order', text: 'Place this order only' },
                  { value: 'scheduled', title: '🔄 Scheduled Delivery', text: 'Repeat this order automatically' },
                ].map((opt) => (
                  <label className={cx('delivery-preference-option')} key={opt.value}>
                    <input
                      type="radio"
                      name="deliveryPreference"
                      value={opt.value}
                      checked={prefs.preference === opt.value}
                      onChange={() => setPref('preference', opt.value)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: '1' }}>
                      <div style={{ fontWeight: '600', color: '#1a2b3c', marginBottom: '4px' }}>{opt.title}</div>
                      <span style={{ fontSize: '13px', color: '#5f6b7a' }}>{opt.text}</span>
                    </div>
                  </label>
                ))}

                {prefs.preference === 'scheduled' && (
                  <div style={{ padding: '12px 0' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#3a4c5e', display: 'block', marginBottom: '8px' }}>
                      Frequency
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {FREQUENCIES.map((f) => (
                        <label className={cx('freq-option')} key={f.value}>
                          <input
                            type="radio"
                            name="frequency"
                            value={f.value}
                            checked={prefs.frequency === f.value}
                            onChange={() => setPref('frequency', f.value)}
                          />{' '}
                          {f.label}
                        </label>
                      ))}
                    </div>
                    {prefs.frequency === 'custom' && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontWeight: '600', fontSize: '13px', color: '#3a4c5e', display: 'block', marginBottom: '6px' }}>
                          Select Days
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {DAYS.map((day) => (
                            <label className={cx('day-chip')} key={day}>
                              <input
                                type="checkbox"
                                checked={prefs.days.includes(day)}
                                onChange={(e) =>
                                  setPref('days', e.target.checked ? DAYS.filter((d) => d === day || prefs.days.includes(d)) : prefs.days.filter((d) => d !== day))
                                }
                              />{' '}
                              {day}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <hr style={{ margin: '16px 0', border: '0.5px solid #e2e8f0' }} />
                <div style={{ background: '#f8fafd', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className={cx('fas fa-bell')} style={{ color: '#0066cc' }}></i>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a2b3c' }}>Reorder Reminder</span>
                    <label className={cx('switch')}>
                      <input type="checkbox" checked={prefs.reminderEnabled} onChange={(e) => setPref('reminderEnabled', e.target.checked)} />
                      <span className={cx('slider')}></span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#5f6b7a' }}>Notify after:</span>
                    <select style={inputStyle} disabled={!prefs.reminderEnabled} value={prefs.reminderPreset} onChange={(e) => setPref('reminderPreset', e.target.value)}>
                      <option value="7">7 days</option>
                      <option value="5">5 days</option>
                      <option value="10">10 days</option>
                      <option value="14">2 weeks</option>
                      <option value="30">1 month</option>
                      <option value="custom">✨ Custom</option>
                    </select>
                    <div style={{ display: showCustomReminder ? 'flex' : 'none', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={prefs.customValue}
                        onChange={(e) => setPref('customValue', e.target.value)}
                        style={{ ...inputStyle, width: '50px', padding: '6px', textAlign: 'center' }}
                      />
                      <select style={{ ...inputStyle, padding: '6px' }} value={prefs.customUnit} onChange={(e) => setPref('customUnit', e.target.value)}>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className={cx('order-summary')}>
              <h2>Order Summary</h2>
              <div className={cx('summary-items')}>
                {items.length === 0 ? (
                  <p className={cx('empty-cart')}>No items selected yet</p>
                ) : (
                  items.map((item) => (
                    <div className={cx('summary-item')} key={item.name}>
                      <span className={cx('item-name')}>{item.quantity}x {item.name}</span>
                      <span className={cx('item-price')}>₱{(item.quantity * item.price).toFixed(2)}</span>
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
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
              <button type="button" className={cx('btn btn-primary btn-full')} onClick={placeOrder}>
                <i className={cx('fas fa-shopping-cart')}></i> Place Order
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation modal */}
      <div className={cx('modal-overlay', confirmation && 'active')} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        {confirmation && (
          <div className={cx('modal-box')}>
            <div className={cx('modal-icon')}>✅</div>
            <h2>Order Placed Successfully!</h2>
            <div>
              <div className={cx('summary-block')}>
                <h4>📦 Order Details</h4>
                <p><strong>Order Number:</strong> #{confirmation.order.id}</p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(`${confirmation.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p><strong>Time Slot:</strong> {TIME_SLOTS[confirmation.timeSlot] || confirmation.timeSlot}</p>
              </div>
              <div className={cx('summary-block')}>
                <h4>🛒 Items Ordered</h4>
                {confirmation.items.map((item) => (
                  <p key={item.name}>{item.quantity}x {item.name} — ₱{(item.quantity * item.price).toFixed(2)}</p>
                ))}
              </div>
              <div className={cx('summary-block')}>
                <h4>💰 Payment Summary</h4>
                <p>Subtotal: <strong>₱{confirmation.subtotal.toFixed(2)}</strong></p>
                <p>Delivery Fee: <strong>₱{confirmation.deliveryFee.toFixed(2)}</strong></p>
                <p style={{ fontSize: '16px', marginTop: '6px' }}>Total: <strong>₱{confirmation.total.toFixed(2)}</strong></p>
              </div>
              <div className={cx('summary-block')}>
                <h4>⚙️ Delivery Preference</h4>
                <p><strong>{confirmation.preference === 'scheduled' ? '🔄 Scheduled Delivery' : '📋 One-Time Order'}</strong></p>
                {confirmation.preference === 'scheduled' && (
                  <p><strong>Frequency:</strong> {FREQ_LABELS[confirmation.frequency] || confirmation.frequency}</p>
                )}
                <p>{confirmation.reminder ? '🔔 Reminder: ON' : '🔕 Reminder: OFF'}</p>
              </div>
              {confirmation.instructions && (
                <div className={cx('summary-block')}>
                  <h4>📝 Special Instructions</h4>
                  <p>{confirmation.instructions}</p>
                </div>
              )}
            </div>
            <div className={cx('modal-actions')}>
              <button type="button" className={cx('btn btn-primary')} onClick={closeModal}>OK</button>
              <button type="button" className={cx('btn btn-outline')} onClick={() => navigate('/tracking')}>Track Order</button>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
