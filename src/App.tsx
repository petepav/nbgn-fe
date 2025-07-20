import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { TokenProvider } from './contexts/TokenContext';
import { ToastProvider } from './contexts/ToastContext';
import { WagmiProvider } from './components/WagmiProvider';
import { AppContent } from './components/AppContent';
import { DisclaimerPage } from './components/DisclaimerPage';
import { InfoPage } from './components/InfoPage';
import { SimpleDebugConsole } from './components/SimpleDebugConsole';
import { TermsOfUse } from './components/TermsOfUse';
import { VoucherClaim } from './components/Voucher/VoucherClaim';
import { useTermsAcceptance } from './hooks/useTermsAcceptance';
import './App.css';

function AppWithTerms() {
  const { hasAcceptedTerms, isLoading, acceptTerms, declineTerms } =
    useTermsAcceptance();

  if (isLoading) {
    return (
      <div className="App">
        <div className="App-header">
          <div className="loader-container">
            <div className="red-loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAcceptedTerms) {
    return <TermsOfUse onAccept={acceptTerms} onDecline={declineTerms} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/debug" element={<SimpleDebugConsole />} />
        <Route path="/claim/:voucherId" element={<VoucherClaim />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <WagmiProvider>
      <AppProvider>
        <TokenProvider>
          <ToastProvider>
            <AppWithTerms />
          </ToastProvider>
        </TokenProvider>
      </AppProvider>
    </WagmiProvider>
  );
}

export default App;
