const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const { getNetworkStatus } = require("../services/blockchain/provider");
const { listConfigured } = require("../services/blockchain/contractRegistry");
const realEstateService = require("../services/blockchain/realEstateService");
const escrowService = require("../services/blockchain/escrowService");

const ok = (res, data) => res.status(200).json({ success: true, data });

exports.getHealth = asyncErrorHandler(async (req, res) => {
  const network = await getNetworkStatus();
  ok(res, { status: "ok", network, contracts: listConfigured() });
});

exports.getCollection = asyncErrorHandler(async (req, res) => {
  ok(res, await realEstateService.getCollection());
});

exports.listProperties = asyncErrorHandler(async (req, res) => {
  ok(res, await realEstateService.listProperties(req.pagination));
});

exports.getProperty = asyncErrorHandler(async (req, res) => {
  ok(res, await realEstateService.getProperty(req.tokenId));
});

exports.getEscrowInfo = asyncErrorHandler(async (req, res) => {
  ok(res, await escrowService.getEscrowInfo());
});

exports.getListing = asyncErrorHandler(async (req, res) => {
  ok(res, await escrowService.getListing(req.tokenId));
});

exports.getApprovals = asyncErrorHandler(async (req, res) => {
  ok(res, await escrowService.getApprovals(req.tokenId));
});

exports.prepareDepositEarnest = asyncErrorHandler(async (req, res) => {
  ok(res, await escrowService.prepareDepositEarnest(req.tokenId, req.body.from));
});

exports.prepareApproveSale = asyncErrorHandler(async (req, res) => {
  ok(res, await escrowService.prepareApproveSale(req.tokenId, req.body.from));
});
