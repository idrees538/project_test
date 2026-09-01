const { ethers } = require("ethers");
const config = require("../../config/blockchain");
const ErrorHandler = require("../../utils/errorHandler");
const { getProvider } = require("./provider");

const instances = new Map();

function getContract(name) {
  if (instances.has(name)) return instances.get(name);

  const entry = config.contracts[name];
  if (!entry || !entry.address) {
    throw new ErrorHandler(
      `Contract "${name}" is not configured. Run "npm run chain:deploy" to generate ${config.deploymentPath}, or set its address in the environment.`,
      503
    );
  }

  const contract = new ethers.Contract(entry.address, entry.abi, getProvider());
  instances.set(name, contract);
  return contract;
}

function listConfigured() {
  return Object.entries(config.contracts)
    .filter(([, entry]) => entry && entry.address)
    .map(([name, entry]) => ({ name, address: entry.address }));
}

module.exports = { getContract, listConfigured };
