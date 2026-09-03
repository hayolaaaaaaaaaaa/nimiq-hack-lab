# Nimiq Hack Lab

An original Nimiq-themed skill arcade inspired by the *category of fast hacking/minigame trainers* represented by NoPixel MiniGames 4.0.

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

## Nimiq integration

The app uses `@nimiq/mini-app-sdk`. Inside Nimiq Pay it attempts to initialize the Nimiq provider and list the user's account. Scores can optionally be signed by the wallet provider.

No private key or seed phrase is requested.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL.

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
