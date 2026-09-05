# Nimiq Integration

Browser users authenticate through Nimiq Hub. Nimiq Pay users authenticate through the injected Mini App provider. Both sign the same server nonce.

The wallet identifies the operator; it does not sign a client-provided score. Scores are accepted only after server replay validation.

Daily reward requests currently create a server-side pending claim after a qualifying verified run. On-chain settlement must be implemented by a funded payout worker and recorded with a transaction hash before claims are presented as paid.
