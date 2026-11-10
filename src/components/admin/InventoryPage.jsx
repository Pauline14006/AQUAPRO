import { useState } from 'react';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import adminStyles from '../../styles/admin.module.css';
import inventoryStyles from '../../styles/inventory.module.css';
import { useToast } from '../common/Toast';
import Pagination, { paginate } from '../common/Pagination';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles, inventoryStyles);
const TYPES = ['5-Gallon Bottle', 'Round Container', 'Slim Container'];
const STATUSES = ['in-stock', 'with-customer', 'with-driver', 'damaged', 'returned'];
const PAGE_SIZE = 10;

export default function InventoryPage() {
  const showToast = useToast();
  const items = store.useStoreData(store.getInventory);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const inStock = items.filter((i) => i.status === 'in-stock').length;
  const filtered = items.filter((i) => {
    const text = `${i.id} QR-${i.id} ${i.type} ${i.status.replace('-', ' ')} ${i.lastMovement || 'Today'} ${i.associated || '—'}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!status || i.status === status) && (!type || i.type.toLowerCase().includes(type));
  });
  const info = paginate(filtered, page, PAGE_SIZE);

  function save(next, message) {
    store.saveInventory(next);
    if (message) showToast(message, 'success');
  }

  function addBottle() {
    const input = window.prompt('Bottle type: 5-Gallon Bottle, Round Container, or Slim Container');
    if (!input) return;
    const normalized = TYPES.find((t) => t.toLowerCase() === input.trim().toLowerCase());
    if (!normalized) {
      showToast('Choose one of the listed bottle types.', 'error');
      return;
    }
    const id = `BTL-${String(Date.now()).slice(-6)}`;
    save([...store.getInventory(), { id, type: normalized, status: 'in-stock', associated: '', lastMovement: new Date().toLocaleDateString() }], `Bottle ${id} added to inventory.`);
  }

  function recordReturn() {
    const id = window.prompt('Enter the Bottle ID being returned:');
    if (!id) return;
    const inventory = store.getInventory();
    const item = inventory.find((i) => i.id.toLowerCase() === id.trim().toLowerCase());
    if (!item) {
      showToast('Bottle ID was not found.', 'error');
      return;
    }
    save(
      inventory.map((i) => (i === item ? { ...i, status: 'returned', associated: '', lastMovement: new Date().toLocaleDateString() } : i)),
      `${item.id} return recorded.`,
    );
  }

  function changeStatus(item) {
    const next = window.prompt('Set status: in-stock, with-customer, with-driver, damaged, returned', item.status);
    if (next === null) return;
    if (!STATUSES.includes(next.toLowerCase())) {
      showToast('Choose a valid inventory status.', 'error');
      return;
    }
    save(store.getInventory().map((i) => (i.id === item.id ? { ...i, status: next.toLowerCase(), lastMovement: new Date().toLocaleDateString() } : i)));
  }

  const stats = [
    { icon: 'fa-boxes', color: 'blue', value: items.length, label: 'Total in Circulation' },
    { icon: 'fa-box', color: 'gray', value: items.filter((i) => i.status === 'returned').length, label: 'Empty Bottles' },
    { icon: 'fa-check-circle', color: 'green', value: inStock, label: 'Filled & Ready' },
    { icon: 'fa-trash', color: 'red', value: items.filter((i) => i.status === 'damaged').length, label: 'Damaged' },
  ];

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Inventory Management" subtitle="Track bottles, containers, and stock levels">
        <div className={cx('header-actions')}>
          <button type="button" className={cx('btn btn-primary')} onClick={addBottle}>
            <i className={cx('fas fa-plus')}></i> Log New Bottle
          </button>
          <button type="button" className={cx('btn btn-outline')} onClick={recordReturn}>
            <i className={cx('fas fa-undo')}></i> Record Return
          </button>
        </div>
      </AdminHeader>

      {/* Low Stock Warning */}
      {inStock < 10 && !warningDismissed && (
        <div className={cx('warning-banner')} style={{ display: 'flex' }}>
          <i className={cx('fas fa-exclamation-triangle')}></i>
          <span>
            Low Stock Alert: Only {inStock} filled bottles remaining for delivery!{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); addBottle(); }}>Restock now</a>
          </span>
          <button type="button" className={cx('warning-close')} onClick={() => setWarningDismissed(true)}>×</button>
        </div>
      )}

      <div className={cx('inventory-dashboard')}>
        {/* Summary Cards */}
        <div className={cx('stat-cards')}>
          {stats.map((s) => (
            <div className={cx('stat-card')} key={s.label}>
              <div className={cx('stat-icon', s.color)}>
                <i className={cx('fas', s.icon)}></i>
              </div>
              <div className={cx('stat-info')}>
                <span className={cx('stat-value')}>{s.value}</span>
                <span className={cx('stat-label')}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className={cx('table-toolbar')}>
          <div className={cx('search-bar')}>
            <i className={cx('fas fa-search')}></i>
            <input type="text" placeholder="Search by Bottle ID or QR Code..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <select className={cx('filter-select')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="with-customer">With Customer</option>
            <option value="with-driver">With Driver</option>
            <option value="damaged">Damaged</option>
          </select>
          <select className={cx('filter-select')} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="5-gallon">5-Gallon Bottle</option>
            <option value="round">Round Container</option>
            <option value="slim">Slim Container</option>
          </select>
        </div>

        {/* Bottle Inventory Table */}
        <div className={cx('card')}>
          <div className={cx('table-container')}>
            <table className={cx('data-table')}>
              <thead>
                <tr>
                  <th>Bottle ID</th>
                  <th>QR Code</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Movement</th>
                  <th>Associated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {info.visible.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.id}</strong></td>
                    <td><code>QR-{item.id}</code></td>
                    <td>{item.type}</td>
                    <td><span className={cx('status-badge', `status-${item.status}`)}>{item.status.replace('-', ' ')}</span></td>
                    <td>{item.lastMovement || 'Today'}</td>
                    <td>{item.associated || '—'}</td>
                    <td>
                      <div className={cx('action-btns')}>
                        <button
                          type="button"
                          className={cx('btn btn-sm btn-primary')}
                          onClick={() => window.alert(`${item.id}\nType: ${item.type}\nStatus: ${item.status}\nAssociated: ${item.associated || 'None'}`)}
                        >
                          View
                        </button>
                        <button type="button" className={cx('btn btn-sm btn-outline')} onClick={() => changeStatus(item)}>Change Status</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination cx={cx} info={info} onPage={setPage} />
        </div>
      </div>
    </AdminShell>
  );
}
