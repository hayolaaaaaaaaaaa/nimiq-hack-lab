import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzle, replay } from "./index.js";

test("same seed creates the same puzzle", () => {
  assert.deepEqual(createPuzzle("sequence", "abc"), createPuzzle("sequence", "abc"));
  assert.notDeepEqual(createPuzzle("nim-pin", "abc"), createPuzzle("nim-pin", "def"));
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
