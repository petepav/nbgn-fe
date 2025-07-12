import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeEruda } from './utils/eruda';

// Initialize Eruda for mobile debugging if conditions are met
// eslint-disable-next-line @typescript-eslint/no-floating-promises
void initializeEruda();

const root = ReactDOM.createRoot(
  // eslint-disable-next-line no-undef
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
