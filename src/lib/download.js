/** Save a text blob as a file download (used by the export/receipt buttons). */
export function downloadText(filename, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Build a CSV string from an array of rows, quoting every value. */
export function toCsv(rows) {
  return rows
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

export function orderReceipt(order) {
  return [
    `AquaPro receipt - Order #${order.id}`,
    `Customer: ${order.customer}`,
    `Date: ${order.date}`,
    ...order.items.map((item) => `${item.quantity} x ${item.name} - PHP ${(item.quantity * item.price).toFixed(2)}`),
    `Subtotal: PHP ${Number(order.subtotal).toFixed(2)}`,
    `Delivery fee: PHP ${Number(order.deliveryFee).toFixed(2)}`,
    `Total: PHP ${Number(order.total).toFixed(2)}`,
    `Status: ${order.status}`,
  ].join('\r\n');
}
