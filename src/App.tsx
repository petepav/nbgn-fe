import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppContent } from './components/AppContent';
import { DisclaimerPage } from './components/DisclaimerPage';
import { InfoPage } from './components/InfoPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/info" element={<InfoPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
