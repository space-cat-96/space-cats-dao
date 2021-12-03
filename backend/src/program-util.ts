import fs from "fs";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SpaceCatsDao } from "../../target/types/space_cats_dao";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const { SystemProgram } = anchor.web3;
const program = anchor.workspace.SpaceCatsDao as Program<SpaceCatsDao>;

const provider = anchor.Provider.local();
anchor.setProvider(provider);

interface RawPost {
  content: number[];
  author: string;
  timestamp: anchor.BN;
}

export interface Post {
  content: string;
  author: string;
  timestamp: Date;
}

/**
 * Program util which handles interactions with Solana.
 */
class ProgramUtil {
  garbageCollector: Keypair | null = null;
  storageAccount: Keypair | null = null;
  storageAccountPublicKey: PublicKey = new PublicKey([]);

  constructor() {
    this.initStorageAccount();
    this.initGarbageCollectorWallet();
  }

  public generateKeyPair = anchor.web3.Keypair.generate;

  getStorageAccountPubkey() {
    return this.storageAccountPublicKey;
  }

  public async storageAccountExists() {
    try {
      await program.account.storageAccount.fetch(this.storageAccountPublicKey);
      return true;
    } catch (err) {
      // Assume error means account doesn't exist...
      return false;
    }
  }

  public async getStorageAccountState() {
    const storage = await program.account.storageAccount.fetch(
      this.storageAccountPublicKey
    );
    return storage;
  }

  public async getAuthorAccount(user: PublicKey) {
    const [authorAccount, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("author"), user.toBytes()],
        program.programId
      );

    return { bump, authorAccount };
  }

  public async getAuthorAccountState(authorAccount: PublicKey) {
    const state = await program.account.authorAccount.fetch(authorAccount);
    return state;
  }

  public async createAuthor(userAccount: Keypair) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        userAccount.publicKey
      );
      await program.rpc.createAuthor(bump, {
        accounts: {
          authorAccount,
          payer: provider.wallet.publicKey,
          author: userAccount.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [userAccount],
      });
    } catch (err) {
      console.log("createAuthor Error: ", err);
    }
  }

  public async updateAuthorProfile(
    bio: string | null,
    username: string | null,
    userAccount: Keypair
  ) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        userAccount.publicKey
      );
      const update = { bio, username };
      await program.rpc.updateAuthorProfile(bump, update, {
        accounts: {
          authorAccount,
          author: userAccount.publicKey,
        },
        signers: [userAccount],
      });
    } catch (err) {
      console.log("updateAuthorProfile Error: ", err);
    }
  }

  public async createPost(message: string, userAccount: Keypair) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        userAccount.publicKey
      );

      await program.rpc.createPost(bump, message, {
        accounts: {
          authorAccount,
          author: userAccount.publicKey,
          storageAccount: this.storageAccountPublicKey,
        },
        signers: [userAccount],
      });
    } catch (err) {
      console.log("createPost Error: ", err);
    }
  }

  public async garbageCollect() {
    try {
      const garbageCollector = this.garbageCollector;
      if (garbageCollector !== null) {
        await program.rpc.garbageCollect({
          accounts: {
            garbageCollector: garbageCollector.publicKey,
            storageAccount: this.storageAccountPublicKey,
          },
          signers: [garbageCollector],
        });
      }
    } catch (err) {
      console.log("garbageCollect Error: ", err);
    }
  }

  public async fetchAllPosts() {
    const state = await program.account.storageAccount.fetch(
      this.storageAccountPublicKey
    );

    const posts = state.posts as RawPost[];
    const results = posts
      .filter((x) => x.timestamp.toNumber() !== 0)
      .sort((a, b) => b.timestamp.toNumber() - a.timestamp.toNumber())
      .map((x) => {
        const result = new TextDecoder("utf-8").decode(
          new Uint8Array(x.content)
        );
        const text = result.replace(/\x00/g, "");
        const post: Post = {
          content: text,
          author: x.author.toString(),
          timestamp: new Date(x.timestamp.toNumber() * 1000),
        };
        return post;
      });

    return results;
  }

  public initStorageAccount() {
    const keyPath = "../keys/storage-account_pubkey.json";
    const key = fs.readFileSync(keyPath, "utf-8");
    if (key) {
      const secret_key = JSON.parse(key);
      const keypair: Keypair = Keypair.fromSecretKey(
        new Uint8Array(secret_key)
      );

      this.storageAccount = keypair;
      this.storageAccountPublicKey = keypair.publicKey;
      console.log(
        `- Storage Account initialized with public key: ${this.storageAccountPublicKey.toString()}`
      );
    } else {
      throw new Error("No storage account keypair found!");
    }
  }

  private initGarbageCollectorWallet() {
    const keyPath = "../keys/garbage-collector-key.json";
    const key = fs.readFileSync(keyPath, "utf-8");
    if (key) {
      const secret_key = JSON.parse(key);
      this.garbageCollector = Keypair.fromSecretKey(new Uint8Array(secret_key));
    } else {
      throw new Error("No garbage collector key present.");
    }

    this.airdropGarbageCollectorAddress();
  }

  // TODO: Check balance level before airdropping
  private async airdropGarbageCollectorAddress() {
    const garbageCollector = this.garbageCollector;
    if (garbageCollector !== null) {
      const localhost = "http://127.0.0.1:8899";
      const connection = new Connection(localhost);
      const address = garbageCollector.publicKey;
      const signature = await connection.requestAirdrop(address, 50_000_000);
      await connection.confirmTransaction(signature);
    }
  }
}

const programUtil = new ProgramUtil();

export default programUtil;
