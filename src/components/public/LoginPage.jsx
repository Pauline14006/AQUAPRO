import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import styles from '../../styles/public.module.css';
import { useToast } from '../common/Toast';
import { BARANGAYS } from '../../lib/constants';

const cx = makeCx(styles);

const DESTINATIONS = { admin: '/admin', driver: '/driver', customer: '/dashboard' };

function PasswordInput({ id, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cx('input-group')}>
      <i className={cx('fas fa-lock')}></i>
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        placeholder={placeholder}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <i
        className={cx('fas toggle-password', visible ? 'fa-eye-slash' : 'fa-eye')}
        onClick={() => setVisible((v) => !v)}
        role="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
      ></i>
    </div>
  );
}

const EMPTY_REGISTRATION = { fullname: '', email: '', phone: '', password: '', barangay: '', address: '', terms: false };

export default function LoginPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [mode, setMode] = useState('login');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState(EMPTY_REGISTRATION);
  const [busy, setBusy] = useState(false);

  // Opening the login page signs the current user out.
  useEffect(() => {
    store.logout();
  }, []);

  const setRegField = (field) => (e) =>
    setReg((r) => ({ ...r, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

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

  function handleRegister(e) {
    e.preventDefault();
    const { fullname, email, phone, password, barangay, address, terms } = reg;
    if (!fullname || !email || !phone || !password || !barangay || !address) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!terms) {
      showToast('Please agree to the Terms & Conditions', 'error');
      return;
    }
    try {
      store.register({
        name: fullname.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        barangay,
        address: address.trim(),
        role: 'customer',
      });
      showToast('Account created. Sign in with your new credentials.', 'success');
      setLogin({ email, password: '' });
      setReg(EMPTY_REGISTRATION);
      setMode('login');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function fillDemo(account) {
    setLogin({ email: account.email, password: account.password });
    showToast(`Demo ${account.email} filled! Click Sign In to continue.`, 'success');
  }

  return (
    <div className={cx('auth-container')}>
      {/* Left Side - Branding */}
      <div className={cx('auth-brand')}>
        <div className={cx('brand-content')}>
          <div className={cx('brand-logo')}>
            <i className={cx('fas fa-water')}></i>
            <h1>AquaPro</h1>
          </div>
          <p className={cx('brand-tagline')}>Your Trusted Water Delivery Partner</p>
          <p className={cx('brand-description')}>Clean, purified water delivered to your doorstep in Catarman, Northern Samar.</p>
          <div className={cx('brand-features')}>
            {['Easy online ordering', 'Automated subscriptions', 'Real-time delivery tracking'].map((text) => (
              <div className={cx('brand-feature')} key={text}>
                <i className={cx('fas fa-check-circle')}></i>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={cx('auth-form-container')}>
        <div className={cx('auth-form-wrapper')}>
          {/* Login Form */}
          <div className={cx('auth-form', mode === 'login' && 'active')}>
            <h2>Welcome Back</h2>
            <p className={cx('form-subtitle')}>Sign in to your account to continue</p>

            <form onSubmit={handleLogin}>
              <div className={cx('form-group')}>
                <label htmlFor="login-email">Email Address</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-envelope')}></i>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Enter your email"
                    required
                    value={login.email}
                    onChange={(e) => setLogin((l) => ({ ...l, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="login-password">Password</label>
                <PasswordInput
                  id="login-password"
                  placeholder="Enter your password"
                  value={login.password}
                  onChange={(password) => setLogin((l) => ({ ...l, password }))}
                />
              </div>

              <div className={cx('form-options')}>
                <label className={cx('remember-me')}>
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className={cx('forgot-password')} onClick={(e) => e.preventDefault()}>Forgot Password?</a>
              </div>

              <button type="submit" className={cx('btn btn-primary btn-full')} disabled={busy}>
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className={cx('form-switch')}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Create Account</a>
            </p>

            {/* Demo Credentials */}
            <div className={cx('demo-credentials')}>
              <p>Demo Accounts:</p>
              <div className={cx('demo-accounts')}>
                {store.DEMO_ACCOUNTS.map((account) => (
                  <button type="button" className={cx('demo-btn')} key={account.email} onClick={() => fillDemo(account)}>
                    <i className={cx('fas', account.icon)}></i> {account.label}
                  </button>
                ))}
              </div>
              <p className={cx('form-subtitle')}>
                Prototype only: demo accounts and data are stored in this browser. Do not use real customer data or
                passwords; production authentication and a shared server database are not connected.
              </p>
            </div>
          </div>

          {/* Register Form */}
          <div className={cx('auth-form', mode === 'register' && 'active')}>
            <h2>Create Your Account</h2>
            <p className={cx('form-subtitle')}>Join AquaPro and enjoy hassle-free water delivery</p>

            <form onSubmit={handleRegister}>
              <div className={cx('form-group')}>
                <label htmlFor="reg-fullname">Full Name</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-user')}></i>
                  <input type="text" id="reg-fullname" placeholder="Juan Dela Cruz" required value={reg.fullname} onChange={setRegField('fullname')} />
                </div>
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="reg-email">Email Address</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-envelope')}></i>
                  <input type="email" id="reg-email" placeholder="your@email.com" required value={reg.email} onChange={setRegField('email')} />
                </div>
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="reg-phone">Phone Number</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-phone')}></i>
                  <input type="tel" id="reg-phone" placeholder="0912-345-6789" required value={reg.phone} onChange={setRegField('phone')} />
                </div>
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="reg-password">Password</label>
                <PasswordInput
                  id="reg-password"
                  placeholder="At least 8 characters"
                  value={reg.password}
                  onChange={(password) => setReg((r) => ({ ...r, password }))}
                />
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="reg-barangay">Barangay (Catarman, N. Samar)</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-map-marker-alt')}></i>
                  <select id="reg-barangay" required value={reg.barangay} onChange={setRegField('barangay')}>
                    <option value="">Select your barangay</option>
                    {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className={cx('form-group')}>
                <label htmlFor="reg-address">Complete Address</label>
                <div className={cx('input-group')}>
                  <i className={cx('fas fa-home')}></i>
                  <input type="text" id="reg-address" placeholder="House No., Street, Subdivision" required value={reg.address} onChange={setRegField('address')} />
                </div>
              </div>

              <div className={cx('form-check')}>
                <input type="checkbox" id="terms" required checked={reg.terms} onChange={setRegField('terms')} />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className={cx('btn btn-primary btn-full')}>Create Account</button>
            </form>

            <p className={cx('form-switch')}>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
