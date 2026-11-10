import { Link } from 'react-router-dom';

export default function PublicFooter({ cx }) {
  return (
    <footer className={cx('footer')}>
      <div className={cx('container')}>
        <div className={cx('footer-content')}>
          <div className={cx('footer-brand')}>
            <i className={cx('fas fa-water')}></i>
            <span>AquaPro</span>
            <p>Serving Catarman, Northern Samar with clean, purified water since 2020.</p>
          </div>
          <div className={cx('footer-links')}>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/#home">Home</Link></li>
              <li><Link to="/#features">Features</Link></li>
              <li><Link to="/water-quality">Water Quality</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
          <div className={cx('footer-contact')}>
            <h4>Contact Us</h4>
            <ul>
              <li><i className={cx('fas fa-phone')}></i> (055) 123-4567</li>
              <li><i className={cx('fas fa-envelope')}></i> info@aquapro.ph</li>
              <li><i className={cx('fas fa-map-marker-alt')}></i> Catarman, Northern Samar</li>
            </ul>
          </div>
        </div>
        <div className={cx('footer-bottom')}>
          <p>&copy; 2024 AquaPro. All rights reserved. | A Capstone Project by UEP Students</p>
        </div>
      </div>
    </footer>
  );
}
