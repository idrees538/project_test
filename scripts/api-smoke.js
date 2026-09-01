const http = require("http");
const app = require("../server/app");

const CASES = [
  { name: "health", method: "GET", path: "/api/contracts/health", expect: 200 },
  { name: "collection", method: "GET", path: "/api/contracts/collection", expect: 200 },
  { name: "properties", method: "GET", path: "/api/contracts/properties", expect: 200 },
  { name: "properties paginated", method: "GET", path: "/api/contracts/properties?page=1&limit=2", expect: 200 },
  { name: "property by id", method: "GET", path: "/api/contracts/properties/1", expect: 200 },
  { name: "property not found", method: "GET", path: "/api/contracts/properties/999", expect: 404 },
  { name: "property bad id", method: "GET", path: "/api/contracts/properties/abc", expect: 400 },
  { name: "bad pagination", method: "GET", path: "/api/contracts/properties?limit=500", expect: 400 },
  { name: "escrow info", method: "GET", path: "/api/contracts/escrow", expect: 200 },
  { name: "escrow listing", method: "GET", path: "/api/contracts/escrow/1", expect: 200 },
  { name: "escrow unlisted", method: "GET", path: "/api/contracts/escrow/2", expect: 200 },
  { name: "escrow approvals", method: "GET", path: "/api/contracts/escrow/1/approvals", expect: 200 },
  {
    name: "prepare deposit (buyer)",
    method: "POST",
    path: "/api/contracts/escrow/1/prepare/deposit-earnest",
    body: { from: process.env.BUYER_ADDRESS },
    expect: 200,
  },
  {
    name: "prepare deposit (wrong sender)",
    method: "POST",
    path: "/api/contracts/escrow/1/prepare/deposit-earnest",
    body: { from: "0x000000000000000000000000000000000000dEaD" },
    expect: 403,
  },
  {
    name: "prepare deposit (invalid address)",
    method: "POST",
    path: "/api/contracts/escrow/1/prepare/deposit-earnest",
    body: { from: "not-an-address" },
    expect: 400,
  },
  {
    name: "prepare deposit (unlisted token)",
    method: "POST",
    path: "/api/contracts/escrow/2/prepare/deposit-earnest",
    body: { from: process.env.BUYER_ADDRESS },
    expect: 409,
  },
  {
    name: "prepare approve sale",
    method: "POST",
    path: "/api/contracts/escrow/1/prepare/approve-sale",
    body: { from: process.env.BUYER_ADDRESS },
    expect: 200,
  },
];

function request(port, testCase) {
  return new Promise((resolve) => {
    const payload = testCase.body ? JSON.stringify(testCase.body) : null;
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: testCase.path,
        method: testCase.method,
        timeout: 15000,
        headers: payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "timeout" }); });
    req.on("error", (err) => resolve({ status: 0, body: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

const server = app.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  let failures = 0;

  for (const testCase of CASES) {
    const result = await request(port, testCase);
    const pass = result.status === testCase.expect;
    if (!pass) failures += 1;
    console.log(
      `${pass ? "PASS" : "FAIL"}  ${String(result.status).padEnd(3)} (want ${testCase.expect})  ${testCase.name}`
    );
    if (!pass) console.log(`      ${result.body.slice(0, 300)}`);
  }

  console.log(`\n${CASES.length - failures}/${CASES.length} passed`);
  server.close();
  process.exit(failures === 0 ? 0 : 1);
});
