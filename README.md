# Space Cats DAO

How else will cats keep in touch when in space?

### Architecture

This repository is a twitter clone built using Solana and Arweave. Solana stores user accounts and initial post data directly on chain. Posts are then stored permanently using Arweave. An off-chain (centralized) read/write service handles reading post data from Solana and writing it to Arweave. This service indexes post history to serve to clients quickly

The code here is organized as follows:

```md
.
├── backend         # Backend NodeJS read/write service
├── frontend        # Client application
├── programs        # Solana program source code
├── test            # Solana program tests and helper scripts
└── README.md
```

The Solana smart contract is build using Anchor.

One might imagine a real implementation in which the read/write service was also decentralized.

### Disclaimer

This was built for learning/experimental purposes. The code is not necessarily ready for a production application. Use at your own risk.
