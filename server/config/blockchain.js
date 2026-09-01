const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".config.env") });

const DEPLOYMENT_PATH =
  process.env.DEPLOYMENT_PATH ||
  path.join(__dirname, "..", "..", "deployments", "localhost.json");

function readDeployment() {
  try {
    return JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
  } catch (err) {
    return null;
  }
}

const deployment = readDeployment();

function contractEntry(name, addressOverride) {
  const entry = deployment && deployment.contracts && deployment.contracts[name];
  if (!entry) return null;
  return { address: addressOverride || entry.address, abi: entry.abi };
}

module.exports = {
  rpcUrl: process.env.RPC_URL || (deployment && deployment.rpcUrl) || "http://127.0.0.1:8545",
  chainId: Number(process.env.CHAIN_ID || (deployment && deployment.chainId) || 31337),
  rpcTimeoutMs: Number(process.env.RPC_TIMEOUT_MS || 10000),
  cacheTtlMs: Number(process.env.CONTRACT_CACHE_TTL_MS || 5000),
  deploymentPath: DEPLOYMENT_PATH,
  deploymentLoaded: Boolean(deployment),
  roles: (deployment && deployment.roles) || {},
  contracts: {
    RealEstate: contractEntry("RealEstate", process.env.REAL_ESTATE_ADDRESS),
    Escrow: contractEntry("Escrow", process.env.ESCROW_ADDRESS),
  },
};
