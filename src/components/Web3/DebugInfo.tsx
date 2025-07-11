import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import environment from '../../config/environment';

export const DebugInfo: React.FC = () => {
  const { user, web3 } = useAppState();

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-xs">
      <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
      <div className="space-y-1 text-yellow-700">
        <p><strong>Environment:</strong> {process.env.VERCEL_ENV || 'development'}</p>
        <p><strong>Contract Address:</strong> {environment.contractAddress || 'Not set'}</p>
        <p><strong>Network:</strong> {environment.network}</p>
        <p><strong>Connected:</strong> {web3.connected ? 'Yes' : 'No'}</p>
        <p><strong>User Address:</strong> {user.address || 'Not connected'}</p>
        <p><strong>User Balance:</strong> {user.balance} NBGN</p>
        <p><strong>Has Provider:</strong> {web3.provider ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};