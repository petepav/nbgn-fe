import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App';
import reportWebVitals from './reportWebVitals';
// import { initializeEruda } from './utils/eruda';

const root = ReactDOM.createRoot(
  // eslint-disable-next-line no-undef
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// TEMPORARILY DISABLED - Eruda causing white screen
// Initialize Eruda AFTER React renders to prevent blocking
// eslint-disable-next-line no-undef
// setTimeout(() => {
//   // eslint-disable-next-line @typescript-eslint/no-floating-promises
//   void initializeEruda();
// }, 100);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
