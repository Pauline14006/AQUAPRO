import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import driverStyles from '../../styles/driverMobile.module.css';
import { useToast } from '../common/Toast';

const cx = makeCx(driverStyles);

function DeliveryCard({ order, index, total, onStart, onDelivered, onUnavailable, onPhoto }) {
  const delivering = order.status === 'delivering';
  const phone = (order.phone || '').replace(/[^\d+]/g, '');
  return (
    <article className={cx('delivery-card', delivering ? 'active' : 'upcoming')}>
      <div className={cx('delivery-header')}>
        <span className={cx('stop-number')}>Stop {index + 1} of {total}</span>
        <span className={cx('delivery-status', delivering ? 'status-active' : 'status-upcoming')}>
          {delivering ? 'In Progress' : 'Upcoming'}
        </span>
      </div>
      <div className={cx('delivery-body')}>
        <h3>{order.customer}</h3>
        <p className={cx('address')}><i className={cx('fas fa-map-marker-alt')}></i> {order.address}</p>
        <div className={cx('items')}>
          <span className={cx('item-tag')}>{order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</span>
        </div>
        {phone && (
          <div className={cx('customer-contact')}>
            <a href={`tel:${phone}`} className={cx('call-btn')}><i className={cx('fas fa-phone')}></i> Call Customer</a>
          </div>
        )}
        <p>Order #{order.id} · {order.date} · {order.timeSlot}</p>
      </div>
      <div className={cx('delivery-actions')}>
        {order.status === 'confirmed' && (
          <button type="button" className={cx('start-delivery-btn')} onClick={() => onStart(order)}>
            <i className={cx('fas fa-play')}></i> Start Delivery
          </button>
        )}
        {delivering && (
          <>
            <button type="button" className={cx('action-btn')} onClick={() => onPhoto(order)}>
              <i className={cx('fas fa-camera')}></i> Add Delivery Photo
            </button>
            <button type="button" className={cx('action-btn delivered-btn')} onClick={() => onDelivered(order)}>
              <i className={cx('fas fa-check-circle')}></i> Mark as Delivered
            </button>
            <button type="button" className={cx('action-btn unavailable-btn')} onClick={() => onUnavailable(order)}>
              <i className={cx('fas fa-user-times')}></i> Customer Not Available
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function DriverMobilePage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const user = store.useStoreData(store.getCurrentUser);
  const orders = store.useStoreData(() => store.getOrders().filter((o) => o.driverEmail === user?.email));
  const [showCompleted, setShowCompleted] = useState(false);
  if (!user) return null;

  const active = orders.filter((o) => ['confirmed', 'delivering'].includes(o.status));
  const completed = orders.filter((o) => o.status === 'delivered');

  const start = (order) => store.updateOrder(order.id, { status: 'delivering' });

  function delivered(order) {
    if (!window.confirm(`Mark order #${order.id} as delivered?`)) return;
    store.updateOrder(order.id, { status: 'delivered', deliveredAt: new Date().toLocaleString() });
    showToast('Delivery completed and order history updated.', 'success');
  }

  function unavailable(order) {
    if (!window.confirm('Mark the customer unavailable and return this order to the unassigned queue?')) return;
    store.updateOrder(order.id, { status: 'pending', driverEmail: '' });
    showToast('Order returned to the admin assignment queue.', 'success');
  }

  function photo(order) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 1024 * 1024) {
        showToast('Choose an image smaller than 1 MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        store.updateOrder(order.id, { deliveryPhoto: reader.result });
        showToast('Delivery photo saved with the order.', 'success');
      };
      reader.onerror = () => showToast('The selected photo could not be read.', 'error');
      reader.readAsDataURL(file);
    });
    input.click();
  }

  function logout() {
    store.logout();
    navigate('/login');
  }

  return (
    <div className={cx('driver-container')}>
      {/* Driver Header */}
      <header className={cx('driver-header')}>
        <div className={cx('header-top')}>
          <div className={cx('driver-greeting')}>
            <i className={cx('fas fa-user-circle')}></i>
            <div>
              <h1>{store.getTimeGreeting()}, {user.name}</h1>
              <span className={cx('driver-status-text')}>On Duty · {completed.length} completed · {active.length} remaining</span>
            </div>
          </div>
          <div className={cx('header-actions')}>
            <button type="button" className={cx('icon-btn')} aria-label="Notifications" onClick={() => showToast('You are viewing your assigned deliveries.', 'success')}>
              <i className={cx('fas fa-bell')}></i>
            </button>
            <button type="button" className={cx('icon-btn')} aria-label="Log out" onClick={logout}>
              <i className={cx('fas fa-sign-out-alt')}></i>
            </button>
          </div>
        </div>
        <div className={cx('route-summary')}>
          <div className={cx('route-stat')}>
            <i className={cx('fas fa-route')}></i>
            <span>Optimized Route</span>
          </div>
          <div className={cx('route-stat')}>
            <i className={cx('fas fa-map-marker-alt')}></i>
            <span>{active.length} stops</span>
          </div>
          <div className={cx('route-stat')}>
            <i className={cx('fas fa-clock')}></i>
            <span>~2.5 hours</span>
          </div>
        </div>
      </header>

      {/* Deliveries List */}
      <div className={cx('deliveries-container')}>
        <h2>Today's Deliveries</h2>
        {active.length === 0 && <p className={cx('empty-deliveries')}>No assigned deliveries right now.</p>}
        {active.map((order, index) => (
          <DeliveryCard
            key={order.id}
            order={order}
            index={index}
            total={active.length}
            onStart={start}
            onDelivered={delivered}
            onUnavailable={unavailable}
            onPhoto={photo}
          />
        ))}

        {/* Completed Deliveries */}
        <section className={cx('completed-section')}>
          <h3 className={cx('section-toggle')} onClick={() => setShowCompleted((s) => !s)}>
            <i className={cx('fas fa-check-double')}></i> Completed ({completed.length}){' '}
            <i className={cx('fas', showCompleted ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
          </h3>
          <div className={cx('completed-list')} style={{ display: showCompleted ? 'block' : 'none' }}>
            {completed.map((order) => (
              <div className={cx('delivery-card completed')} key={order.id}>
                <div className={cx('delivery-header')}>
                  <span className={cx('stop-number')}>Order #{order.id}</span>
                  <span className={cx('delivery-status status-completed')}>Completed</span>
                </div>
                <div className={cx('delivery-body')}>
                  <h3>{order.customer}</h3>
                  <p className={cx('address')}>{order.address}</p>
                  <p className={cx('completed-time')}>{order.deliveredAt ? `Delivered ${order.deliveredAt}` : 'Delivered'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
