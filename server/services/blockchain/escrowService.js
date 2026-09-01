const { ethers } = require("ethers");
const config = require("../../config/blockchain");
const ErrorHandler = require("../../utils/errorHandler");
const TtlCache = require("../../utils/ttlCache");
const { getContract } = require("./contractRegistry");
const { getProvider } = require("./provider");

const cache = new TtlCache(config.cacheTtlMs);

function toAmount(value) {
  return { wei: value.toString(), ether: ethers.utils.formatEther(value) };
}

function normalise(address) {
  return address === ethers.constants.AddressZero ? null : address;
}

async function getEscrowInfo() {
  return cache.wrap("info", async () => {
    const contract = getContract("Escrow");
    const [nftAddress, seller, inspector, lender, balance] = await Promise.all([
      contract.nftAddress(),
      contract.seller(),
      contract.inspector(),
      contract.lender(),
      contract.getBalance(),
    ]);

    return {
      address: contract.address,
      nftAddress,
      seller,
      inspector,
      lender,
      balance: toAmount(balance),
    };
  });
}

async function getListing(tokenId) {
  return cache.wrap(`listing:${tokenId}`, async () => {
    const contract = getContract("Escrow");
    const [isListed, purchasePrice, escrowAmount, buyer, inspectionPassed] =
      await Promise.all([
        contract.isListed(tokenId),
        contract.purchasePrice(tokenId),
        contract.escrowAmount(tokenId),
        contract.buyer(tokenId),
        contract.inspectionPassed(tokenId),
      ]);

    return {
      tokenId,
      isListed,
      purchasePrice: toAmount(purchasePrice),
      escrowAmount: toAmount(escrowAmount),
      buyer: normalise(buyer),
      inspectionPassed,
    };
  });
}

async function getApprovals(tokenId) {
  const contract = getContract("Escrow");
  const [{ seller, lender }, listing] = await Promise.all([
    getEscrowInfo(),
    getListing(tokenId),
  ]);

  const parties = { seller, lender };
  if (listing.buyer) parties.buyer = listing.buyer;

  const entries = await Promise.all(
    Object.entries(parties).map(async ([role, address]) => [
      role,
      { address, approved: await contract.approval(tokenId, address) },
    ])
  );

  return { tokenId, approvals: Object.fromEntries(entries) };
}

// The API never signs. It returns an unsigned transaction for the caller's
// wallet to sign, so no private key ever reaches the server.
async function buildTransaction(method, args, from, value) {
  const contract = getContract("Escrow");
  const transaction = {
    chainId: config.chainId,
    from,
    to: contract.address,
    data: contract.interface.encodeFunctionData(method, args),
    value,
  };

  let gasLimit = null;
  try {
    const estimate = await getProvider().estimateGas(transaction);
    gasLimit = estimate.toString();
  } catch (err) {
    gasLimit = null;
  }

  return { method, args: args.map(String), transaction, gasLimit };
}

async function prepareDepositEarnest(tokenId, from) {
  const listing = await getListing(tokenId);

  if (!listing.isListed) {
    throw new ErrorHandler(`Token ${tokenId} is not listed for sale`, 409);
  }
  if (!listing.buyer || listing.buyer.toLowerCase() !== from.toLowerCase()) {
    throw new ErrorHandler(
      `Only the designated buyer (${listing.buyer}) can deposit earnest for token ${tokenId}`,
      403
    );
  }

  return buildTransaction(
    "depositEarnest",
    [tokenId],
    from,
    listing.escrowAmount.wei
  );
}

async function prepareApproveSale(tokenId, from) {
  const listing = await getListing(tokenId);

  if (!listing.isListed) {
    throw new ErrorHandler(`Token ${tokenId} is not listed for sale`, 409);
  }

  return buildTransaction("approveSale", [tokenId], from, "0");
}

module.exports = {
  getEscrowInfo,
  getListing,
  getApprovals,
  prepareDepositEarnest,
  prepareApproveSale,
};
