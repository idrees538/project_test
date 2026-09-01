import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';

export const WALLET_STATUS = {
  UNAVAILABLE: 'unavailable',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
};

const WalletContext = createContext(null);

function getInjected() {
  return typeof window === 'undefined' ? undefined : window.ethereum;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState(WALLET_STATUS.DISCONNECTED);
  const [error, setError] = useState(null);

  useEffect(() => {
    const injected = getInjected();
    if (!injected) {
      setStatus(WALLET_STATUS.UNAVAILABLE);
      return undefined;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const [accounts, hexChainId] = await Promise.all([
          injected.request({ method: 'eth_accounts' }),
          injected.request({ method: 'eth_chainId' }),
        ]);
        if (cancelled) return;
        setChainId(parseInt(hexChainId, 16));
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setStatus(WALLET_STATUS.CONNECTED);
        }
      } catch (err) {
        if (!cancelled) setStatus(WALLET_STATUS.DISCONNECTED);
      }
    };

    restoreSession();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance(null);
        setStatus(WALLET_STATUS.DISCONNECTED);
        return;
      }
      setAccount(accounts[0]);
      setStatus(WALLET_STATUS.CONNECTED);
    };

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16));
    };

    injected.on('accountsChanged', handleAccountsChanged);
    injected.on('chainChanged', handleChainChanged);

    return () => {
      cancelled = true;
      injected.removeListener('accountsChanged', handleAccountsChanged);
      injected.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  useEffect(() => {
    const injected = getInjected();
    if (!account || !injected) {
      setBalance(null);
      return undefined;
    }

    let cancelled = false;
    new ethers.providers.Web3Provider(injected)
      .getBalance(account)
      .then((value) => {
        if (!cancelled) setBalance(ethers.utils.formatEther(value));
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });

    return () => {
      cancelled = true;
    };
  }, [account, chainId]);

  const connect = useCallback(async () => {
    const injected = getInjected();
    if (!injected) {
      setStatus(WALLET_STATUS.UNAVAILABLE);
      return;
    }

    setError(null);
    setStatus(WALLET_STATUS.CONNECTING);

    try {
      const accounts = await injected.request({ method: 'eth_requestAccounts' });
      const hexChainId = await injected.request({ method: 'eth_chainId' });
      setAccount(accounts[0]);
      setChainId(parseInt(hexChainId, 16));
      setStatus(WALLET_STATUS.CONNECTED);
    } catch (err) {
      setStatus(WALLET_STATUS.DISCONNECTED);
      setError(err.code === 4001 ? 'Connection request rejected.' : err.message);
    }
  }, []);

  // Injected wallets expose no disconnect RPC; this clears app state only.
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setError(null);
    setStatus(WALLET_STATUS.DISCONNECTED);
  }, []);

  const getProvider = useCallback(() => {
    const injected = getInjected();
    return injected ? new ethers.providers.Web3Provider(injected) : null;
  }, []);

  const value = useMemo(
    () => ({
      account,
      chainId,
      balance,
      status,
      error,
      isConnected: status === WALLET_STATUS.CONNECTED,
      connect,
      disconnect,
      getProvider,
    }),
    [account, chainId, balance, status, error, connect, disconnect, getProvider]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
