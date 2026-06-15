import { config } from "./config";
import { createServer } from "./server";
import { startIndexer } from "./indexer";

const app = createServer();

app.listen(config.port, () => {
  console.log(`[api] CommodiFi REST API listening on http://localhost:${config.port}`);
  console.log(`[api] routes: GET /assets  /portfolio/:address  /price-history/:token  /events  /health`);
  startIndexer();
});
