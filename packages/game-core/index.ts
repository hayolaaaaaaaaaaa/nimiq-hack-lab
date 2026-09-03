export type RankedGameId = "nim-pin" | "sequence" | "memory";
export type GameId = RankedGameId | "block-rush" | "nim-grid" | "nim-lock" | "vault" | "sync" | "node-breach";

export type GameEvent = { t: number; type: "key" | "choice"; value: string };
export type Puzzle =
  | { gameId: "nim-pin"; pin: string }
  | { gameId: "sequence"; sequence: string[] }
  | { gameId: "memory"; tokens: string[] };
export type ReplayResult = { score: number; xp: number; valid: boolean; reason?: string };

const sequenceChars = "QWERASD";
const memoryTokens = ["NQ", "7F", "3A", "C2", "91", "D8"];

function seeded(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function requireEvents(events: GameEvent[]) {
  if (!Array.isArray(events) || events.length === 0) return "no events";
  let previous = -1;
  for (const event of events) {
    if (!Number.isFinite(event.t) || event.t < 0 || event.t < previous) return "invalid event timing";
    previous = event.t;
  }
  return null;
}

export function createPuzzle(gameId: RankedGameId, seed: string): Puzzle {
  const random = seeded(`${gameId}:${seed}`);
  if (gameId === "nim-pin") {
    return { gameId, pin: String(Math.floor(random() * 9000) + 1000) };
  }
  if (gameId === "sequence") {
    return { gameId, sequence: Array.from({ length: 12 }, () => sequenceChars[Math.floor(random() * sequenceChars.length)]) };
  }
  return { gameId, tokens: Array.from({ length: 6 }, () => memoryTokens[Math.floor(random() * memoryTokens.length)]) };
}

export function replay(gameId: RankedGameId, seed: string, events: GameEvent[]): ReplayResult {
  const timingError = requireEvents(events);
  if (timingError) return { score: 0, xp: 0, valid: false, reason: timingError };
  const puzzle = createPuzzle(gameId, seed);
  const minimumGap = gameId === "sequence" ? 70 : 80;
  for (let index = 1; index < events.length; index += 1) {
    if (events[index].t - events[index - 1].t < minimumGap) return { score: 0, xp: 0, valid: false, reason: "events too fast" };
  }
  const values = events.map(event => event.value);
  const target = puzzle.gameId === "nim-pin" ? [puzzle.pin] : puzzle.gameId === "sequence" ? puzzle.sequence : puzzle.tokens;
  const valid = values.length === target.length && values.every((value, index) => value === target[index]);
  if (!valid) return { score: 0, xp: 0, valid: false, reason: "wrong solution" };
  const duration = events[events.length - 1].t;
  if (duration < target.length * minimumGap) return { score: 0, xp: 0, valid: false, reason: "duration below minimum" };
  const limit = gameId === "nim-pin" ? 12000 : gameId === "sequence" ? 7000 : 2500;
  const score = Math.max(100, Math.round((limit - duration) / (gameId === "sequence" ? 2 : 4)));
  return { score, xp: gameId === "sequence" ? 180 : gameId === "nim-pin" ? 125 : 160, valid: true };
}

export function dailyGame(day: string): RankedGameId {
  const rotation: RankedGameId[] = ["nim-pin", "sequence", "memory"];
  let value = 0;
  for (const character of day) value = (value * 31 + character.charCodeAt(0)) >>> 0;
  return rotation[value % rotation.length];
}
