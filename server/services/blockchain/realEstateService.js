const config = require("../../config/blockchain");
const ErrorHandler = require("../../utils/errorHandler");
const TtlCache = require("../../utils/ttlCache");
const { getContract } = require("./contractRegistry");

const cache = new TtlCache(config.cacheTtlMs);

async function getCollection() {
  return cache.wrap("collection", async () => {
    const contract = getContract("RealEstate");
    const [name, symbol, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
    ]);

    return {
      address: contract.address,
      name,
      symbol,
      totalSupply: totalSupply.toNumber(),
    };
  });
}

async function getProperty(tokenId) {
  const { totalSupply } = await getCollection();
  if (tokenId > totalSupply) {
    throw new ErrorHandler(`Token ${tokenId} does not exist`, 404);
  }

  return cache.wrap(`property:${tokenId}`, async () => {
    const contract = getContract("RealEstate");
    const [owner, tokenURI] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.tokenURI(tokenId),
    ]);

    return { tokenId, owner, tokenURI };
  });
}

async function listProperties({ page = 1, limit = 20 } = {}) {
  const { totalSupply } = await getCollection();
  const offset = (page - 1) * limit;
  const ids = Array.from({ length: totalSupply }, (_, index) => index + 1).slice(
    offset,
    offset + limit
  );

  const items = await Promise.all(ids.map((id) => getProperty(id)));

  return {
    items,
    pagination: {
      page,
      limit,
      total: totalSupply,
      totalPages: Math.max(1, Math.ceil(totalSupply / limit)),
    },
  };
}

module.exports = { getCollection, getProperty, listProperties };
