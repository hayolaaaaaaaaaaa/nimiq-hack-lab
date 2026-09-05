# Analytics

OPERATOR records only product lifecycle events needed to measure adoption and reliability:

- `wallet_connected`
- `run_started`
- `run_verified`
- `run_rejected`
- `reward_requested`

Events include the event name, optional game ID, authenticated wallet address when a session exists, and a server timestamp. Replay inputs, scores supplied by the client, private keys, and seed phrases are never sent to analytics.

The ingestion endpoint is `POST /analytics/event`. Analytics failures are non-blocking and never interrupt gameplay.

A production reporting view should be protected separately with admin authentication before exposing aggregate counts such as unique operators, verified runs, completion rate, and reward requests.
