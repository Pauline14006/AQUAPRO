// AquaPro data store.
// Browser-only prototype: users, orders, subscriptions, inventory and
// settings are all saved in localStorage.
import { useMemo, useSyncExternalStore } from 'react';

export const KEYS = {
  users: 'aquapro_users',
  session: 'aquapro_session',
  orders: 'aquapro_orders',
  subscriptions: 'aquapro_subscriptions',
  inventory: 'aquapro_inventory',
  settings: 'aquapro_admin_settings',
};

// ---- change notification (pages re-render when data changes) ----
let version = 0;
const listeners = new Set();
function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith('aquapro_')) emit();
  });
}

/** Re-render whenever the store changes (in this tab or another one). */
export function useStoreVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

/** Read derived store data and recompute it after every store change. */
export function useStoreData(read) {
  const v = useStoreVersion();
  return useMemo(read, [v]);
}

// ---- raw storage ----
export function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

export function remove(key) {
  localStorage.removeItem(key);
  emit();
}

// ---- users & session ----
export const getUsers = () => read(KEYS.users, []);
export const saveUsers = (users) => write(KEYS.users, users);
export const getSession = () => read(KEYS.session, null);

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((u) => u.email === session.email) || null;
}

export function register(user) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  users.push({
    ...user,
    createdAt: user.createdAt || new Date().toISOString(),
    active: user.active !== false,
  });
  saveUsers(users);
}

export function login(email, password) {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user || user.active === false) return null;
  localStorage.setItem('aquapro_user_name', user.name);
  localStorage.setItem('aquapro_user_email', user.email);
  localStorage.setItem('aquapro_user_role', user.role);
  localStorage.setItem('aquapro_is_logged_in', 'true');
  write(KEYS.session, { email: user.email, role: user.role });
  return user;
}

export function logout() {
  ['aquapro_user_name', 'aquapro_user_email', 'aquapro_user_role', 'aquapro_is_logged_in']
    .forEach((k) => localStorage.removeItem(k));
  remove(KEYS.session);
}

export function updateCurrentUser(changes) {
  const current = getCurrentUser();
  if (!current) throw new Error('No signed-in user was found.');
  const users = getUsers();
  const email = changes.email ? changes.email.trim().toLowerCase() : current.email;
  if (users.some((u) => u.email.toLowerCase() === email && u.email !== current.email)) {
    throw new Error('An account with this email already exists.');
  }
  const index = users.findIndex((u) => u.email === current.email);
  if (index < 0) throw new Error('The signed-in account could not be found.');
  users[index] = { ...users[index], ...changes, email };
  localStorage.setItem('aquapro_user_name', users[index].name);
  localStorage.setItem('aquapro_user_email', email);
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  write(KEYS.session, { email, role: users[index].role });
  return users[index];
}

// ---- orders ----
export const getOrders = () => read(KEYS.orders, []);
export const saveOrders = (orders) => write(KEYS.orders, orders);

export function createOrder(order) {
  const orders = getOrders();
  const highestId = orders.reduce((max, o) => Math.max(max, Number(o.id) || 0), 1000);
  const created = { ...order, id: highestId + 1 };
  orders.unshift(created);
  saveOrders(orders);
  return created;
}

export function updateOrder(id, changes) {
  const orders = getOrders();
  const index = orders.findIndex((o) => String(o.id) === String(id));
  if (index < 0) throw new Error(`Order #${id} was not found.`);
  orders[index] = { ...orders[index], ...changes };
  saveOrders(orders);
  return orders[index];
}

// ---- subscriptions, inventory, settings ----
export const getSubscriptions = () => read(KEYS.subscriptions, {});
export const saveSubscriptions = (items) => write(KEYS.subscriptions, items);

const DEFAULT_INVENTORY = [
  { id: 'BTL-001', type: '5-Gallon Bottle', status: 'in-stock', associated: '' },
  { id: 'BTL-002', type: 'Round Container', status: 'with-customer', associated: 'Juan Dela Cruz' },
  { id: 'BTL-003', type: 'Slim Container', status: 'in-stock', associated: '' },
];
export const getInventory = () => read(KEYS.inventory, DEFAULT_INVENTORY);
export const saveInventory = (items) => write(KEYS.inventory, items);

export const getSettings = () => read(KEYS.settings, {});
export const saveSettings = (settings) => write(KEYS.settings, settings);

export function getDeliveryFee() {
  const settings = getSettings();
  const configured = Number(settings[1] && settings[1][0]);
  return Number.isFinite(configured) && configured >= 0 ? configured : 20;
}

// ---- helpers shared by several pages ----
export function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---- demo data ----
export const DEMO_ACCOUNTS = [
  { email: 'customer@aquapro.ph', password: 'customer123', role: 'customer', name: 'Juan Dela Cruz', icon: 'fa-user', label: 'Customer' },
  { email: 'admin@aquapro.ph', password: 'admin123', role: 'admin', name: 'AquaPro Administrator', icon: 'fa-user-cog', label: 'Admin' },
  { email: 'driver@aquapro.ph', password: 'driver123', role: 'driver', name: 'Roberto Mendoza', icon: 'fa-truck', label: 'Driver' },
];

function seed() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(KEYS.orders) === null) {
    localStorage.setItem(KEYS.orders, JSON.stringify([
      {
        id: 1005, email: 'customer@aquapro.ph', customer: 'Juan Dela Cruz',
        phone: '0912-345-6789', barangay: 'Acacia', address: '#123 Main St., Brgy. Acacia, Catarman',
        items: [{ name: '5-Gallon Bottle', quantity: 2, price: 35 }],
        subtotal: 70, deliveryFee: 20, total: 90, date: '2026-10-23',
        timeSlot: 'morning', status: 'delivering', driverEmail: 'driver@aquapro.ph',
        payment: 'Cash on Delivery', instructions: '',
      },
      {
        id: 1004, email: 'customer@aquapro.ph', customer: 'Juan Dela Cruz',
        phone: '0912-345-6789', barangay: 'Acacia', address: '#123 Main St., Brgy. Acacia, Catarman',
        items: [{ name: 'Round Container', quantity: 3, price: 30 }],
        subtotal: 90, deliveryFee: 20, total: 110, date: '2026-10-22',
        timeSlot: 'afternoon', status: 'confirmed', driverEmail: '',
        payment: 'Cash on Delivery', instructions: '',
      },
    ]));
  }
  if (localStorage.getItem(KEYS.inventory) === null) {
    localStorage.setItem(KEYS.inventory, JSON.stringify(DEFAULT_INVENTORY));
  }
  const users = getUsers().map((u) => ({
    ...u,
    createdAt: u.createdAt || new Date().toISOString(),
    active: u.active === undefined ? true : u.active,
  }));
  for (const demo of DEMO_ACCOUNTS) {
    if (!users.some((u) => u.email.toLowerCase() === demo.email)) {
      users.push({
        name: demo.name, email: demo.email, password: demo.password, role: demo.role,
        createdAt: new Date().toISOString(), active: true,
        phone: '0912-345-6789', barangay: 'Acacia', address: '#123 Main St., Brgy. Acacia, Catarman',
      });
    }
  }
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}
seed();
