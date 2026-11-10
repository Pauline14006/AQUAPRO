/** Hook-free pagination helper: slices `items` and returns paging info. */
export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    current,
    pageCount,
    visible: items.slice(start, start + pageSize),
    from: items.length ? start + 1 : 0,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
  };
}

/** The `.table-pagination` footer used on several tables. */
export default function Pagination({ cx, info, onPage }) {
  const { current, pageCount, from, to, total } = info;
  return (
    <div className={cx('table-pagination')}>
      <span>Showing {from}-{to} of {total} entries</span>
      <div className={cx('pagination-buttons')}>
        <button type="button" className={cx('btn btn-sm')} disabled={current === 1} onClick={() => onPage(current - 1)}>Previous</button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button type="button" key={n} className={cx('btn btn-sm', n === current && 'active')} onClick={() => onPage(n)}>{n}</button>
        ))}
        <button type="button" className={cx('btn btn-sm')} disabled={current === pageCount} onClick={() => onPage(current + 1)}>Next</button>
      </div>
    </div>
  );
}
