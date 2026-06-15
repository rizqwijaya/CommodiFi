import { config } from "./config";
import { createServer } from "./server";
import { startIndexer } from "./indexer";

// Never let a stray rejection or async error take down the process (and, via the
// parallel dev runner, the web server with it). Log and keep serving.
process.on("unhandledRejection", (reason) => {
  console.error("[api] unhandledRejection:", reason instanceof Error ? reason.message : reason);
});
process.on("uncaughtException", (err) => {
  console.error("[api] uncaughtException:", err.message);
});

const app = createServer();

const server = app.listen(config.port, () => {
  console.log(`[api] CommodiFi REST API listening on http://localhost:${config.port}`);
  console.log(`[api] routes: GET /assets  /portfolio/:address  /price-history/:token  /events  /health`);
  startIndexer();
});

server.on("error", (err) => {
  console.error("[api] server error:", err.message);
});
