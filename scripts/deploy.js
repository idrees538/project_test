const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'deployments', 'localhost.json');

const PROPERTIES = [
  'ipfs://rentverse/luxury-downtown-apartment.json',
  'ipfs://rentverse/modern-tech-district-complex.json',
  'ipfs://rentverse/waterfront-residential-tower.json',
];

function loadArtifact(name) {
  const file = path.join(ROOT, 'artifacts', 'contracts', `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Artifact for ${name} not found. Run "npm run chain:compile" first.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function deploy(name, signer, args) {
  const artifact = loadArtifact(name);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  console.log(`  ${name.padEnd(12)} ${contract.address}`);
  return { contract, abi: artifact.abi };
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const accounts = await provider.listAccounts();
  if (accounts.length < 4) {
    throw new Error(`Need at least 4 unlocked accounts, node returned ${accounts.length}.`);
  }

  const [seller, buyer, inspector, lender] = accounts;
  const deployer = provider.getSigner(0);
  const { chainId } = await provider.getNetwork();

  console.log(`\nDeploying to ${RPC_URL} (chainId ${chainId})\n`);

  const realEstate = await deploy('RealEstate', deployer, []);

  const tokenIds = [];
  for (const uri of PROPERTIES) {
    const tx = await realEstate.contract.mint(uri);
    const receipt = await tx.wait();
    const transfer = receipt.events.find((e) => e.event === 'Transfer');
    tokenIds.push(transfer.args.tokenId.toNumber());
  }
  console.log(`  minted       tokens ${tokenIds.join(', ')}`);

  const escrow = await deploy('Escrow', deployer, [
    realEstate.contract.address,
    seller,
    inspector,
    lender,
  ]);

  const listedTokenId = tokenIds[0];
  const purchasePrice = ethers.utils.parseEther('20');
  const escrowAmount = ethers.utils.parseEther('5');

  await (await realEstate.contract.approve(escrow.contract.address, listedTokenId)).wait();
  await (
    await escrow.contract.list(listedTokenId, buyer, purchasePrice, escrowAmount)
  ).wait();
  console.log(`  listed       token ${listedTokenId} for ${ethers.utils.formatEther(purchasePrice)} ETH`);

  const deployment = {
    network: 'localhost',
    chainId,
    rpcUrl: RPC_URL,
    deployedAt: new Date().toISOString(),
    roles: { seller, buyer, inspector, lender },
    seed: {
      tokenIds,
      listedTokenId,
      purchasePriceWei: purchasePrice.toString(),
      escrowAmountWei: escrowAmount.toString(),
    },
    contracts: {
      RealEstate: { address: realEstate.contract.address, abi: realEstate.abi },
      Escrow: { address: escrow.contract.address, abi: escrow.abi },
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`\nWrote ${path.relative(ROOT, OUTPUT)}\n`);
}

main().catch((error) => {
  console.error(`\nDeploy failed: ${error.message}\n`);
  process.exit(1);
});
