const { ethers } = require("ethers");
const ErrorHandler = require("../../utils/errorHandler");

exports.validateTokenId = (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.tokenId)) {
    return next(new ErrorHandler("tokenId must be a positive integer", 400));
  }
  req.tokenId = Number(req.params.tokenId);
  next();
};

exports.validateAddressBody = (field) => (req, res, next) => {
  const value = req.body && req.body[field];

  if (typeof value !== "string" || !ethers.utils.isAddress(value)) {
    return next(
      new ErrorHandler(`"${field}" must be a valid EVM address`, 400)
    );
  }

  req.body[field] = ethers.utils.getAddress(value);
  next();
};

exports.validatePagination = (req, res, next) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  if (!Number.isInteger(page) || page < 1) {
    return next(new ErrorHandler("page must be a positive integer", 400));
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return next(new ErrorHandler("limit must be an integer between 1 and 100", 400));
  }

  req.pagination = { page, limit };
  next();
};
