import fs from "fs";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SpaceCatsDao } from "../../target/types/space_cats_dao";
import IDL from "../../target/idl/space_cats_dao.json";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getRandomText, wait } from "./utils";

const { SystemProgram } = anchor.web3;

const devnet = "https://api.devnet.solana.com";
const provider = anchor.Provider.local(devnet);
anchor.setProvider(provider);

const programID = "76cyyWGTHNmt8ruNohBDYYv86q5HZcgvwRi8GayVLjUs";
const program = new Program(
  IDL as anchor.Idl,
  programID,
  provider
) as unknown as Program<SpaceCatsDao>;

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

class ProgramUtil {
  garbageCollector: Keypair | null = null;
  storageAccount: Keypair | null = null;

  // Initialize with placeholder value
  storageAccountPublicKey: PublicKey = new PublicKey([]);

  constructor() {
    this.initStorageAccount();
    this.initGarbageCollectorWallet();
  }

  public generateKeyPair = anchor.web3.Keypair.generate;

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

  /**
   * Helper to create posts. Given a count this creates that many new user
   * wallets and posts. Given 5, it would create 5 users with 1 post each for
   * a total of 5 posts.
   */
  public async createRandomPosts(count: number, showLog = false) {
    for (let i = 0; i < count; i++) {
      await wait(200);
      const user = this.generateKeyPair();
      await this.createAuthor(user);
      const text = getRandomText();
      if (showLog) {
        console.log(`- Creating post ${i + 1} with text: ${text}`);
      }
      await this.createPost(text, user);
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

  /**
   * Handle creating the storage account on-chain.
   */
  public async handleInitializeStorageAccount() {
    try {
      const accountExists = await this.storageAccountExists();
      if (accountExists) {
        return;
      }

      const storageAccount = this.storageAccount;
      const garbageCollector = this.garbageCollector;

      if (storageAccount !== null && garbageCollector !== null) {
        await program.rpc.createStorageAccount({
          accounts: {
            storageAccount: storageAccount.publicKey,
            garbageCollector: garbageCollector.publicKey,
          },
          instructions: [
            await program.account.storageAccount.createInstruction(
              storageAccount
            ),
          ],
          signers: [storageAccount, garbageCollector],
        });
      }
    } catch (err) {
      console.log("createStorageAccount Error: ", err);
    }
  }

  /**
   * Initialize the storage account, using the locally stored keypair. If no
   * keypair is found, throw an error.
   */
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

  /**
   * Handle creating a new storage account keypair. This can be run using the
   * init:contract command and is used to create a new storage account.
   */
  public createStorageAccountKeyPair() {
    const keyPath = "../keys/storage-account_pubkey.json";
    const storageAccountKeyPair = this.generateKeyPair();
    this.storageAccount = storageAccountKeyPair;
    this.storageAccountPublicKey = storageAccountKeyPair.publicKey;

    console.log(
      "- Storage Account Public Key: ",
      storageAccountKeyPair.publicKey.toString()
    );
    console.log("- This public key will need to be added to the web3.ts file.");

    fs.writeFileSync(
      keyPath,
      JSON.stringify(Array.from(storageAccountKeyPair.secretKey))
    );
  }

  /**
   * Initialize the garbage collector wallet. This reads the wallet from the
   * locally stored key or creates it if no exists.
   */
  private initGarbageCollectorWallet() {
    const keyPath = "../keys/garbage-collector-key.json";
    const key = fs.readFileSync(keyPath, "utf-8");
    if (key) {
      const secret_key = JSON.parse(key);
      this.garbageCollector = Keypair.fromSecretKey(new Uint8Array(secret_key));
    } else {
      console.log("- No garbage collector key present. Creating one.");
      const garbageCollectorKeyPair = this.generateKeyPair();
      this.garbageCollector = garbageCollectorKeyPair;
      fs.writeFileSync(
        keyPath,
        JSON.stringify(Array.from(garbageCollectorKeyPair.secretKey))
      );
    }
  }
}

const programUtil = new ProgramUtil();

export default programUtil;
