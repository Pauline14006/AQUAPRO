import { Link } from 'react-router-dom';
import { makeCx } from '../../lib/cx';
import styles from '../../styles/public.module.css';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

const cx = makeCx(styles);

export default function HomePage() {
  return (
    <>
      <PublicNavbar cx={cx} />
      <section className={cx("hero")} id="home">
        <div className={cx("hero-container")}>
          <div className={cx("hero-content")}>
            <h1>Order Clean Water, Delivered to Your Door</h1>
            <p className={cx("hero-subtitle")}>
              Serving Catarman, Northern Samar with reliable water delivery. Fresh, purified water for your home, office, or school.
            </p>
            <div className={cx("hero-buttons")}>
              <Link to="/login" className={cx("btn btn-primary")}>Place an Order</Link>
              <Link to="/login" className={cx("btn btn-secondary")}>Create an Account</Link>
            </div>
            <div className={cx("hero-stats")}>
              <div className={cx("stat")}>
                <span className={cx("stat-number")}>1000+</span>
                <span className={cx("stat-label")}>Happy Customers</span>
              </div>
              <div className={cx("stat")}>
                <span className={cx("stat-number")}>50,000+</span>
                <span className={cx("stat-label")}>Deliveries Made</span>
              </div>
              <div className={cx("stat")}>
                <span className={cx("stat-number")}>5</span>
                <span className={cx("stat-label")}>Stations in Catarman</span>
              </div>
            </div>
              </div>
          <div className={cx("hero-image")}>
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect fill='%23e0f2fe' width='400' height='500' rx='20'/%3E%3Ccircle cx='200' cy='200' r='80' fill='%233b82f6' opacity='0.3'/%3E%3Ccircle cx='200' cy='200' r='50' fill='%2360a5fa' opacity='0.5'/%3E%3Cpath d='M160 300 Q200 250 240 300' stroke='%232563eb' stroke-width='3' fill='none'/%3E%3Crect x='155' y='300' width='90' height='120' rx='10' fill='%233b82f6' opacity='0.4'/%3E%3Ctext x='200' y='460' text-anchor='middle' fill='%231e40af' font-size='14'%3E💧 AquaPro%3C/text%3E%3C/svg%3E" alt="AquaPro Water Delivery" className={cx("hero-img")} />
              </div>
            </div>
      </section>
      {/* Features Section */}
      <section className={cx("features")} id="features">
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>Why Choose AquaPro?</h2>
          <p className={cx("section-subtitle")}>Modern water delivery designed for your convenience</p>
          <div className={cx("features-grid")}>
            <div className={cx("feature-card")}>
              <div className={cx("feature-icon")}>
                <i className={cx("fas fa-shopping-cart")}></i>
              </div>
              <h3>Online Ordering</h3>
              <p>
                Place your water orders anytime, anywhere. No more phone calls or handwritten notes. Quick and easy ordering at your fingertips.
              </p>
            </div>
            <div className={cx("feature-card")}>
              <div className={cx("feature-icon")}>
                <i className={cx("fas fa-sync-alt")}></i>
              </div>
              <h3>Subscription Auto-Refill</h3>
              <p>
                Set it and forget it. Schedule automatic deliveries daily, weekly, or on your custom days. Never run out of clean water again.
              </p>
            </div>
            <div className={cx("feature-card")}>
              <div className={cx("feature-icon")}>
                <i className={cx("fas fa-truck")}></i>
              </div>
              <h3>Real-Time Delivery Tracking</h3>
              <p>Know exactly when your water will arrive. Track your order from station to doorstep with live updates and driver information.</p>
            </div>
              </div>
            </div>
      </section>
      {/* How It Works Section */}
      <section className={cx("how-it-works")}>
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>How It Works</h2>
          <div className={cx("steps")}>
            <div className={cx("step")}>
              <div className={cx("step-number")}>1</div>
              <i className={cx("fas fa-user-plus")}></i>
              <h3>Create Account</h3>
              <p>Sign up with your details and delivery address</p>
            </div>
            <div className={cx("step")}>
              <div className={cx("step-number")}>2</div>
              <i className={cx("fas fa-box")}></i>
              <h3>Place Order</h3>
              <p>Choose your water container and schedule delivery</p>
            </div>
            <div className={cx("step")}>
              <div className={cx("step-number")}>3</div>
              <i className={cx("fas fa-tint")}></i>
              <h3>Get Delivery</h3>
              <p>Receive fresh, purified water at your doorstep</p>
            </div>
              </div>
            </div>
      </section>
      {/* Trust Section */}
      <section className={cx("trust")}>
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>Trusted Water Quality</h2>
          <div className={cx("trust-content")}>
            <div className={cx("trust-text")}>
              <p>
                All AquaPro stations use advanced filtration systems including sediment filtration, carbon filtration, reverse osmosis, and UV sterilization to ensure the highest quality drinking water for your family.
              </p>
              <Link to="/water-quality" className={cx("btn btn-outline")}>View Water Quality Report</Link>
            </div>
            <div className={cx("trust-badges")}>
              <div className={cx("badge")}>
                <i className={cx("fas fa-certificate")}></i>
                <span>Lab Tested</span>
              </div>
              <div className={cx("badge")}>
                <i className={cx("fas fa-shield-alt")}></i>
                <span>DOF Compliant</span>
              </div>
              <div className={cx("badge")}>
                <i className={cx("fas fa-star")}></i>
                <span>5-Star Service</span>
              </div>
            </div>
              </div>
            </div>
      </section>
      {/* CTA Section */}
      <section className={cx("cta")}>
        <div className={cx("container")}>
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of satisfied customers in Catarman. Fresh, clean water is just a click away.</p>
          <div className={cx("cta-buttons")}>
            <Link to="/login" className={cx("btn btn-primary btn-large")}>Create Your Account</Link>
            <Link to="/login" className={cx("btn btn-white btn-large")}>Place an Order</Link>
              </div>
            </div>
      </section>
      <PublicFooter cx={cx} />
    </>
  );
}
