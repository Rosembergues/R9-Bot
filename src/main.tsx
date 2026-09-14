import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enforce Title & Favicon at runtime
if (typeof document !== 'undefined') {
  document.title = 'R9Bot';
  const svgFavicon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='112' fill='%230284c7'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' dominant-baseline='central' fill='%23ffffff' font-family='system-ui, -apple-system, sans-serif' font-size='240' font-weight='900' letter-spacing='-6px'%3ER9%3C/text%3E%3C/svg%3E`;
  
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = svgFavicon;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
