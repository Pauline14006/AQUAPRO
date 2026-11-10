import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import adminStyles from '../../styles/admin.module.css';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles);

/** Fleet roster shown on the page; live stats are merged in for registered drivers. */
const ROSTER = [
  { initials: 'RM', name: 'Roberto Mendoza', role: 'Delivery Driver', today: '5/8', rate: '98%', status: 'available', label: 'Available', phone: '0912-345-6789', vehicle: 'Honda TMX 125' },
  { initials: 'JC', name: 'Julius Cruz', role: 'Delivery Driver', today: '3/8', rate: '95%', status: 'on-route', label: 'On Route', phone: '0923-456-7890', vehicle: 'Yamaha YTX 125' },
  { initials: 'MR', name: 'Michael Reyes', role: 'Senior Driver', today: '7/10', rate: '99%', status: 'busy', label: 'Busy', phone: '0934-567-8901', vehicle: 'Kawasaki Barako 175' },
  { initials: 'EG', name: 'Eddie Garcia', role: 'Delivery Driver', today: '0/0', rate: '92%', status: 'off-duty', label: 'Off Duty', phone: '0945-678-9012', vehicle: 'Honda Wave 125', offDuty: true },
];

export default function AdminDriversPage() {
  const navigate = useNavigate();
  const users = store.useStoreData(store.getUsers);
  const orders = store.useStoreData(store.getOrders);

  const drivers = ROSTER.map((d) => {
    const account = users.find((u) => u.role === 'driver' && u.name === d.name);
    if (!account) return { ...d, history: null };
    const assigned = orders.filter((o) => o.driverEmail === account.email);
    const completed = assigned.filter((o) => o.status === 'delivered').length;
    const active = assigned.filter((o) => ['confirmed', 'delivering'].includes(o.status)).length;
    return {
      ...d,
      today: `${completed}/${assigned.length}`,
      label: active ? 'On Route' : 'Available',
      history: assigned.map((o) => `#${o.id} ${o.date} — ${o.status}`).join('\n') || 'No deliveries assigned.',
    };
  });

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Drivers Management" subtitle="Manage delivery drivers and their assignments">
        <div className={cx('header-actions')}>
          <button type="button" className={cx('btn btn-primary')}>
            <i className={cx('fas fa-plus')}></i> Add Driver
          </button>
        </div>
      </AdminHeader>

      <div className={cx('drivers-grid')}>
        {drivers.map((d) => (
          <div className={cx('driver-profile-card', d.offDuty && 'off-duty')} key={d.name}>
            <div className={cx('driver-avatar')}>
              <span>{d.initials}</span>
              <span className={cx('status-dot', d.offDuty ? 'offline' : 'online')}></span>
            </div>
            <h3>{d.name}</h3>
            <span className={cx('driver-role')}>{d.role}</span>
            <div className={cx('driver-stats')}>
              <div className={cx('driver-stat')}>
                <span className={cx('stat-value')}>{d.today}</span>
                <span className={cx('stat-label')}>Today's Deliveries</span>
              </div>
              <div className={cx('driver-stat')}>
                <span className={cx('stat-value')}>{d.rate}</span>
                <span className={cx('stat-label')}>Completion Rate</span>
              </div>
            </div>
            <div className={cx('driver-status-badge', d.status)}>{d.label}</div>
            <div className={cx('driver-contact')}>
              <p><i className={cx('fas fa-phone')}></i> {d.phone}</p>
              <p><i className={cx('fas fa-motorcycle')}></i> {d.vehicle}</p>
            </div>
            <div className={cx('driver-actions')}>
              {!d.offDuty && (
                <button type="button" className={cx('btn btn-outline btn-sm')} onClick={() => navigate('/admin/delivery')}>
                  <i className={cx('fas fa-route')}></i> View Route
                </button>
              )}
              <button
                type="button"
                className={cx('btn btn-outline btn-sm')}
                onClick={() => d.history !== null && window.alert(`${d.name} delivery history\n${d.history}`)}
              >
                <i className={cx('fas fa-history')}></i> History
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
