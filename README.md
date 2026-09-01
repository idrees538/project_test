<!-- ⚠️ Best viewed in VS Code Markdown Preview -->
<!-- In GitHub this file may look unformatted or misaligned -->

<div align="center" style="font-size:28px; font-weight:700; color:#4ec9b0;">
✨ RentVerse ✨
</div>

---

<div align="center" style="font-size:18px; font-weight:700; color:#aaaaaa;">
RentVerse is a modern real estate investment platform that combines traditional property investing with cryptocurrency payments. Built with React and Tailwind CSS, it mirrors the functionality of Arrived.com while adding blockchain-based transaction capabilities.
</div>

---
![Dashboard Overview](public/home.jpg)
---

# 🌐 RentVerse Demo
---

RentVerse is a demo platform showcasing a next-generation real-estate experience powered by cryptocurrency payments, interactive 3D property visualization, and a fully responsive, component-driven architecture.

---

## ✨ Key Features

- 💱 Cryptocurrency-enabled property transactions  
- 📱 Mobile-responsive interface  
- 🔍 SEO-optimized architecture  
- 📊 Real-time market data integration  
- 🏡 Interactive 3D property visualization  
- 🔗 Smart contract integration for secure blockchain transactions  

---

![Dashboard Overview](public/client.png)
---

## 🧩 Core Pages and Components

### 1. 🏠 Home Page
- Hero section with value proposition  
- Featured properties grid  
- “Why Choose Us” crypto benefits section  
- Step-by-step investment guide  
- Latest blog previews  
- Community section  

### 2. 🏘️ Properties Page
- Searchable and filterable property grid  
- Advanced search options  
- Detailed property cards  
- Three.js-powered 3D viewer  

### 3. 👥 About Us Page
- Mission and vision overview  
- Team member profiles  
- Platform statistics and milestones  

### 4. ✍️ Blog Section
- Category-based filtering  
- Blog search functionality  
- Author profiles  
- Social sharing options  

---

## 🧱 Development Guidelines

### 🧩 Component Standards
- Follow atomic design principles  
- Use TypeScript for type safety  
- Apply Tailwind breakpoints for responsiveness  
- Add comments and maintain documentation  

### 🔧 State Management
- React Context for shared global state  
- Redux for complex or multi-layered data flows  
- Minimal local component state  

### 🔐 Security Practices
- Validate all user inputs  
- Secure wallet connection handling  
- Follow blockchain transaction best practices  
- Run regular dependency and security audits  

---

## 🤝 Contributing

We welcome contributions! Please follow the workflow below:

1. 📌 Create a new feature branch  
2. 🧪 Write tests for added functionality  
3. 📝 Document new or updated features  
4. 🎯 Maintain consistent coding style  
5. 🔁 Submit a pull request with a clear description  

---

## 🙏 Acknowledgments

Inspired by Arrived.com and supported by the open-source work of the React and Tailwind CSS communities.

---

# How to run the project

## Clone

```
   git clone https://github.com/worksource-02/test_project.git
```

## Change directory

```
   cd test_project
```

## Install dependencies

```
   npm install
```

## Run on localhost

```
   npm start
```

---

# Smart Contract API

A backend layer that reads on-chain state and prepares contract transactions for
the `RealEstate` (ERC-721) and `Escrow` contracts in `contracts/`.

## Running it

```
npm install
```

Then two terminals:

```
# terminal 1 - local chain on :8545 (chainId 31337), leave running
npm run chain

# terminal 2 - compile, deploy and seed the contracts
npm run chain:deploy

# terminal 2 - API on :3099 and the React app on :3000
npm start
```

`npm run chain:deploy` compiles from `contracts/`, deploys both contracts, mints
three properties, and lists token 1 for 20 ETH with a 5 ETH earnest deposit. It
assigns seller / buyer / inspector / lender from the node's unlocked accounts
using `provider.getSigner(i)`, so **no private key exists anywhere in this
repository**. The resulting addresses and ABIs are written to
`deployments/localhost.json`, which the API reads at startup.

If you skip a step the API says so rather than failing opaquely: an unreachable
node returns `503 NODE_UNREACHABLE`, and contracts that were never deployed
return `503` naming the command to run.

`npm run api:smoke` runs a 17-case integration suite against the live chain.

### Trying the deposit flow in the browser

The Escrow panel on a property page reads live contract state, and its deposit
button walks the full path: API prepares an unsigned transaction, MetaMask signs
it, the chain executes it.

To use it, point MetaMask at the local chain:

1. Add a network - RPC `http://127.0.0.1:8545`, chain ID `31337`, currency `ETH`
2. Import **Account #1** using the private key that `npm run chain` prints on
   startup. That account is the designated buyer for token 1; the deposit button
   stays disabled for anyone else, mirroring the API's `403`.
3. Open `/properties/1` and connect

Hardhat's dev accounts are publicly known and only exist on your local node -
never reuse them anywhere else.

## Architecture

```
routes/contractRoute.js          HTTP surface + module-scoped error handler
  └─ middlewares/validator       input validation, rejects before any RPC call
      └─ controllers             request/response only, no ethers imports
          └─ services/blockchain domain logic
              ├─ provider.js         one JsonRpcProvider
              ├─ contractRegistry.js address + ABI resolution
              ├─ realEstateService
              └─ escrowService
```

Each layer knows only the one below it. Controllers never import `ethers`, so the
chain client can be swapped without touching the HTTP layer.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/contracts/health` | chain id, block height, configured addresses |
| GET | `/api/contracts/collection` | NFT name, symbol, total supply |
| GET | `/api/contracts/properties` | paginated tokens (`?page=&limit=`) |
| GET | `/api/contracts/properties/:tokenId` | owner + tokenURI |
| GET | `/api/contracts/escrow` | escrow roles and held balance |
| GET | `/api/contracts/escrow/:tokenId` | listing state, price, earnest amount |
| GET | `/api/contracts/escrow/:tokenId/approvals` | per-party approval state |
| POST | `/api/contracts/escrow/:tokenId/prepare/deposit-earnest` | unsigned deposit tx |
| POST | `/api/contracts/escrow/:tokenId/prepare/approve-sale` | unsigned approval tx |

## Design decisions

**The API never signs.** Write endpoints are named `prepare/*` because they return
an unsigned transaction for the caller's wallet to sign:

```json
{
  "method": "depositEarnest",
  "transaction": {
    "chainId": 31337,
    "from": "0x7099...79C8",
    "to": "0xDc64...F6C9",
    "data": "0xe740f770...0001",
    "value": "5000000000000000000"
  },
  "gasLimit": "25874"
}
```

A backend that signs on behalf of users is a custody service — a different
product with a different regulatory and security posture. Preparing transactions
keeps the private key in the user's wallet while still centralising encoding,
gas estimation and precondition checks.

**Preconditions are enforced server-side before preparing.** Depositing earnest on
an unlisted token returns 409; a caller who is not the designated buyer gets 403.
The contract would revert anyway, but failing early costs the user nothing and
returns a usable error instead of an opaque revert.

**Amounts are returned as both wei and ether.** `BigNumber` does not survive
`JSON.stringify` usefully, so every amount is `{ wei, ether }` — an exact integer
string for computation and a formatted value for display. No float ever touches
a token amount.

**Reads are cached with a short TTL** (`CONTRACT_CACHE_TTL_MS`, default 5s).
Listing properties is N+1 calls by nature — `totalSupply` then `ownerOf`/`tokenURI`
per token — so an in-memory TTL cache keeps a page refresh from hammering the node.
At real scale this becomes an indexer or event-log projection rather than
per-request RPC fan-out; the cache is the seam where that would slot in.

**Errors map to a single envelope.** `{ success: false, error: { code, message } }`.
The module owns its own error middleware, so ethers failure modes are translated at
the boundary: `CALL_EXCEPTION` → 400 `CONTRACT_CALL_REVERTED`, an unreachable node →
503 `NODE_UNREACHABLE`, timeouts → 504. 500s are logged server-side and returned
without internals.

**Configuration is layered.** Addresses and ABIs come from
`deployments/localhost.json`, overridable per-contract by environment variable. The
server has no knowledge of Hardhat's artifact layout, so the same code targets a
testnet by pointing `RPC_URL` and the address variables elsewhere.

## Known scope limits

- Read-only plus transaction preparation; no transaction broadcasting or receipt tracking.
- No event indexing. Property listings are fetched per request rather than projected
  from `Transfer` logs, which is the right answer beyond a few hundred tokens.
- `RealEstate.sol` uses OpenZeppelin's `Counters`, removed in OZ v5, so the project
  pins `@openzeppelin/contracts@^4.9.6`.
- Wallet connection uses the injected EIP-1193 provider directly. EIP-6963
  multi-provider discovery was deliberately left out; it only matters when several
  wallet extensions compete for `window.ethereum`.
