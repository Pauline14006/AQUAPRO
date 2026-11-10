import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

/**
 * Top navigation bar for the public pages (Home and Water Quality).
 * `cx` is passed in by the page so the bar uses that page's styles.
 */
export default function PublicNavbar({ cx, variant = 'home' }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <nav
      className={cx('navbar')}
      style={{ boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)' }}
    >
      <div className={cx('nav-container')}>
        <Link to="/" className={cx('logo')}>
          <i className={cx('fas fa-water')}></i>
          <span>AquaPro</span>
        </Link>
        <ul className={cx('nav-menu', open && 'active')}>
          <li><Link to="/#home" onClick={close}>Home</Link></li>
          <li><Link to="/#features" onClick={close}>Features</Link></li>
          <li>
            <NavLink to="/water-quality" onClick={close} className={({ isActive }) => cx(isActive && 'active')}>
              Water Quality
            </NavLink>
          </li>
          <li><Link to="/login" onClick={close}>Login</Link></li>
          {variant === 'home' && (
            <li><Link to="/login" className={cx('btn-nav')} onClick={close}>Create Account</Link></li>
          )}
        </ul>
        {variant === 'home' && (
          <button
            type="button"
            className={cx('hamburger', open && 'active')}
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            style={{ background: 'none', border: 0 }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
      </div>
    </nav>
  );
}
