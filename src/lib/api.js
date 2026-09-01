const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3099";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}/api/contracts${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || !payload.success) {
    const detail = payload && payload.error;
    const error = new Error(
      detail ? detail.message : `Request failed with status ${response.status}`
    );
    error.code = detail ? detail.code : "NETWORK_ERROR";
    throw error;
  }

  return payload.data;
}

export const contractsApi = {
  health: () => request("/health"),
  collection: () => request("/collection"),
  properties: (query = "") => request(`/properties${query}`),
  property: (tokenId) => request(`/properties/${tokenId}`),
  escrow: () => request("/escrow"),
  listing: (tokenId) => request(`/escrow/${tokenId}`),
  approvals: (tokenId) => request(`/escrow/${tokenId}/approvals`),
  prepareDepositEarnest: (tokenId, from) =>
    request(`/escrow/${tokenId}/prepare/deposit-earnest`, {
      method: "POST",
      body: JSON.stringify({ from }),
    }),
  prepareApproveSale: (tokenId, from) =>
    request(`/escrow/${tokenId}/prepare/approve-sale`, {
      method: "POST",
      body: JSON.stringify({ from }),
    }),
};
