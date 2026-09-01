import { useEffect, useRef, useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { FiCheck, FiChevronDown, FiCopy, FiLogOut } from 'react-icons/fi';
import { useWallet, WALLET_STATUS } from '../../context/WalletContext';
import { formatBalance, getChainName, shortenAddress } from '../../lib/chains';

function WalletButton({ className = '', wrapperClassName = 'inline-block' }) {
  const { account, chainId, balance, status, error, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyAddress = () => {
    navigator.clipboard.writeText(account).then(() => setCopied(true));
  };

  if (status === WALLET_STATUS.UNAVAILABLE) {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className={`btn ${className}`}
        >
          <FaWallet className="mr-2" />
          Install MetaMask
        </a>
      </div>
    );
  }

  if (status !== WALLET_STATUS.CONNECTED) {
    return (
      <div className={`relative ${wrapperClassName}`} ref={containerRef}>
        <button
          type="button"
          onClick={connect}
          disabled={status === WALLET_STATUS.CONNECTING}
          className={`btn disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
          <FaWallet className="mr-2" />
          {status === WALLET_STATUS.CONNECTING ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {error && (
          <p className="absolute left-0 top-full z-50 mt-2 w-max max-w-xs rounded-md bg-red-50 px-3 py-2 text-left text-xs text-red-700 shadow-sm dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${wrapperClassName}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`btn ${className}`}
      >
        <FaWallet className="mr-2" />
        {shortenAddress(account)}
        <FiChevronDown className="ml-2" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-secondary-200 bg-white p-4 text-left shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-secondary-500 dark:text-secondary-400">Network</span>
            <span className="font-medium text-secondary-800 dark:text-secondary-100">
              {getChainName(chainId)}
            </span>
          </div>

          {balance !== null && (
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-secondary-500 dark:text-secondary-400">Balance</span>
              <span className="font-medium text-secondary-800 dark:text-secondary-100">
                {formatBalance(balance)} ETH
              </span>
            </div>
          )}

          <p className="mb-1 text-xs text-secondary-500 dark:text-secondary-400">Address</p>
          <p className="mb-3 break-all font-mono text-xs text-secondary-800 dark:text-secondary-100">
            {account}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyAddress}
              className="flex flex-1 items-center justify-center rounded-md border border-secondary-200 px-3 py-2 text-xs font-medium text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-700"
            >
              {copied ? <FiCheck className="mr-1.5" /> : <FiCopy className="mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="flex flex-1 items-center justify-center rounded-md border border-secondary-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-secondary-700 dark:text-red-400 dark:hover:bg-red-950"
            >
              <FiLogOut className="mr-1.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletButton;
