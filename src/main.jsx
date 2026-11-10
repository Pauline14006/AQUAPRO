import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first, then each page's own styles.
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
