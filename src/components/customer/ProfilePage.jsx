import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import ordersStyles from '../../styles/customerOrders.module.css';
import accountStyles from '../../styles/customerAccount.module.css';
import { useToast } from '../common/Toast';
import CustomerShell from './CustomerShell';

const cx = makeCx(ordersStyles, accountStyles);

const TABS = [
  { id: 'personal', icon: 'fa-user-circle', label: 'Personal Info' },
  { id: 'address', icon: 'fa-map-marker-alt', label: 'Addresses' },
  { id: 'security', icon: 'fa-shield-alt', label: 'Security' },
  { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
  { id: 'payment', icon: 'fa-credit-card', label: 'Payment Methods' },
];

const initialsOf = (name = '') => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function Switch({ checked, defaultChecked, onChange }) {
  return (
    <label className={cx('switch')}>
      <input type="checkbox" checked={checked} defaultChecked={defaultChecked} onChange={onChange} />
      <span className={cx('slider')}></span>
    </label>
  );
}

function CardHeader({ icon, title, children }) {
  return (
    <div className={cx('card-header')}>
      <h3><i className={cx('fas', icon)}></i> {title}</h3>
      {children}
    </div>
  );
}

function Avatar({ user, className, id }) {
  const style = user.profilePhoto ? { backgroundImage: `url("${user.profilePhoto}")`, backgroundSize: 'cover' } : undefined;
  return (
    <div className={cx(className)} id={id} style={style}>
      <span style={user.profilePhoto ? { visibility: 'hidden' } : undefined}>{initialsOf(user.name)}</span>
    </div>
  );
}

// ---------------- Personal info ----------------
function PersonalTab({ user, orders, subscriptionActive }) {
  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const blank = () => ({ name: user.name, email: user.email, phone: user.phone || '', altPhone: '', dob: '1990-01-15' });
  const [form, setForm] = useState(blank);
  const field = (key) => ({ value: form[key], disabled: !editing, onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  function save(e) {
    e.preventDefault();
    try {
      store.updateCurrentUser({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() });
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  const recent = orders.slice().sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 4);

  return (
    <>
      <div className={cx('card')}>
        <CardHeader icon="fa-user-circle" title="Personal Information">
          {!editing && (
            <button type="button" className={cx('btn btn-sm btn-outline edit-btn')} onClick={() => { setForm(blank()); setEditing(true); }}>
              <i className={cx('fas fa-edit')}></i> Edit
            </button>
          )}
        </CardHeader>
        <div className={cx('card-body')}>
          <form className={cx('profile-form')} onSubmit={save}>
            <div className={cx('form-row')}>
              <InputField label="Full Name" icon="fa-user" type="text" {...field('name')} />
              <InputField label="Email Address" icon="fa-envelope" type="email" {...field('email')} />
            </div>
            <div className={cx('form-row')}>
              <InputField label="Phone Number" icon="fa-phone" type="tel" {...field('phone')} />
              <InputField label="Alternate Phone (Optional)" icon="fa-phone-alt" type="tel" placeholder="Add alternate number" {...field('altPhone')} />
            </div>
            <InputField label="Date of Birth (Optional)" icon="fa-calendar" type="date" {...field('dob')} />
            <div className={cx('form-actions')} style={{ display: editing ? 'flex' : 'none' }}>
              <button type="button" className={cx('btn btn-outline')} onClick={() => { setForm(blank()); setEditing(false); }}>Cancel</button>
              <button type="submit" className={cx('btn btn-primary')}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Statistics */}
      <div className={cx('card')}>
        <CardHeader icon="fa-chart-bar" title="Account Statistics" />
        <div className={cx('card-body')}>
          <div className={cx('stats-grid')}>
            <ProfileStat icon="fa-shopping-bag" value={orders.length} label="Total Orders" />
            <ProfileStat icon="fa-sync-alt" value={subscriptionActive ? 'Active' : 'None'} label="Subscription" />
            <ProfileStat icon="fa-calendar-check" value={orders.filter((o) => o.status === 'delivered').length} label="On-Time Deliveries" />
            <ProfileStat icon="fa-coins" value={`₱${orders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)}`} label="Total Spent" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={cx('card')}>
        <CardHeader icon="fa-clock" title="Recent Activity">
          <a href="#" className={cx('view-all')} onClick={(e) => e.preventDefault()}>View All</a>
        </CardHeader>
        <div className={cx('card-body')}>
          <div className={cx('activity-list')}>
            {recent.length === 0 && <p>No recent activity.</p>}
            {recent.map((order) => (
              <div className={cx('activity-item')} key={order.id}>
                <div className={cx('activity-icon blue')}>
                  <i className={cx('fas', order.status === 'delivered' ? 'fa-check-circle' : 'fa-truck')}></i>
                </div>
                <div className={cx('activity-info')}>
                  <strong>Order #{order.id} {order.status}</strong>
                  <span>{order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</span>
                  <small>{order.date}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function InputField({ label, icon, ...input }) {
  return (
    <div className={cx('form-group')}>
      <label>{label}</label>
      <div className={cx('input-group')}>
        <i className={cx('fas', icon)}></i>
        <input aria-label={label} {...input} />
      </div>
    </div>
  );
}

function ProfileStat({ icon, value, label }) {
  return (
    <div className={cx('profile-stat')}>
      <i className={cx('fas', icon)}></i>
      <div>
        <span className={cx('stat-value')}>{value}</span>
        <span className={cx('stat-label')}>{label}</span>
      </div>
    </div>
  );
}

// ---------------- Addresses ----------------
function getSavedAddresses(user) {
  return user.addresses || [{ label: 'Home', address: user.address || '', barangay: user.barangay || '', phone: user.phone || '', isDefault: true }];
}

function AddressesTab({ user }) {
  const showToast = useToast();
  const addresses = getSavedAddresses(user);

  function save(next, extra = {}) {
    store.updateCurrentUser({ addresses: next, ...extra });
  }

  function addAddress() {
    const label = window.prompt('Address label (e.g., Home, Office):');
    if (!label) return;
    const address = window.prompt('Street and house number:');
    const barangay = window.prompt('Barangay:');
    if (!address || !barangay) {
      showToast('Address and barangay are required.', 'error');
      return;
    }
    save([...addresses, { label: label.trim(), address: address.trim(), barangay: barangay.trim(), phone: user.phone || '', isDefault: addresses.length === 0 }]);
  }

  function editAddress(index) {
    const current = addresses[index];
    const nextAddress = window.prompt('Update street and house number:', current.address);
    if (nextAddress === null) return;
    const nextBarangay = window.prompt('Update barangay:', current.barangay);
    if (!nextBarangay) {
      showToast('Barangay is required.', 'error');
      return;
    }
    save(addresses.map((a, i) => (i === index ? { ...a, address: nextAddress.trim(), barangay: nextBarangay.trim() } : a)));
    showToast('Address updated.', 'success');
  }

  function setDefault(index) {
    const next = addresses.map((a, i) => ({ ...a, isDefault: i === index }));
    save(next, { address: next[index].address, barangay: next[index].barangay });
    showToast('Default address updated.', 'success');
  }

  function remove(index) {
    if (addresses.length <= 1) {
      showToast('Keep at least one delivery address on your account.', 'error');
      return;
    }
    if (!window.confirm('Delete this saved address?')) return;
    const next = addresses.filter((_, i) => i !== index);
    if (!next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true };
    const primary = next.find((a) => a.isDefault);
    save(next, { address: primary.address, barangay: primary.barangay });
    showToast('Address deleted.', 'success');
  }

  return (
    <div className={cx('card')}>
      <CardHeader icon="fa-map-marker-alt" title="Saved Addresses">
        <button type="button" className={cx('btn btn-sm btn-primary add-address-btn')} onClick={addAddress}>
          <i className={cx('fas fa-plus')}></i> Add Address
        </button>
      </CardHeader>
      <div className={cx('card-body')}>
        <div className={cx('address-cards')}>
          {addresses.length === 0 && <p>No saved addresses. Add a delivery address to get started.</p>}
          {addresses.map((address, index) => (
            <div className={cx('address-card', address.isDefault && 'default')} key={index}>
              {address.isDefault && <div className={cx('address-badge')}>Default</div>}
              <div className={cx('address-icon')}><i className={cx('fas fa-home')}></i></div>
              <div className={cx('address-details')}>
                <strong>{address.label || 'Address'}</strong>
                <p>{user.name}</p>
                <p>{address.address}</p>
                <p>Barangay {address.barangay}</p>
                <p>Catarman, Northern Samar</p>
                <p>Phone: {address.phone}</p>
              </div>
              <div className={cx('address-actions')}>
                <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => editAddress(index)}>Edit</button>
                <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => setDefault(index)}>Set Default</button>
                <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => remove(index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Security ----------------
function PasswordField({ icon, placeholder, value, onChange, toggle }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cx('input-group')}>
      <i className={cx('fas', icon)}></i>
      <input type={visible ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {toggle && (
        <i className={cx('fas toggle-password', visible ? 'fa-eye-slash' : 'fa-eye')} onClick={() => setVisible((v) => !v)} role="button"></i>
      )}
    </div>
  );
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) score += 1;
  if (/[^a-z0-9]/i.test(pw) || pw.length >= 12) score += 1;
  return [{ width: '20%', text: 'Weak' }, { width: '35%', text: 'Weak' }, { width: '60%', text: 'Medium' }, { width: '100%', text: 'Strong' }][score];
}

function SecurityTab() {
  const showToast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const set = (key) => (value) => setPw((p) => ({ ...p, [key]: value }));
  const strength = passwordStrength(pw.next);

  function submit(e) {
    e.preventDefault();
    if (!pw.current || !pw.next || !pw.confirm) return showToast('Please fill in all password fields', 'error');
    if (pw.next.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (pw.next !== pw.confirm) return showToast('Passwords do not match', 'error');
    const user = store.getCurrentUser();
    if (!user || user.password !== pw.current) return showToast('Current password is incorrect', 'error');
    store.updateCurrentUser({ password: pw.next });
    showToast('Password updated successfully!', 'success');
    setPw({ current: '', next: '', confirm: '' });
    return undefined;
  }

  return (
    <>
      <div className={cx('card')}>
        <CardHeader icon="fa-lock" title="Change Password" />
        <div className={cx('card-body')}>
          <form className={cx('profile-form')} onSubmit={submit}>
            <div className={cx('form-group')}>
              <label>Current Password</label>
              <PasswordField icon="fa-lock" placeholder="Enter current password" value={pw.current} onChange={set('current')} toggle />
            </div>
            <div className={cx('form-group')}>
              <label>New Password</label>
              <PasswordField icon="fa-key" placeholder="Enter new password" value={pw.next} onChange={set('next')} toggle />
              <small className={cx('form-hint')}>Password must be at least 8 characters with letters and numbers</small>
            </div>
            <div className={cx('form-group')}>
              <label>Confirm New Password</label>
              <PasswordField icon="fa-key" placeholder="Confirm new password" value={pw.confirm} onChange={set('confirm')} />
            </div>
            <div className={cx('password-strength')}>
              <span>Password Strength:</span>
              <div className={cx('strength-bar')}>
                <div className={cx('strength-fill')} style={{ width: strength.width }}></div>
              </div>
              <span className={cx('strength-text')}>{strength.text}</span>
            </div>
            <button type="submit" className={cx('btn btn-primary')}>Update Password</button>
          </form>
        </div>
      </div>

      <div className={cx('card')}>
        <CardHeader icon="fa-shield-alt" title="Two-Factor Authentication" />
        <div className={cx('card-body')}>
          <div className={cx('security-option')}>
            <div className={cx('option-info')}>
              <strong>Two-Factor Authentication (2FA)</strong>
              <p>Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={false}
              onChange={() => showToast('Two-factor authentication requires a server and is not available in this prototype.', 'error')}
            />
          </div>
          <div className={cx('security-option')}>
            <div className={cx('option-info')}>
              <strong>Login Notifications</strong>
              <p>Get notified when someone logs into your account</p>
            </div>
            <Switch
              defaultChecked
              onChange={(e) => showToast(e.target.checked ? 'Login notifications enabled' : 'Login notifications disabled', e.target.checked ? 'success' : 'error')}
            />
          </div>
        </div>
      </div>

      <div className={cx('card')}>
        <CardHeader icon="fa-history" title="Login History" />
        <div className={cx('card-body')}>
          <div className={cx('login-history')}>
            <div className={cx('history-item')}>
              <div className={cx('history-icon current')}><i className={cx('fas fa-circle')}></i></div>
              <div className={cx('history-info')}>
                <strong>Current Session</strong>
                <span>Chrome on Windows • Catarman, Northern Samar</span>
                <small>Started: April 28, 2024 - 8:00 AM</small>
              </div>
            </div>
            <div className={cx('history-item')}>
              <div className={cx('history-icon')}><i className={cx('fas fa-circle')}></i></div>
              <div className={cx('history-info')}>
                <strong>April 27, 2024 - 9:15 AM</strong>
                <span>Chrome on Android • Catarman, Northern Samar</span>
              </div>
            </div>
            <div className={cx('history-item')}>
              <div className={cx('history-icon')}><i className={cx('fas fa-circle')}></i></div>
              <div className={cx('history-info')}>
                <strong>April 26, 2024 - 7:30 PM</strong>
                <span>Safari on iPhone • Catarman, Northern Samar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- Notifications ----------------
const NOTIFICATION_GROUPS = [
  {
    title: 'Email Notifications',
    options: [
      { label: 'Order Confirmations', text: 'Receive email when your order is confirmed', on: true },
      { label: 'Delivery Updates', text: 'Get notified when your delivery status changes', on: true },
      { label: 'Subscription Reminders', text: 'Receive reminders before your next auto-refill', on: true },
      { label: 'Promotional Offers', text: 'Get updates on special offers and discounts', on: false },
    ],
  },
  {
    title: 'SMS Notifications',
    options: [
      { label: 'Delivery Alerts', text: 'Receive SMS when driver is on the way', on: true },
      { label: 'Order Updates', text: 'Get SMS updates for your orders', on: true },
    ],
  },
];

function NotificationsTab({ user }) {
  const showToast = useToast();
  const prefs = user.notifications || {};

  function toggle(label, enabled) {
    store.updateCurrentUser({ notifications: { ...prefs, [label]: enabled } });
    showToast(`${label} ${enabled ? 'enabled' : 'disabled'} for this prototype account.`, 'success');
  }

  return (
    <div className={cx('card')}>
      <CardHeader icon="fa-bell" title="Notification Preferences" />
      <div className={cx('card-body')}>
        {NOTIFICATION_GROUPS.map((group, gi) => (
          <div key={group.title}>
            {gi > 0 && <hr className={cx('divider')} />}
            <div className={cx('notification-options')}>
              <h4>{group.title}</h4>
              {group.options.map((opt) => (
                <div className={cx('notification-option')} key={opt.label}>
                  <div className={cx('option-info')}>
                    <strong>{opt.label}</strong>
                    <p>{opt.text}</p>
                  </div>
                  <Switch checked={prefs[opt.label] ?? opt.on} onChange={(e) => toggle(opt.label, e.target.checked)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Payment ----------------
function PaymentTab({ orders }) {
  const paid = orders.filter((o) => o.status === 'delivered').slice(0, 3);
  return (
    <>
      <div className={cx('card')}>
        <CardHeader icon="fa-credit-card" title="Payment Methods">
          <button type="button" className={cx('btn btn-sm btn-primary')}>
            <i className={cx('fas fa-plus')}></i> Add Payment Method
          </button>
        </CardHeader>
        <div className={cx('card-body')}>
          <div className={cx('payment-methods')}>
            <div className={cx('payment-card default')}>
              <div className={cx('payment-badge')}>Default</div>
              <div className={cx('payment-icon')}><i className={cx('fas fa-money-bill-wave')}></i></div>
              <div className={cx('payment-details')}>
                <strong>Cash on Delivery</strong>
                <p>Pay when your water arrives</p>
              </div>
              <span className={cx('status-badge status-confirmed')}>Active</span>
            </div>
            <div className={cx('payment-card disabled')}>
              <div className={cx('payment-icon')}><i className={cx('fas fa-mobile-alt')}></i></div>
              <div className={cx('payment-details')}>
                <strong>GCash (Coming Soon)</strong>
                <p>Digital wallet payment</p>
              </div>
              <span className={cx('status-badge status-pending')}>Unavailable</span>
            </div>
            <div className={cx('payment-card disabled')}>
              <div className={cx('payment-icon')}><i className={cx('fas fa-university')}></i></div>
              <div className={cx('payment-details')}>
                <strong>Bank Transfer (Coming Soon)</strong>
                <p>Online bank transfer</p>
              </div>
              <span className={cx('status-badge status-pending')}>Unavailable</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cx('card')}>
        <CardHeader icon="fa-receipt" title="Transaction History">
          <a href="#" className={cx('view-all')} onClick={(e) => e.preventDefault()}>View All</a>
        </CardHeader>
        <div className={cx('card-body')}>
          <div className={cx('transaction-list')}>
            {paid.length === 0 && <p>No completed transactions yet.</p>}
            {paid.map((order) => (
              <div className={cx('transaction-item')} key={order.id}>
                <div className={cx('transaction-icon')}><i className={cx('fas fa-shopping-cart')}></i></div>
                <div className={cx('transaction-info')}>
                  <strong>Order #{order.id}</strong>
                  <span>{order.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</span>
                </div>
                <div className={cx('transaction-amount')}>
                  <span className={cx('amount')}>{store.formatCurrency(order.total)}</span>
                  <span className={cx('date')}>{order.date}</span>
                </div>
                <span className={cx('status-badge status-delivered')}>Paid</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- Page ----------------
export default function ProfilePage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const user = store.useStoreData(store.getCurrentUser);
  const orders = store.useStoreData(() => store.getOrders().filter((o) => o.email === user?.email && !o.hiddenByCustomer));
  const subscriptionActive = store.useStoreData(() => Boolean(store.getSubscriptions()[user?.email]?.active));
  const [tab, setTab] = useState('personal');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  if (!user) return null;

  function changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 1024 * 1024) {
        showToast('Choose an image smaller than 1 MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          store.updateCurrentUser({ profilePhoto: reader.result });
          showToast('Profile photo saved in this browser.', 'success');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };
      reader.onerror = () => showToast('The selected image could not be read.', 'error');
      reader.readAsDataURL(file);
    });
    input.click();
  }

  function confirmDeleteAccount() {
    if (deleteText !== 'DELETE') {
      showToast('Type DELETE to confirm account removal.', 'error');
      return;
    }
    store.saveUsers(store.getUsers().filter((u) => u.email !== user.email));
    store.saveOrders(store.getOrders().filter((o) => o.email !== user.email));
    const subscriptions = store.getSubscriptions();
    delete subscriptions[user.email];
    store.saveSubscriptions(subscriptions);
    store.logout();
    navigate('/');
  }

  function deactivateAccount() {
    if (window.confirm('Deactivate your account? Contact an administrator to restore access.')) {
      store.updateCurrentUser({ active: false });
      store.logout();
      navigate('/');
    }
  }

  return (
    <CustomerShell cx={cx}>
      <main className={cx('main-content')}>
        <header className={cx('dashboard-header')}>
          <div className={cx('header-left')}>
            <h1>My Profile</h1>
            <p>Manage your account settings and preferences</p>
          </div>
          <div className={cx('header-right')}>
            <div className={cx('notification-bell')}>
              <i className={cx('fas fa-bell')}></i>
              <span className={cx('notification-badge')}>2</span>
            </div>
            <Avatar user={user} className="user-avatar" />
          </div>
        </header>

        <div className={cx('profile-container')}>
          {/* Profile Header Card */}
          <div className={cx('card profile-header-card')}>
            <div className={cx('profile-cover')}></div>
            <div className={cx('profile-info')}>
              <div className={cx('profile-avatar-wrapper')}>
                <Avatar user={user} className="profile-avatar" />
                <button type="button" className={cx('change-avatar-btn')} title="Change Profile Photo" onClick={changeAvatar}>
                  <i className={cx('fas fa-camera')}></i>
                </button>
              </div>
              <div className={cx('profile-details')}>
                <h2>{user.name}</h2>
                <p className={cx('profile-role')}>
                  Customer since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <div className={cx('profile-meta')}>
                  <span><i className={cx('fas fa-star')}></i> {orders.filter((o) => o.status === 'delivered').length} Orders Completed</span>
                  <span><i className={cx('fas fa-tint')}></i> Premium Customer</span>
                </div>
              </div>
              <div className={cx('profile-actions')}>
                <button type="button" className={cx('btn btn-outline')} onClick={() => navigate('/order')}>
                  <i className={cx('fas fa-shopping-cart')}></i> Place Order
                </button>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className={cx('profile-tabs')}>
            {TABS.map((t) => (
              <button type="button" key={t.id} className={cx('tab-btn', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
                <i className={cx('fas', t.icon)}></i> {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={cx('tab-content')}>
            <div className={cx('tab-panel active')}>
              {tab === 'personal' && <PersonalTab key={user.email} user={user} orders={orders} subscriptionActive={subscriptionActive} />}
              {tab === 'address' && <AddressesTab user={user} />}
              {tab === 'security' && <SecurityTab />}
              {tab === 'notifications' && <NotificationsTab user={user} />}
              {tab === 'payment' && <PaymentTab orders={orders} />}
            </div>
          </div>

          {/* Danger Zone */}
          <div className={cx('card danger-zone')}>
            <CardHeader icon="fa-exclamation-triangle" title="Danger Zone" />
            <div className={cx('card-body')}>
              <div className={cx('danger-option')}>
                <div className={cx('option-info')}>
                  <strong>Delete Account</strong>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button type="button" className={cx('btn btn-danger')} onClick={() => { setDeleteText(''); setDeleteOpen(true); }}>
                  <i className={cx('fas fa-trash')}></i> Delete Account
                </button>
              </div>
              <div className={cx('danger-option')}>
                <div className={cx('option-info')}>
                  <strong>Deactivate Account</strong>
                  <p>Temporarily deactivate your account. Contact an administrator to restore access.</p>
                </div>
                <button type="button" className={cx('btn btn-outline')} onClick={deactivateAccount}>
                  <i className={cx('fas fa-pause-circle')}></i> Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      <div className={cx('modal', deleteOpen && 'active')}>
        <div className={cx('modal-content')}>
          <div className={cx('modal-header')}>
            <i className={cx('fas fa-exclamation-triangle')} style={{ color: 'var(--danger)' }}></i>
            <h2>Delete Account</h2>
          </div>
          <div className={cx('modal-body')}>
            <p>
              This action is permanent and cannot be undone. All your data, including order history, subscriptions, and
              personal information will be permanently deleted.
            </p>
            <div className={cx('form-group')} style={{ marginTop: '16px' }}>
              <label htmlFor="delete-confirm">Type "DELETE" to confirm</label>
              <input type="text" id="delete-confirm" placeholder="Type DELETE here" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
            </div>
          </div>
          <div className={cx('modal-footer')}>
            <button type="button" className={cx('btn btn-outline')} onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button type="button" className={cx('btn btn-danger')} disabled={deleteText !== 'DELETE'} onClick={confirmDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
