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
