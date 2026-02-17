// SPENDTRAK - Network Context
// Manages network status detection and offline capability

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

interface NetworkContextType {
  // Connection status
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: NetInfoStateType | null;

  // Network details
  details: NetInfoState | null;

  // Actions
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  details: null,
  refresh: async () => {},
});

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    // Get initial state
    NetInfo.fetch().then(setNetworkState);

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.refresh();
    setNetworkState(state);
  }, []);

  const value = useMemo<NetworkContextType>(() => ({
    isConnected: networkState?.isConnected ?? true,
    isInternetReachable: networkState?.isInternetReachable ?? true,
    connectionType: networkState?.type ?? null,
    details: networkState,
    refresh,
  }), [networkState, refresh]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

/**
 * Hook to access full network context
 */
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

/**
 * Hook for simple online/offline check
 * Returns true if device is connected AND internet is reachable
 */
export const useIsOnline = (): boolean => {
  const { isConnected, isInternetReachable } = useNetwork();
  return isConnected && isInternetReachable !== false;
};

/**
 * Hook for connection type (wifi, cellular, etc.)
 */
export const useConnectionType = (): NetInfoStateType | null => {
  const { connectionType } = useNetwork();
  return connectionType;
};

export type { NetworkContextType };
