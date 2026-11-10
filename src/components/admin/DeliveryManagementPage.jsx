import { useState } from 'react';
import { Link } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import adminStyles from '../../styles/admin.module.css';
import deliveryStyles from '../../styles/deliveryManagement.module.css';
import { useToast } from '../common/Toast';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles, deliveryStyles);

const MAP_PINS = [
  { top: '20%', left: '30%', title: 'Brgy. Acacia - Juan Dela Cruz', label: 'Acacia' },
  { top: '45%', left: '60%', title: 'Brgy. Baybay - Maria Santos', label: 'Baybay' },
  { top: '30%', left: '75%', title: 'Brgy. Rizal - Pedro Reyes', label: 'Rizal' },
  { top: '60%', left: '40%', title: 'Brgy. Washington - Ana Cruz', label: 'Washington' },
  { top: '50%', left: '20%', title: 'Station - Aqua Fresh', label: 'Station', icon: 'fa-warehouse' },
];

const FLEET = [
  { name: 'Roberto Mendoza', state: 'available', dot: 'green', text: 'Available', count: '0/5 deliveries' },
  { name: 'Julius Cruz', state: 'available', dot: 'green', text: 'Available', count: '0/5 deliveries' },
  { name: 'Michael Reyes', state: 'on-route', dot: 'orange', text: 'On Route', count: '3/5 deliveries' },
  { name: 'Eddie Garcia', state: 'off-duty', dot: 'gray', text: 'Off Duty' },
];

const itemsText = (order) => order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ');

function PendingOrderCard({ order, drivers, onAssign }) {
  const [driverEmail, setDriverEmail] = useState('');
  return (
    <div className={cx('order-card')}>
      <div className={cx('order-info')}>
        <strong>{order.customer}</strong>
        <span className={cx('address')}><i className={cx('fas fa-map-marker-alt')}></i> {order.address}</span>
        <span className={cx('items')}><i className={cx('fas fa-box')}></i> {itemsText(order)}</span>
        <span className={cx('time')}><i className={cx('fas fa-clock')}></i> {order.date} · {order.timeSlot}</span>
      </div>
      <div className={cx('assign-driver')}>
        <select className={cx('driver-select')} value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)}>
          <option value="">Assign Driver...</option>
          {drivers.map((d) => <option key={d.email} value={d.email}>{d.name}</option>)}
        </select>
        <button type="button" className={cx('btn btn-primary btn-sm')} onClick={() => onAssign(order, driverEmail)}>Assign</button>
      </div>
    </div>
  );
}

export default function DeliveryManagementPage() {
  const showToast = useToast();
  const orders = store.useStoreData(store.getOrders);
  const drivers = store.useStoreData(() => store.getUsers().filter((u) => u.role === 'driver'));

  const pending = orders.filter((o) => ['pending', 'confirmed'].includes(o.status) && !o.driverEmail);
  const assigned = orders.filter((o) => o.driverEmail && ['confirmed', 'delivering'].includes(o.status));

  function assign(order, driverEmail) {
    if (!driverEmail) {
      showToast('Select a driver before assigning this delivery.', 'error');
      return;
    }
    store.updateOrder(order.id, { driverEmail, status: 'confirmed' });
    showToast('Delivery assigned to driver.', 'success');
  }

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Delivery Management" subtitle="Assign drivers and manage deliveries">
        <div className={cx('header-right')}>
          <div className={cx('notification-bell')}>
            <i className={cx('fas fa-bell')}></i>
            <span className={cx('notification-badge')}>3</span>
          </div>
        </div>
      </AdminHeader>

      <div className={cx('delivery-management')}>
        {/* Map Overview */}
        <div className={cx('card map-overview')}>
          <div className={cx('map-placeholder')}>
            <div className={cx('map-pins')}>
              {MAP_PINS.map((pin) => (
                <div className={cx('map-pin')} style={{ top: pin.top, left: pin.left }} title={pin.title} key={pin.label}>
                  <i className={cx('fas', pin.icon || 'fa-map-marker-alt')}></i>
                  <span className={cx('pin-label')}>{pin.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cx('delivery-columns')}>
          {/* Pending Deliveries */}
          <div className={cx('card pending-deliveries')}>
            <div className={cx('card-header')}>
              <h3><i className={cx('fas fa-clock')}></i> Pending Deliveries</h3>
              <span className={cx('count-badge')}>{pending.length}</span>
            </div>
            <div className={cx('card-body')}>
              {pending.length === 0 && <p>No unassigned deliveries.</p>}
              {pending.map((order) => (
                <PendingOrderCard key={order.id} order={order} drivers={drivers} onAssign={assign} />
              ))}
            </div>
          </div>

          <div className={cx('right-column')}>
            {/* Drivers Panel */}
            <div className={cx('card drivers-panel')}>
              <div className={cx('card-header')}>
                <h3><i className={cx('fas fa-id-card')}></i> Drivers</h3>
                <Link to="/admin/drivers" className={cx('view-all')}>Manage Drivers</Link>
              </div>
              <div className={cx('card-body')}>
                {FLEET.map((d) => (
                  <div className={cx('driver-card', d.state)} key={d.name}>
                    <div className={cx('driver-status')}>
                      <span className={cx('status-dot', d.dot)}></span>
                      <strong>{d.name}</strong>
                    </div>
                    <span className={cx('status-text')}>{d.text}</span>
                    {d.count && <span className={cx('delivery-count')}>{d.count}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Deliveries */}
            <div className={cx('card assigned-deliveries')}>
              <div className={cx('card-header')}>
                <h3><i className={cx('fas fa-check-circle')}></i> Assigned Deliveries</h3>
              </div>
              <div className={cx('card-body')}>
                {assigned.length === 0 && <p>No assigned deliveries yet.</p>}
                {assigned.map((order) => (
                  <div className={cx('assigned-order')} key={order.id}>
                    <span className={cx('driver-name')}>{drivers.find((d) => d.email === order.driverEmail)?.name || 'Driver'}</span>
                    <div className={cx('assigned-info')}>
                      <strong>#{order.id} · {order.customer}</strong>
                      <span>{order.address}</span>
                      <span>{itemsText(order)}</span>
                      <span className={cx('eta')}>{order.status === 'delivering' ? 'Out for delivery' : 'Assigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
