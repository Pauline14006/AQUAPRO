/**
 * Class-name helper for CSS modules.
 *
 * Pages use plain class names (`btn btn-primary`, `stat-card`, ...).
 * Each page imports the CSS modules it needs and builds a `cx` bound to them:
 *
 *   const cx = makeCx(adminStyles, inventoryStyles)
 *   <div className={cx('stat-card', isActive && 'active')} />
 *
 * Every class is emitted as its plain name (so the shared rules in
 * global.css still apply) plus the scoped name from each module that defines
 * it. Page styles therefore stay scoped to the pages that import them, while
 * the markup keeps the original, readable class names.
 */
export function makeCx(...modules) {
  return (...args) => {
    const out = [];
    for (const arg of args.flat()) {
      if (!arg) continue;
      for (const name of String(arg).split(/\s+/)) {
        if (!name) continue;
        out.push(name);
        for (const mod of modules) {
          if (mod[name]) out.push(mod[name]);
        }
      }
    }
    return out.join(' ');
  };
}
