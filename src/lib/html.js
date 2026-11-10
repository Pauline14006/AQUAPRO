/** Escape text for the few places that still write raw HTML (print windows). */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

/** Open a small window with a printable order receipt. Returns false if blocked. */
export function printOrderReceipt(order) {
  const win = window.open('', '_blank', 'width=600,height=700');
  if (!win) return false;
  win.document.write(
    `<title>AquaPro Order #${order.id}</title><h1>AquaPro Receipt</h1><p>Order #${order.id}</p>` +
    `<p>${escapeHtml(order.customer)} — ${escapeHtml(order.date)}</p>` +
    `<ul>${order.items.map((i) => `<li>${i.quantity} x ${escapeHtml(i.name)} — ₱${(i.quantity * i.price).toFixed(2)}</li>`).join('')}</ul>` +
    `<p>Total: ₱${Number(order.total).toFixed(2)}</p>`,
  );
  win.document.close();
  win.print();
  return true;
}
