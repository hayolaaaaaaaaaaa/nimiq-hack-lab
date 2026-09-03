import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Database from "better-sqlite3";
import { createHmac, randomBytes } from "node:crypto";
import { Address, Hash, PublicKey, Signature } from "@nimiq/core";
import { createPuzzle, dailyGame, replay, type GameEvent, type RankedGameId } from "../packages/game-core/index.js";

const app = new Hono();
const db = new Database(process.env.DATABASE_FILE || "arcade.sqlite");
const sessionSecret = process.env.SESSION_SECRET || "development-only-change-me";
const dailySecret = process.env.DAILY_SECRET || "development-daily-secret";
const rankedGames = new Set<RankedGameId>(["nim-pin", "sequence", "memory"]);
const gameLimits: Record<RankedGameId, number> = { "nim-pin": 12000, sequence: 7000, memory: 2500 };

db.exec(`
CREATE TABLE IF NOT EXISTS addresses (address TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_nonces (nonce TEXT PRIMARY KEY, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, address TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, address TEXT NOT NULL, game_id TEXT NOT NULL, mode TEXT NOT NULL, day TEXT, seed TEXT NOT NULL, started_at TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT);
CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT NOT NULL, game_id TEXT NOT NULL, mode TEXT NOT NULL, day TEXT, score INTEGER NOT NULL, xp INTEGER NOT NULL, duration_ms INTEGER NOT NULL, run_id TEXT UNIQUE, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS scores_daily_unique ON scores(address, game_id, day) WHERE mode = 'daily';
`);

const now = () => Date.now();
const iso = (value: number) => new Date(value).toISOString();
const json = (value: unknown) => JSON.stringify(value);
const text = (value: string) => new TextEncoder().encode(value);
const cookie = (name: string, value: string, maxAge: number) => `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
const signSession = (id: string) => createHmac("sha256", sessionSecret).update(id).digest("hex");
const seedFor = (day: string, gameId: string) => createHmac("sha256", dailySecret).update(`${day}:${gameId}`).digest("hex").slice(0, 32);

function verifyNimiqMessage(message: string, signer: string, publicKeyHex: string, signatureHex: string) {
  const publicKey = PublicKey.deserialize(Buffer.from(publicKeyHex, "hex"));
  const signature = Signature.deserialize(Buffer.from(signatureHex, "hex"));
  const payload = text(`\x16Nimiq Signed Message:\n${message.length}${message}`);
  if (!publicKey.verify(signature, Hash.computeSha256(payload))) return false;
  const derived = Address.fromPublicKeys([publicKey], 1).toUserFriendlyAddress().split(" ").join("").toUpperCase();
  return derived === signer.split(" ").join("").toUpperCase();
}

function sessionAddress(c: any) {
  const raw = c.req.header("Cookie")?.match(/arcade_session=([^;]+)/)?.[1];
  if (!raw) return null;
  const [id, mac] = raw.split(".");
  if (!id || mac !== signSession(id)) return null;
  const row = db.prepare("SELECT address, expires_at FROM sessions WHERE id = ?").get(id) as { address: string; expires_at: string } | undefined;
  if (!row || Date.parse(row.expires_at) <= now()) return null;
  return row.address;
}

app.use("/*", cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.get("/health", c => c.json({ ok: true }));
app.post("/auth/nonce", c => {
  const nonce = randomBytes(32).toString("hex");
  const expires = now() + 5 * 60_000;
  db.prepare("INSERT INTO login_nonces VALUES (?, ?, ?, NULL)").run(nonce, iso(now()), iso(expires));
  return c.json({ nonce, exp: Math.floor(expires / 1000), message: `NIM-LAB LOGINv1\nnonce:${nonce}\nexp:${Math.floor(expires / 1000)}` });
});
app.post("/auth/verify", async c => {
  const body = await c.req.json<{ message?: string; signer?: string; signerPublicKey?: string; signature?: string }>();
  if (!body.message || !body.signer || !body.signerPublicKey || !body.signature) return c.json({ error: "complete signed login required" }, 400);
  const nonce = body.message.match(/^NIM-LAB LOGINv1\nnonce:([0-9a-f]{64})\nexp:(\d+)$/);
  const row = nonce ? db.prepare("SELECT * FROM login_nonces WHERE nonce = ?").get(nonce[1]) as any : undefined;
  if (!row || row.consumed_at || Date.parse(row.expires_at) <= now() || Number(nonce?.[2]) !== Math.floor(Date.parse(row.expires_at) / 1000)) return c.json({ error: "invalid or expired nonce" }, 401);
  try {
    if (!verifyNimiqMessage(body.message, body.signer, body.signerPublicKey, body.signature)) return c.json({ error: "invalid signature" }, 401);
  } catch { return c.json({ error: "invalid signature encoding" }, 401); }
  db.prepare("UPDATE login_nonces SET consumed_at = ? WHERE nonce = ? AND consumed_at IS NULL").run(iso(now()), nonce![1]);
  const address = body.signer.split(" ").join("").toUpperCase();
  db.prepare("INSERT OR IGNORE INTO addresses VALUES (?, ?)").run(address, iso(now()));
  const id = randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(id, address, iso(now() + 30 * 24 * 60 * 60_000));
  c.header("Set-Cookie", cookie("arcade_session", `${id}.${signSession(id)}`, 30 * 24 * 60 * 60));
  return c.json({ address });
});
app.get("/daily", c => { const day = new Date().toISOString().slice(0, 10); return c.json({ day, gameId: dailyGame(day), startsAt: `${day}T00:00:00.000Z`, endsAt: `${new Date(Date.parse(`${day}T00:00:00.000Z`) + 86_400_000).toISOString()}` }); });
app.post("/runs", async c => {
  const address = sessionAddress(c); if (!address) return c.json({ error: "ranked session required" }, 401);
  const body = await c.req.json<{ gameId?: RankedGameId; mode?: "daily" | "ranked" | "practice" }>();
  if (!body.gameId || !rankedGames.has(body.gameId) || !body.mode) return c.json({ error: "game is not ranked-capable" }, 400);
  const day = new Date().toISOString().slice(0, 10);
  if (body.mode === "daily" && dailyGame(day) !== body.gameId) return c.json({ error: "not today's daily game" }, 409);
  if (body.mode === "daily" && db.prepare("SELECT 1 FROM scores WHERE address = ? AND game_id = ? AND day = ? AND mode = 'daily'").get(address, body.gameId, day)) return c.json({ error: "daily attempt already used" }, 409);
  const id = randomBytes(16).toString("hex"); const started = now(); const expires = started + gameLimits[body.gameId] + 15_000;
  const seed = body.mode === "daily" ? seedFor(day, body.gameId) : randomBytes(16).toString("hex");
  db.prepare("INSERT INTO runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)").run(id, address, body.gameId, body.mode, body.mode === "daily" ? day : null, seed, iso(started), iso(expires));
  return c.json({ runId: id, seed, gameId: body.gameId, mode: body.mode, expiresAt: iso(expires) });
});
app.post("/runs/:id/submit", async c => {
  const address = sessionAddress(c); if (!address) return c.json({ error: "ranked session required" }, 401);
  const run = db.prepare("SELECT * FROM runs WHERE id = ? AND address = ?").get(c.req.param("id"), address) as any;
  if (!run) return c.json({ error: "run not found" }, 404); if (run.consumed_at) return c.json({ error: "run already submitted" }, 409); if (Date.parse(run.expires_at) < now()) return c.json({ error: "run expired" }, 410);
  const claimed = db.prepare("UPDATE runs SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL").run(iso(now()), run.id); if (!claimed.changes) return c.json({ error: "run already submitted" }, 409);
  const body = await c.req.json<{ events?: GameEvent[] }>(); const events = body.events || []; const duration = events.length ? events[events.length - 1].t : 0;
  const serverDuration = now() - Date.parse(run.started_at);
  if (serverDuration < 100 || serverDuration > gameLimits[run.game_id as RankedGameId] + 15_000) return c.json({ error: "invalid server duration" }, 400);
  if (duration > gameLimits[run.game_id as RankedGameId]) return c.json({ error: "run duration exceeded" }, 400);
  const result = replay(run.game_id, run.seed, events);
  if (!result.valid) return c.json({ error: result.reason || "invalid replay" }, 400);
  if (run.mode === "practice") return c.json({ score: result.score, xp: result.xp, ranked: false });
  const created = iso(now());
  try { db.prepare("INSERT INTO scores(address, game_id, mode, day, score, xp, duration_ms, run_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(address, run.game_id, run.mode, run.day, result.score, result.xp, duration, run.id, created); } catch { return c.json({ error: "daily score already exists" }, 409); }
  return c.json({ score: result.score, xp: result.xp, rank: null, best: result.score });
});
app.get("/leaderboard", c => { const game = c.req.query("game"); const mode = c.req.query("period") === "daily" ? "daily" : "all"; if (!game) return c.json([]); const rows = mode === "daily" ? db.prepare("SELECT address, score, created_at FROM scores WHERE game_id = ? AND mode = 'daily' ORDER BY score DESC, created_at ASC LIMIT 50").all(game) : db.prepare("SELECT address, MAX(score) AS score, MIN(created_at) AS created_at FROM scores WHERE game_id = ? AND mode IN ('daily','ranked') GROUP BY address ORDER BY score DESC, created_at ASC LIMIT 50").all(game); return c.json(rows); });
app.get("/me", c => { const address = sessionAddress(c); if (!address) return c.json({ address: null, xp: 0, streak: 0 }); const xp = db.prepare("SELECT COALESCE(SUM(xp), 0) AS xp FROM scores WHERE address = ? AND mode IN ('daily','ranked')").get(address) as any; return c.json({ address, xp: xp.xp, streak: 0 }); });

if (process.env.NODE_ENV !== "test") serve({ fetch: app.fetch, port: Number(process.env.PORT || 8787) });
export default app;
