# Space Cats DAO

How else will cats keep in touch when in space?

### Architecture

This repository is a twitter clone build using Solana and Arweave. Solana stores user accounts and initial post data directly on chain. Posts are then stored permanently using Arweave. A (centralized) read/write service handles reading post data from Solana and writing it to Arweave. This service has indexes post history to serve to clients.

The code here is organized as follows:

```md
.
├── backend # Backend NodeJS read/write service
├── frontend # Client application
├── programs # Solana program source code
├── test # Solana program tests and helper scripts
└── README.md
```

The Solana smart contract is build using Anchor.

One might imagine a real implementation in which the read/write service was also decentralized. That would be cool.

### Getting Started

To run everything here locally follow these steps:

1. Clone the project. Be sure to have NodeJS/Yarn and the Rust/Solana/Anchor toolchain on your system.
2. Install dependencies:

```sh
$ yarn
$ cd test && yarn
$ cd backend && yarn
$ cd frontend && yarn
```

3. Ensure you have a local Solana wallet setup and run a validator:

```sh
# Create a new key pair if you don't have one already
$ solana-keygen new

# If you create a new wallet, airdrop yourself some SOL to pay for transactions
$ solana airdrop 5

# Start a validator
$ solana-test-validator
```

5. Build, test, or deploy the program using Anchor:

```sh
$ anchor build
$ anchor test
$ anchor deploy
```

6. If you deployed the program to localnet, next create the storage account:

```sh
$ yarn init:contract
```

7. Launch an Arweave local test network:

```sh
$ git clone https://github.com/ArweaveTeam/testweave-docker.git
$ docker-compose up -d
```

8. Run the read/write service:

```sh
$ cd backend && yarn start
```

9. Run a script to create posts:

```sh
$ yarn create:posts
```

10. Run the frontend client:

```sh
# Hit y to run on an alternate port, e.g. 3001 since 3000 is taken by TestWeave
$ cd frontend and yarn start
```
