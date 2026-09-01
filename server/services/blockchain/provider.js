const { ethers } = require("ethers");
const config = require("../../config/blockchain");

let provider;

function getProvider() {
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider({
      url: config.rpcUrl,
      timeout: config.rpcTimeoutMs,
    });
  }
  return provider;
}

async function getNetworkStatus() {
  const active = getProvider();
  const [network, blockNumber] = await Promise.all([
    active.getNetwork(),
    active.getBlockNumber(),
  ]);

  return { rpcUrl: config.rpcUrl, chainId: network.chainId, blockNumber };
}

module.exports = { getProvider, getNetworkStatus };
