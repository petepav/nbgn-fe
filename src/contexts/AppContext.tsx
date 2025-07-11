import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { Transaction } from '../types/contracts';

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

interface AppState {
  user: { address: string | null; balance: string | null };
  web3: { connected: boolean; provider: any | null };
  transactions: Transaction[];
}

type Action = 
  | { type: 'SET_USER'; payload: { address: string; balance: string } }
  | { type: 'SET_WEB3'; payload: { connected: boolean; provider: any } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DISCONNECT' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_WEB3':
      return { ...state, web3: action.payload };
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [...state.transactions, action.payload] 
      };
    case 'DISCONNECT':
      return {
        ...state,
        user: { address: null, balance: null },
        web3: { connected: false, provider: null }
      };
    default:
      throw new Error(`Unhandled action type: ${(action as any).type}`);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: { address: null, balance: null },
    web3: { connected: false, provider: null },
    transactions: []
  });

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}