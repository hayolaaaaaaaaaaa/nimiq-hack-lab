import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzle, dailyGame, replay } from "./index.js";

test("same seed creates the same puzzle", () => {
  assert.deepEqual(createPuzzle("sequence", "abc"), createPuzzle("sequence", "abc"));
  assert.notDeepEqual(createPuzzle("nim-pin", "abc"), createPuzzle("nim-pin", "def"));
});

test("daily rotation always selects a ranked challenge", () => {
  const ranked = new Set(["nim-pin", "sequence", "memory", "nim-lock", "vault", "node-breach"]);
  for (const day of ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) assert.equal(ranked.has(dailyGame(day)), true);
});

test("replay accepts a valid sequence and computes its own score", () => {
  const puzzle = createPuzzle("sequence", "abc");
  assert.equal(puzzle.gameId, "sequence");
  if (puzzle.gameId !== "sequence") return;
  const events = puzzle.sequence.map((value: string, index: number) => ({ t: (index + 1) * 100, type: "key" as const, value }));
  const result = replay("sequence", "abc", events);
  assert.equal(result.valid, true);
  assert.equal(result.score, 2900);
});

test("replay rejects wrong and superhuman runs", () => {
  const puzzle = createPuzzle("nim-pin", "abc");
  if (puzzle.gameId !== "nim-pin") return;
  const wrong = replay("nim-pin", "abc", [{ t: 100, type: "key", value: "0000" }]);
  assert.equal(wrong.valid, false);
  const fast = replay("nim-pin", "abc", [{ t: 10, type: "key", value: puzzle.pin }]);
  assert.equal(fast.valid, false);
});

test("replay validates seeded locks and node breach", () => {
  const lock = createPuzzle("nim-lock", "lock-seed");
  assert.equal(lock.gameId, "nim-lock");
  if (lock.gameId === "nim-lock") {
    const events = lock.targetAngles.map((angle, index) => ({ t: (index + 1) * 120, type: "choice" as const, value: String(index) }));
    let time = 0;
    const solvedEvents = lock.targetAngles.flatMap((angle, index) => Array.from({ length: angle / 45 || 8 }, () => ({ t: (time += 100), type: "choice" as const, value: String(index) })));
    assert.equal(replay("nim-lock", "lock-seed", solvedEvents).valid, true);
    assert.equal(events.length, 4);
  }
  const breach = createPuzzle("node-breach", "breach-seed");
  if (breach.gameId === "node-breach") {
    const events = breach.sequence.map((value, index) => ({ t: (index + 1) * 100, type: "key" as const, value }));
    assert.equal(replay("node-breach", "breach-seed", events).valid, true);
  }
});
