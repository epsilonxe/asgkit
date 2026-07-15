const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

// Set (and always overwrite) an internal header carrying the real TCP peer
// address from this process's socket, so Route Handlers can read it without
// trusting anything the client itself sent (no x-forwarded-for spoofing
// risk, since there's no reverse proxy in this LAN deployment anyway).
const INTERNAL_IP_HEADER = "x-asgkit-internal-client-ip";

app.prepare().then(() => {
  createServer((req, res) => {
    req.headers[INTERNAL_IP_HEADER] = req.socket.remoteAddress || "";
    handle(req, res);
  }).listen(port, () => {
    console.log(`> asgkit ready on http://localhost:${port}`);
  });
});
