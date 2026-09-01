export const CHAINS = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BNB Chain',
  137: 'Polygon',
  1337: 'Localhost',
  8453: 'Base',
  31337: 'Hardhat',
  42161: 'Arbitrum One',
  11155111: 'Sepolia',
};

export function getChainName(chainId) {
  if (!chainId) return null;
  return CHAINS[chainId] || `Chain ${chainId}`;
}

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function formatBalance(value, decimals = 4) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}
