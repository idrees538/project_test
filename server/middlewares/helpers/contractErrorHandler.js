const STATUS_TO_CODE = {
  400: "BAD_REQUEST",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
  504: "GATEWAY_TIMEOUT",
};

const ETHERS_CODE_TO_STATUS = {
  INVALID_ARGUMENT: 400,
  NUMERIC_FAULT: 400,
  CALL_EXCEPTION: 400,
  UNPREDICTABLE_GAS_LIMIT: 400,
  NETWORK_ERROR: 503,
  SERVER_ERROR: 503,
  ECONNREFUSED: 503,
  TIMEOUT: 504,
};

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || ETHERS_CODE_TO_STATUS[err.code] || 500;
  let message = err.message || "Unexpected error";
  let code = STATUS_TO_CODE[statusCode] || "INTERNAL_ERROR";

  if (["NETWORK_ERROR", "SERVER_ERROR", "ECONNREFUSED"].includes(err.code)) {
    statusCode = 503;
    code = "NODE_UNREACHABLE";
    message = "Unable to reach the blockchain node.";
  } else if (err.code === "CALL_EXCEPTION") {
    code = "CONTRACT_CALL_REVERTED";
    message = err.reason || "The contract call reverted.";
  }

  if (statusCode === 500) {
    console.error(`[contracts] ${req.method} ${req.originalUrl}`, err);
    message = "Unexpected error while talking to the blockchain.";
  }

  res.status(statusCode).json({ success: false, error: { code, message } });
};
