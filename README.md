# OPERATOR

**Competitive skill challenges, powered by Nimiq.**

OPERATOR is a competitive skill platform where players enter short, high-pressure challenges, prove their ability, and climb verified rankings. It combines a premium command-center interface with Nimiq wallet identity and server-side replay validation.

## What it is

OPERATOR is a browser and Nimiq Pay skill platform. Each challenge is a fast test of memory, timing, sequence recognition, or precision. Players can practice locally as guests or connect a Nimiq wallet to enter ranked runs.

The product promise is simple: **don't just play. Prove it.**

## Why Nimiq

Nimiq provides a natural operator identity without passwords, seed phrases, or private keys entering the app. Hub and Nimiq Pay can sign one login nonce, allowing the API to verify who played while keeping score calculation on the server.

## How it works

```text
Connect Nimiq wallet
	-> sign one login nonce
	-> server verifies signature and creates an httpOnly session
	-> server issues a unique run ID and deterministic seed
	-> player submits replay events
	-> server replays the seed and computes the score
	-> verified result is stored in the rankings
```

The client never submits an authoritative score. It submits events from a server-issued run.

## 9 challenges

### Ranked runs

These challenges have deterministic seeded puzzles and server replay validators:

- **NIM PIN:** enter the seeded four-digit code.
- **Key Sequence:** enter the seeded signal in order.
- **Address Memory:** memorize and rebuild the seeded token pattern.
- **NIM Lock:** align four seeded rings.
- **NIM Vault:** solve the five-ring variant with a tighter time limit.
- **Node Breach:** reconstruct the seeded hexadecimal packet.

### Practice-only

These remain local practice until their replay validators are implemented:

- **Block Rush:** clear connected matching blocks.
- **NIM Grid:** hit the active node.
- **Sync:** time packet transfers inside the target.

Practice scores are stored only in the browser and never enter rankings.

## Ranked verification architecture

The shared replay core lives in `packages/game-core` and is used by the API. It provides deterministic `createPuzzle(gameId, seed)` and `replay(gameId, seed, events)` functions.

The API in `server/index.ts` provides:

- `POST /auth/nonce` to issue a short-lived 32-byte login nonce.
- `POST /auth/verify` to verify the Nimiq signed message and create a session.
- `GET /daily` to publish the current UTC daily game without exposing its seed.
- `POST /runs/start` to issue a server-owned run ID and seed.
- `POST /runs/:id/submit` to consume a run once, replay events, and calculate score.
- `GET /leaderboard` for verified score rows.
- `GET /me` for authenticated operator progress.

The server rejects expired sessions, expired or reused nonces, mismatched addresses, reused runs, invalid event timing, wrong solutions, and superhuman durations. It stores practice submissions separately from ranked scores.

## Nimiq Pay integration

- **Browser:** `@nimiq/hub-api` opens Nimiq Hub and signs the login nonce.
- **Nimiq Pay:** `@nimiq/mini-app-sdk` uses the injected provider and signs the same login nonce.
- **Session:** the API derives and validates the signer address, then sets an httpOnly session cookie.

The wallet is used for identity and authentication. It does not sign client-selected scores.

## Security model

- One-time login nonce with a five-minute expiry.
- Ed25519 signature verification using `@nimiq/core`.
- Public key to Nimiq address validation.
- Server-owned HMAC daily seeds.
- Unique run IDs bound to the authenticated address.
- Consume-before-replay submission protection.
- Server-side replay and timing validation.
- One daily score per address, game, and UTC day.
- Guest practice is local-only.
- No seed phrase or private key is requested or exposed.

## Local development

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Start the local API in a second terminal:

```bash
npm run api
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:8787`.

Checks:

```bash
npm run build
npm run typecheck:server
npm test
```

## Production deployment

The repository includes a Vercel frontend build and serverless adapter in `api/index.ts`. `vercel.json` rewrites `/api/*` to that adapter.

Required environment variables:

```text
VITE_API_URL=https://your-app.vercel.app/api
VITE_HUB_URL=https://hub.nimiq.com
WEB_ORIGIN=https://your-app.vercel.app
COOKIE_SAME_SITE=None
SESSION_SECRET=<long-random-secret>
DAILY_SECRET=<long-random-secret>
```

The current API uses SQLite for local development. Vercel filesystems are ephemeral, so production rankings require migrating the same schema to Postgres before launch. Set `Secure` cookies and use HTTPS for both the frontend and API, especially when the Mini App is hosted inside Nimiq Pay.

## Roadmap

- Migrate the API store from SQLite to Postgres.
- Add real rank and best-score responses to submission results.
- Publish daily rankings and UTC countdown in the client.
- Add replay validators for Block Rush, NIM Grid, and Sync.
- Split each challenge into a testable module.
- Add grades, unlocks, audio feedback, haptics, and reduced-motion support.
- Add production rate limits, observability, and end-to-end auth/run tests.
- Consider TestAlbatross tournament rewards only after the economy and anti-cheat model are audited.

## Screenshots and demo

Run the app locally with `npm run dev` to view the OPERATOR interface. The current design uses a premium navy command-center layout with cyan network interactions, yellow achievement highlights, a featured Daily Operation, verified rankings, and an operator profile.

Brand assets are in `public/brand/`: `operator-logo-primary.svg`, `operator-mark.svg`, and `operator-icon.svg`.

For a hackathon demo, show this sequence:

1. Open the OPERATOR landing page.
2. Connect with Nimiq Hub or open the Mini App in Nimiq Pay.
3. Start a ranked run for one of the six supported challenges.
4. Complete the challenge and show the `SUBMITTING REPLAY` state.
5. Show the `VERIFIED RESULT` or `RUN NOT ACCEPTED` state.
6. Open Rankings to show only server-backed entries.
# OPERATOR

Competitive skill challenges, powered by Nimiq.

OPERATOR is a competitive skill platform where players enter fast, verifiable challenges, prove their ability, and climb the rankings, powered by Nimiq.

Guest scores are local practice only. Ranked scores require a connected Nimiq address and a verified server submission; the current static build does not claim unverified scores are ranked.

The server foundation lives in `server/` and uses SQLite locally. It issues one-time login nonces, verifies Nimiq signatures, creates httpOnly sessions, issues server-owned run seeds, consumes runs once, replays submitted events, and stores only verified ranked scores. `NIM PIN`, `Key Sequence`, `Address Memory`, `NIM Lock`, `NIM Vault`, and `Node Breach` are replay-capable and ranked. `Block Rush`, `NIM Grid`, and `Sync` remain practice-only until their validators are added.

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

## Vercel deployment

`vercel.json` configures the Vite output as the frontend and rewrites `/api/*` to the serverless API adapter in `api/index.ts`.

Deploy the frontend/API project with these environment variables:

```text
VITE_API_URL=https://your-app.vercel.app/api
VITE_HUB_URL=https://hub.nimiq.com
WEB_ORIGIN=https://your-app.vercel.app
COOKIE_SAME_SITE=None
SESSION_SECRET=<long-random-secret>
DAILY_SECRET=<long-random-secret>
```

The current API uses SQLite for local development. Do not use it as the production Vercel leaderboard database: serverless filesystems are ephemeral. Migrate the same schema to Postgres before enabling production ranked submissions.

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
