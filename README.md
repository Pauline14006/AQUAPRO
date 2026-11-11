# AquaPro

A web-based order and delivery management system for water refilling stations in Catarman, Northern Samar.
This is the **React front-end** (Integrative Programming and Technologies 1 midterm project, group Visionary Studio).

> There is currently no database or backend server. Users, orders, subscriptions, and inventory are saved
> in the browser's `localStorage`, so this is a front-end prototype.

## How to run

```bash
cd aquapro-app
npm install
npm run dev      # then open http://localhost:5173
npm run build    # production build into dist/
```

Requires Node.js 20.19+ (or 22.12+).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | customer@aquapro.ph | customer123 |
| Admin | admin@aquapro.ph | admin123 |
| Driver | driver@aquapro.ph | driver123 |

## Features by role

- **Public:** home page, login/register, water quality page.
- **Customer:** dashboard with live order status, place an order (products, quantity, delivery date and time slot, validation), order history (search, filters, receipts, reorder, rating, remove finished orders), track delivery, auto-refill subscription, profile.
- **Driver:** assigned deliveries, start delivery, add delivery photo, mark as delivered, customer not available (returns the order to pending), completed list.
- **Admin:** dashboard (today's orders, sales, drivers, stock, weekly sales, top customers), orders, deliveries (assign drivers), drivers, customers, inventory (containers), reports, settings.

## Technologies

| Technology | Purpose |
|---|---|
| React 19 / React DOM 19 | Reusable components, state, and rendering for every page |
| React Router 7 | Page routing and role-based protected routes |
| Vite 8 | Development server and build tool |
| JSX | JavaScript with HTML-like markup inside components |
| CSS Modules + global.css | Page styling, layout, and responsiveness |
| Browser localStorage | Saving users, orders, subscriptions, and inventory |
| Font Awesome 6.4 (CDN) | Icons |

## Main Functions and Features

The snippets below are taken from the project's source files, in the same order as in the files. Lines marked with `...` are skipped.

### 1. Application Routing and Role Protection

[`App.jsx`](src/App.jsx) connects every page URL to its React component. Pages inside `RequireRole` can only be opened by the listed role.

```jsx
<BrowserRouter>
  <ToastProvider>
    <ScrollManager />
    <Routes>
      ...
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      ...
      <Route element={<RequireRole roles={['customer']} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/order" element={<OrderPage />} />
        ...
      </Route>
      ...
      <Route element={<RequireRole roles={['driver']} />}>
        <Route path="/driver" element={<DriverMobilePage />} />
      </Route>
      ...
      <Route path="/admin" element={<RequireRole roles={['admin']} />}>
        ...
      </Route>
      ...
    </Routes>
  </ToastProvider>
</BrowserRouter>
```

[`RequireRole.jsx`](src/components/common/RequireRole.jsx) checks the logged-in user. If nobody is logged in, or the role does not match, the visitor is sent to the login page.

```jsx
export default function RequireRole({ roles }) {
  useStoreVersion();
  const user = getCurrentUser();
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

### 2. Order State and Quantity

`useState` remembers the quantity of each product. The + button updates it, and the page redraws automatically.

```jsx
const clampQty = (n) => Math.max(0, Math.min(10, Number.parseInt(n, 10) || 0));
...
const [qty, setQty] = useState({ slim: 0, round: 0, bottle: 0 });
...
<button type="button" className={cx('qty-btn')}
  onClick={() => setQty((q) => ({ ...q, [p.id]: clampQty(q[p.id] + 1) }))}>+</button>
```

### 3. Order Validation and Creation

`placeOrder()` checks the product and the delivery date. If a check fails, an error message is shown and no order is created. If everything is valid, the order is saved as Pending.

```jsx
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
    ...
    items,
    subtotal,
    ...
    total: subtotal + store.getDeliveryFee(),
    date,
    timeSlot,
    ...
    status: 'pending',
    ...
    payment: 'Cash on Delivery',
    createdAt: new Date().toISOString(),
  });
  navigate(`/order-history?new=${order.id}`);
}
```

### 4. Order Status Tracker

[`DashboardPage.jsx`](src/components/customer/DashboardPage.jsx) passes props to `StageStep`, which shows each step as completed, active, or waiting.

```jsx
const isDelivered = latest?.status === 'delivered';
const activeIndex = latest ? (isDelivered ? STAGES.length : STAGES.indexOf(latest.status)) : -1;
...
<StageStep key={stage.label} stage={stage} index={index} activeIndex={activeIndex} />
```

```jsx
function StageStep({ stage, index, activeIndex }) {
  const state = activeIndex > index ? 'completed' : activeIndex === index ? 'active' : '';
  ...
}
```

### 5. Data Storage and Automatic Refresh

[`store.js`](src/lib/store.js) saves the data in the browser's `localStorage`. Every write calls `emit()`, so all pages that use `useStoreData` redraw with the new data.

```jsx
export function useStoreData(read) {
  const v = useStoreVersion();
  return useMemo(read, [v]);
}
...
export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}
```

```jsx
export function createOrder(order) {
  const orders = getOrders();
  const highestId = orders.reduce((max, o) => Math.max(max, Number(o.id) || 0), 1000);
  const created = { ...order, id: highestId + 1 };
  orders.unshift(created);
  saveOrders(orders);
  return created;
}
```

### 6. Product Data and Rendering

[`OrderPage.jsx`](src/components/customer/OrderPage.jsx) stores the products in an array and shows one card for each product.

```jsx
export const PRODUCTS = [
  { id: 'slim', name: 'Slim Container', desc: '3-gallon container', price: 25 },
  { id: 'round', name: 'Round Container', desc: '4-gallon container', price: 30 },
  { id: 'bottle', name: '5-Gallon Bottle', desc: 'Large 5-gallon bottle', price: 35 },
];
```

```jsx
{PRODUCTS.map((p) => (
  <div className={cx('product-card')} key={p.id}>
    <div className={cx('product-info')}>
      <h3>{p.name}</h3>
      <p className={cx('product-desc')}>{p.desc}</p>
      <p className={cx('product-price')}>{store.formatCurrency(p.price)}</p>
      ...
    </div>
  </div>
))}
```

### 7. Computing the Order Total

The selected items, subtotal, and delivery fee are calculated from the quantities every time the page redraws.

```jsx
const items = PRODUCTS.filter((p) => qty[p.id] > 0)
  .map((p) => ({ name: p.name, price: p.price, quantity: qty[p.id] }));
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const deliveryFee = items.length ? store.getDeliveryFee() : 0;
```

### 8. Login and Registration Validation

[`LoginPage.jsx`](src/components/public/LoginPage.jsx) validates the form before signing in or creating an account.

```jsx
function handleLogin(e) {
  e.preventDefault();
  if (!login.email || !login.password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  setBusy(true);
  const user = store.login(login.email, login.password);
  setBusy(false);
  if (!user) {
    showToast('Email or password is incorrect', 'error');
    return;
  }
  navigate(DESTINATIONS[user.role] || '/');
}
```

```jsx
if (password.length < 8) {
  showToast('Password must be at least 8 characters', 'error');
  return;
}
```

The demonstration accounts are:

| Role | Email | Password |
|---|---|---|
| Customer | customer@aquapro.ph | customer123 |
| Admin | admin@aquapro.ph | admin123 |
| Driver | driver@aquapro.ph | driver123 |

Authentication is a demo implementation and does not use a real account database.

### 9. Delivery Assignment and Driver Updates

The admin assigns a driver in [`DeliveryManagementPage.jsx`](src/components/admin/DeliveryManagementPage.jsx).

```jsx
function assign(order, driverEmail) {
  if (!driverEmail) {
    showToast('Select a driver before assigning this delivery.', 'error');
    return;
  }
  store.updateOrder(order.id, { driverEmail, status: 'confirmed' });
  showToast('Delivery assigned to driver.', 'success');
}
```

The driver starts the delivery, or returns it to the admin if the customer is not available, in [`DriverMobilePage.jsx`](src/components/driver/DriverMobilePage.jsx).

```jsx
const start = (order) => store.updateOrder(order.id, { status: 'delivering' });
...
function unavailable(order) {
  if (!window.confirm('Mark the customer unavailable and return this order to the unassigned queue?')) return;
  store.updateOrder(order.id, { status: 'pending', driverEmail: '' });
  showToast('Order returned to the admin assignment queue.', 'success');
}
```

## Project structure

```
src/
  main.jsx            starts React and renders <App />
  App.jsx             all routes + role protection
  components/
    common/           RequireRole, Toast, Pagination
    public/           Home, Login, Water quality, Navbar, Footer
    customer/         Dashboard, Order, Order history, Tracking, Subscription, Profile
    driver/           Driver mobile page
    admin/            Dashboard, Orders, Delivery, Drivers, Customers, Inventory, Reports, Settings
  lib/                store.js (data layer on localStorage), helpers
  styles/             global.css and one CSS module per area
```
