import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import ordersStyles from '../../styles/customerOrders.module.css';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles);

const STEPS = [
  { status: 'pending', title: 'Order Placed', text: 'Your order has been received', icon: 'fa-check' },
  { status: 'confirmed', title: 'Confirmed', text: 'Order confirmed by station', icon: 'fa-check' },
  { status: 'delivering', title: 'Out for Delivery', text: 'Driver is on the way', icon: 'fa-truck' },
  { status: 'delivered', title: 'Delivered', text: 'Water successfully delivered', icon: 'fa-box' },
];

function contactStation() {
  if (window.confirm('Call AquaPro Station at (055) 123-4567?')) {
    window.open('tel:0551234567');
  }
}

export default function TrackingPage() {
  const user = store.useStoreData(store.getCurrentUser);
  const order = store.useStoreData(() =>
    store.getOrders()
      .filter((o) => o.email === user?.email && !['delivered', 'cancelled'].includes(o.status))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0],
  );
  const driver = store.useStoreData(() => store.getUsers().find((u) => order && u.email === order.driverEmail));

  const activeIndex = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const fmt = store.formatCurrency;

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>Track Your Delivery</h1>
            <p>
              {order
                ? `Order #${order.id} · ${order.status.replace('-', ' ')}`
                : 'No active delivery. Place an order to start tracking.'}
            </p>
          </div>
        </header>

        {order && (
          <div className={cx('tracking-container')}>
            {/* Progress Tracker */}
            <div className={cx('card progress-card')}>
              <div className={cx('progress-tracker-large')}>
                {STEPS.map((step, index) => {
                  const state = activeIndex > index ? 'completed' : activeIndex === index ? 'active' : '';
                  return (
                    <Step key={step.status} index={index} activeIndex={activeIndex}>
                      <div className={cx('progress-step', state)}>
                        <div className={cx('step-circle', state === 'active' && 'pulse')}>
                          <i className={cx('fas', step.icon)}></i>
                        </div>
                        <div className={cx('step-info')}>
                          <strong>{step.title}</strong>
                          <span>{step.text}</span>
                        </div>
                        <div className={cx('step-time')}>{state ? (state === 'active' ? 'In progress' : 'Done') : 'Pending'}</div>
                      </div>
                    </Step>
                  );
                })}
              </div>
            </div>

            {/* Delivery Info & Map */}
            <div className={cx('delivery-details-grid')}>
              <div className={cx('card map-card')}>
                <div className={cx('map-placeholder')}>
                  <div className={cx('map-content')}>
                    <i className={cx('fas fa-map-marker-alt')}></i>
                    <p>Your Location: Brgy. {order.barangay || 'Acacia'}, Catarman</p>
                    <p className={cx('map-note')}>Driver is approximately 1.5 km away</p>
                    <div className={cx('map-pin')}></div>
                  </div>
                </div>
              </div>

              <div className={cx('card delivery-info-card')}>
                <div className={cx('card-header')}>
                  <i className={cx('fas fa-info-circle')}></i>
                  <h3>Delivery Information</h3>
                </div>
                <div className={cx('card-body')}>
                  <div className={cx('info-row')}>
                    <span className={cx('info-label')}>Driver</span>
                    <span className={cx('info-value')}>{driver ? driver.name : 'Awaiting assignment'}</span>
                  </div>
                  <div className={cx('info-row')}>
                    <span className={cx('info-label')}>Estimated Arrival</span>
                    <span className={cx('info-value highlight')}>
                      {new Date(`${order.date}T00:00:00`).toLocaleDateString()} · {order.timeSlot}
                    </span>
                  </div>
                  <div className={cx('info-row')}>
                    <span className={cx('info-label')}>Delivery Address</span>
                    <span className={cx('info-value')}>{order.address}</span>
                  </div>
                  <div className={cx('info-row')}>
                    <span className={cx('info-label')}>Payment Method</span>
                    <span className={cx('info-value')}>{order.payment || 'Cash on Delivery'}</span>
                  </div>
                  <button type="button" className={cx('btn btn-primary btn-full')} onClick={contactStation}>
                    <i className={cx('fas fa-phone')}></i> Contact Station
                  </button>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className={cx('card order-details-card')}>
              <div className={cx('card-header')}>
                <i className={cx('fas fa-receipt')}></i>
                <h3>Order Details</h3>
              </div>
              <div className={cx('card-body')}>
                <table className={cx('order-table')}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{fmt(item.price)}</td>
                        <td>{fmt(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">Subtotal</td>
                      <td>{fmt(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3">Delivery Fee</td>
                      <td>{fmt(order.deliveryFee)}</td>
                    </tr>
                    <tr className={cx('total-row')}>
                      <td colSpan="3">Total</td>
                      <td>{fmt(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerShell>
  );
}

/** Renders the connector line before every step except the first. */
function Step({ index, activeIndex, children }) {
  if (index === 0) return children;
  const state = activeIndex > index ? 'completed' : activeIndex === index ? 'active' : '';
  return (
    <>
      <div className={cx('progress-connector', state)}></div>
      {children}
    </>
  );
}
