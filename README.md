# Nimiq Skill Arcade

An original Nimiq-themed competitive skill arcade.

Guest scores are local practice only. Ranked scores require a connected Nimiq address and a verified server submission; the current static build does not claim unverified scores are ranked.

The server foundation lives in `server/` and uses SQLite locally. It issues one-time login nonces, verifies Nimiq signatures, creates httpOnly sessions, issues server-owned run seeds, consumes runs once, replays submitted events, and stores only verified ranked scores. `NIM PIN`, `Key Sequence`, and `Address Memory` are the first replay-capable games; other games remain practice-only until validators are added.

## Included games

1. Block Rush — connected-block clearing
2. NIM Grid — reaction grid
3. NIM PIN — generated 4-digit code
4. Key Sequence — timed keyboard sequence
5. Address Memory — fictional address memory challenge
6. NIM Lock — four-ring timing lock
7. NIM Vault — five-ring advanced lock
8. Sync — timing challenge
9. Node Breach — hexadecimal packet reconstruction

## How to play

Open the app, choose a challenge, and complete it before its timer expires. Your best score and XP are saved in your browser.

- **Block Rush:** Click connected groups of three or more matching blocks. Larger groups score more.
- **NIM Grid:** Click the glowing node as it moves around the grid.
- **NIM PIN:** Enter the four-digit challenge code with the keypad.
- **Key Sequence:** Press the displayed letters in order. A wrong key ends the run.
- **Address Memory:** Memorize the six-part address, then rebuild it from the choices.
- **NIM Lock:** Click each ring to rotate it 45 degrees and align its marker.
- **NIM Vault:** Solve the five-ring version of NIM Lock before time runs out.
- **Sync:** Press **SYNC PACKET** while the moving cursor is inside the center target.
- **Node Breach:** Reconstruct the six-character hexadecimal packet before the timer expires.

Connecting a Nimiq wallet is optional. No private key or seed phrase is requested.

## Nimiq integration

- **Browser:** `@nimiq/hub-api` opens Nimiq Hub and requests a signed login message. The selected Nimiq address is returned as the operator identity.
- **Nimiq Pay:** `@nimiq/mini-app-sdk` uses the injected provider and calls `listAccounts()`.
- **Ranked scoring:** scores are not accepted directly from the client. A connected player receives a server-issued run containing a unique run ID and challenge seed. Ranked submissions are validated server-side from the recorded replay before being written to the leaderboard.

No private key or seed phrase is requested or exposed.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL.

To run the API locally in a second terminal:

```bash
npm run api
```

The API listens on `http://localhost:8787` by default. Its main routes are `POST /auth/nonce`, `POST /auth/verify`, `GET /daily`, `POST /runs`, `POST /runs/:id/submit`, `GET /leaderboard`, and `GET /me`.

## Nimiq Pay

Deploy the static Vite output (`dist/`) to a public HTTPS host, then register/use that URL as your Mini App according to the Nimiq Mini Apps documentation.

For local development inside Nimiq Pay, expose the Vite dev server over your LAN and use the appropriate Nimiq Pay development/testing flow.

## Next production milestones

- Server-backed leaderboard
- Daily challenge seed shared by all players
- Anti-cheat score verification
- Nimiq device identifier for leaderboard identity
- Signed score submissions
- TestAlbatross reward/tournament layer
- MainAlbatross rewards only after the reward economy and anti-cheat are audited
