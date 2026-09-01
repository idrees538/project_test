import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { FiCheckCircle, FiExternalLink, FiRefreshCw, FiXCircle } from "react-icons/fi";
import { contractsApi } from "../../lib/api";
import { useWallet } from "../../context/WalletContext";
import { shortenAddress } from "../../lib/chains";

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-secondary-500">{label}</span>
      <span className="font-medium text-secondary-800">{children}</span>
    </div>
  );
}

function Flag({ on, children }) {
  return (
    <span className={`inline-flex items-center ${on ? "text-green-600" : "text-secondary-500"}`}>
      {on ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
      {children}
    </span>
  );
}

function EscrowPanel({ tokenId = 1 }) {
  const { account, isConnected } = useWallet();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setListing(await contractsApi.listing(tokenId));
      setError(null);
    } catch (err) {
      setError(err.message);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    load();
  }, [load]);

  const depositEarnest = async () => {
    setSubmitting(true);
    setError(null);
    setTxHash(null);

    try {
      const { transaction, gasLimit } = await contractsApi.prepareDepositEarnest(
        tokenId,
        account
      );

      const params = {
        from: transaction.from,
        to: transaction.to,
        data: transaction.data,
        value: ethers.utils.hexValue(ethers.BigNumber.from(transaction.value)),
      };
      if (gasLimit) {
        params.gas = ethers.utils.hexValue(ethers.BigNumber.from(gasLimit));
      }

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [params],
      });

      setTxHash(hash);
      await load();
    } catch (err) {
      setError(err.code === 4001 ? "Transaction rejected in wallet." : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isBuyer =
    isConnected &&
    listing &&
    listing.buyer &&
    listing.buyer.toLowerCase() === account.toLowerCase();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">On-Chain Escrow</h3>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh escrow state"
          className="p-1.5 rounded-md text-secondary-500 hover:text-primary-600"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !listing && (
        <p className="text-sm text-secondary-500">Reading contract state…</p>
      )}

      {!loading && !listing && (
        <p className="text-sm text-secondary-500">
          Contract data unavailable. Start the local chain with{" "}
          <code className="font-mono text-xs">npm run chain</code> and deploy with{" "}
          <code className="font-mono text-xs">npm run chain:deploy</code>.
        </p>
      )}

      {listing && (
        <>
          <Row label="Token">#{listing.tokenId}</Row>
          <Row label="Status">
            <Flag on={listing.isListed}>{listing.isListed ? "Listed" : "Not listed"}</Flag>
          </Row>
          <Row label="Purchase price">{listing.purchasePrice.ether} ETH</Row>
          <Row label="Earnest deposit">{listing.escrowAmount.ether} ETH</Row>
          <Row label="Buyer">
            {listing.buyer ? shortenAddress(listing.buyer) : "—"}
          </Row>
          <Row label="Inspection">
            <Flag on={listing.inspectionPassed}>
              {listing.inspectionPassed ? "Passed" : "Pending"}
            </Flag>
          </Row>

          <button
            type="button"
            onClick={depositEarnest}
            disabled={!isBuyer || submitting || !listing.isListed}
            className="btn w-full justify-center mt-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Confirm in wallet…"
              : `Deposit ${listing.escrowAmount.ether} ETH Earnest`}
          </button>

          {!isConnected && (
            <p className="mt-2 text-xs text-secondary-500">
              Connect your wallet to deposit.
            </p>
          )}
          {isConnected && !isBuyer && listing.buyer && (
            <p className="mt-2 text-xs text-secondary-500">
              Only {shortenAddress(listing.buyer)} is the designated buyer for this token.
            </p>
          )}
        </>
      )}

      {txHash && (
        <p className="mt-3 flex items-center text-xs text-green-700">
          <FiExternalLink className="mr-1.5" />
          Deposit confirmed: <span className="ml-1 font-mono">{shortenAddress(txHash, 6)}</span>
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}

export default EscrowPanel;
