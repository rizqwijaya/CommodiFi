// Shared row shape for indexed/scanned on-chain events. Kept separate from db.ts
// so the serverless scan path (Netlify Functions) can import it without pulling
// in node:sqlite (which opens a DB file on import).
export interface EventRow {
  type: "Deposit" | "Redeem" | "Transfer" | "PriceUpdate";
  token: string | null;
  from_addr: string | null;
  to_addr: string | null;
  amount: string | null;
  price: string | null;
  reserve: string | null;
  block_number: number;
  block_time: number | null;
  tx_hash: string;
  log_index: number;
}
