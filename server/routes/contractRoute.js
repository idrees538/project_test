const express = require("express");
const {
  getHealth,
  getCollection,
  listProperties,
  getProperty,
  getEscrowInfo,
  getListing,
  getApprovals,
  prepareDepositEarnest,
  prepareApproveSale,
} = require("../controllers/contractController");
const {
  validateTokenId,
  validateAddressBody,
  validatePagination,
} = require("../middlewares/validator/contractValidator");
const contractErrorHandler = require("../middlewares/helpers/contractErrorHandler");

const router = express.Router();

router.route("/health").get(getHealth);

router.route("/collection").get(getCollection);
router.route("/properties").get(validatePagination, listProperties);
router.route("/properties/:tokenId").get(validateTokenId, getProperty);

router.route("/escrow").get(getEscrowInfo);
router.route("/escrow/:tokenId").get(validateTokenId, getListing);
router.route("/escrow/:tokenId/approvals").get(validateTokenId, getApprovals);

router
  .route("/escrow/:tokenId/prepare/deposit-earnest")
  .post(validateTokenId, validateAddressBody("from"), prepareDepositEarnest);

router
  .route("/escrow/:tokenId/prepare/approve-sale")
  .post(validateTokenId, validateAddressBody("from"), prepareApproveSale);

router.use(contractErrorHandler);

module.exports = router;
