import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";
import type { EventRow } from "./types";

export type { EventRow } from "./types";

const dir = dirname(config.dbPath);
if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

export const db = new DatabaseSync(config.dbPath);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS cursor (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_block INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,              -- Deposit | Redeem | Transfer | PriceUpdate
    token TEXT,                      -- token address (lowercased), null for non-token events
    from_addr TEXT,
    to_addr TEXT,
    amount TEXT,                     -- uint256 as decimal string
    price TEXT,                      -- PriceUpdate only (8-dec USD as string)
    reserve TEXT,                    -- Deposit/Redeem newReserve
    block_number INTEGER NOT NULL,
    block_time INTEGER,              -- unix seconds
    tx_hash TEXT NOT NULL,
    log_index INTEGER NOT NULL,
    UNIQUE (tx_hash, log_index)
  );
  CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);
  CREATE INDEX IF NOT EXISTS idx_events_token ON events (token);
  CREATE INDEX IF NOT EXISTS idx_events_addr ON events (from_addr, to_addr);

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,             -- token address (lowercased)
    price TEXT NOT NULL,             -- 8-dec USD as string
    block_number INTEGER NOT NULL,
    block_time INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    UNIQUE (tx_hash, token)
  );
  CREATE INDEX IF NOT EXISTS idx_price_token ON price_history (token, block_time);
`);

export function getCursor(): bigint | null {
  const row = db.prepare("SELECT last_block FROM cursor WHERE id = 1").get() as
    | { last_block: number }
    | undefined;
  return row ? BigInt(row.last_block as number) : null;
}

export function setCursor(block: bigint): void {
  db.prepare(
    "INSERT INTO cursor (id, last_block) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET last_block = excluded.last_block",
  ).run(Number(block));
}


const insertEventStmt = db.prepare(`
  INSERT OR IGNORE INTO events
    (type, token, from_addr, to_addr, amount, price, reserve, block_number, block_time, tx_hash, log_index)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPriceStmt = db.prepare(`
  INSERT OR IGNORE INTO price_history (token, price, block_number, block_time, tx_hash)
  VALUES (?, ?, ?, ?, ?)
`);

export function insertEvents(rows: EventRow[]): void {
  db.exec("BEGIN");
  try {
    for (const r of rows) {
      insertEventStmt.run(
        r.type,
        r.token,
        r.from_addr,
        r.to_addr,
        r.amount,
        r.price,
        r.reserve,
        r.block_number,
        r.block_time,
        r.tx_hash,
        r.log_index,
      );
      if (r.type === "PriceUpdate" && r.token && r.price && r.block_time !== null) {
        insertPriceStmt.run(r.token, r.price, r.block_number, r.block_time, r.tx_hash);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function getPriceHistory(token: string, limit = 200): Array<{ price: string; time: number }> {
  return db
    .prepare(
      "SELECT price, block_time AS time FROM price_history WHERE token = ? ORDER BY block_time ASC LIMIT ?",
    )
    .all(token.toLowerCase(), limit) as unknown as Array<{ price: string; time: number }>;
}

export function getRecentEvents(filter: {
  token?: string;
  address?: string;
  limit?: number;
}): EventRow[] {
  const limit = filter.limit ?? 50;
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filter.token) {
    clauses.push("token = ?");
    params.push(filter.token.toLowerCase());
  }
  if (filter.address) {
    clauses.push("(from_addr = ? OR to_addr = ?)");
    params.push(filter.address.toLowerCase(), filter.address.toLowerCase());
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(limit);
  return db
    .prepare(`SELECT * FROM events ${where} ORDER BY block_number DESC, log_index DESC LIMIT ?`)
    .all(...(params as never[])) as unknown as EventRow[];
}
