# Replay Protocol

A run is a sequence of events:

```ts
type GameEvent = { t: number; type: "key" | "choice"; value: string };
```

`t` is elapsed milliseconds from run start. The server rejects invalid timestamps, reordered events, impossible timing, invalid values, wrong solutions, expired runs, and reused run IDs.

The authoritative result is always calculated by `replay(gameId, seed, events)` in `packages/game-core`. The client preview is informational only.

When adding a ranked game:

1. Add deterministic puzzle generation.
2. Add strict event validation.
3. Add score and XP calculation on the server.
4. Add valid, invalid, timing, and replay-abuse tests.
5. Add the game to the server allowlist only after those tests pass.
