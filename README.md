# Space Cats DAO

A Twitter-style app built using Solana and Arweave.

### Disclaimer

This was built for learning/experimental purposes. The code is not necessarily ready for a production application. Use at your own risk.

### Architecture

This repository is a twitter clone built using Solana and Arweave. Solana stores user accounts and initial post data directly on chain. Posts are then stored permanently using Arweave. An off-chain (centralized) read/write service handles reading post data from Solana and writing it to Arweave. This service subscribes to account changes from Solana, posts data to Arweave whenever new posts appear, and indexes the post history to serve quickly to clients. Periodically, this service also garbage collects the initial post data from the Solana account.

The code here is organized as follows:

```md
.
├── backend         # Backend NodeJS read/write service
├── frontend        # Client ReactJS application
├── programs        # Solana program source code
├── test            # Solana program tests/helper scripts
└── README.md
```

The Solana smart contract is build using Anchor.

One might imagine a real implementation in which the read/write service was also decentralized.
