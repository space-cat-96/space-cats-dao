import fs from "fs";
import hash from "object-hash";
import Arweave from "arweave";
import { Socket } from "socket.io";
import storage, { LocalStorage } from "node-persist";
import TestWeave from "testweave-sdk";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import EventEmitter from "eventemitter3";
import { SpaceCatsDao } from "../../target/types/space_cats_dao";
import { CreateTransactionInterface } from "arweave/node/common";
import { ArweavePost, CreatePostPayload, Post, RawPost } from "./types";
import programUtil from "./program-util";

/**
 * Tag definition for Arweave post tag.
 */
const ArweaveTag = {
  name: "ApplicationTag",
  value: "SpaceCatsDao",
};

/**
 * This is the primary business logic for the read/write service. This
 * class handles subscribing to Solana account changes, parses and saves
 * incoming posts to Arweave, and caches all post history locally for quick
 * client access. It also handles dispatching garbage collection events to
 * the Solana program.
 */
export class ReadWriteService {
  program: Program<SpaceCatsDao>;
  programUtil = programUtil;
  jwk: JWKInterface | null = null;
  arweave: Arweave;
  testWeave: TestWeave | null = null;
  posts: Post[] = [];
  socket: Socket | null = null;
  fileStore: LocalStorage;
  recentSavedPostHashes: string[] = [];
  garbageCollectionInProgress = false;
  eventEmitter: EventEmitter | null = null;

  constructor() {
    this.program = anchor.workspace.SpaceCatsDao as Program<SpaceCatsDao>;

    this.fileStore = storage.create();

    const arweave = Arweave.init({
      host: "localhost",
      port: 1984,
      protocol: "http",
      timeout: 20000,
      logging: true,
    });

    this.arweave = arweave;
  }

  /**
   * Handle read/write service initialization. This includes async operations
   * which cannot run in the constructor.
   */
  init = async (io: Socket) => {
    try {
      this.socket = io;

      const testWeave = await TestWeave.init(this.arweave);
      this.testWeave = testWeave;

      await this.initArweaveWallet();
      await this.initSolanaAccountListener();
      await this.initializePosts();
      await this.garbageCollectionCheckpoint();
    } catch (err) {
      console.log("Init Error:");
      console.log(err);
    }
  };

  getPostHistory() {
    return this.posts;
  }

  debug() {
    if (this.eventEmitter) {
      const listeners = this.eventEmitter.listeners("change");
      const eventNames = this.eventEmitter.eventNames();
      return `Current listener counter: ${listeners.length}. Event names: ${eventNames}`;
    }
  }

  initializePosts = async () => {
    this.posts = await this.fetchAndCachePostHistory();
    this.validatePostHistory();
  };

  /**
   * This method fetches all of the tags from Arweave which match the posts.
   *
   * It then iterates through these ids and fetches the post data for each,
   * first checking the local file system cache and then fetching the post
   * directly from Arweave. If it fetches from Arweave, it then caches the
   * post locally on the file system.
   *
   * The file system cache is intended to preserve post history across server
   * restarts to speed up response times.
   */
  fetchAndCachePostHistory = async () => {
    const ids = await this.arweave.transactions.search(
      ArweaveTag.name,
      ArweaveTag.value
    );

    const results: ArweavePost[] = [];
    for (const id of ids) {
      const cachedPost = await this.fileStore.getItem(id);
      if (cachedPost) {
        results.push(cachedPost);
      } else {
        const tx = await this.fetchArweaveTransactionData(id);
        const post = { ...tx, id };
        await this.fileStore.setItem(id, post);
        results.push(post);
      }
    }

    return results;
  };

  /**
   * Validate the fetched posts and check for duplicated posts. This was
   * primarily used for development/debugging purposes.
   */
  validatePostHistory() {
    const posts = this.posts;
    const hashSet = new Set();

    for (const post of posts) {
      const postHash = hash({
        author: post.author,
        content: post.content,
        timestamp: post.timestamp,
      });
      if (hashSet.has(postHash)) {
        console.log("- [NOTE] Duplicate Post found: ");
        console.log(post);
      } else {
        hashSet.add(postHash);
      }
    }

    console.log(`- Posts initialized. Total posts = ${posts.length}`);
  }

  /**
   * Attach a Solana transaction listener for changes to the storage
   * account. These change events trigger the write service to handle
   * new incoming posts and write them to Arweave.
   */
  initSolanaAccountListener = async () => {
    // Initialize account listener
    await this.addAccountListener();

    // Reset account listener every 15 minutes. It seems there was a bug
    // where this listener would fail after some time. Not sure why. Setting
    // an interval here recreates it periodically and seems to fix the issue.
    setInterval(this.addAccountListener, 1000 * 60 * 15);
  };

  addAccountListener = async () => {
    this.eventEmitter?.removeAllListeners();

    console.log("- Subscribing to storageAccount changes.");
    const storageAccount = this.programUtil.getStorageAccountPubkey();
    const eventEmitter = this.program.account.storageAccount.subscribe(
      storageAccount,
      "confirmed"
    );

    eventEmitter.on("change", this.handleOnAccountChange);
    this.eventEmitter = eventEmitter;
  };

  /**
   * Handle storage account changes. This method validates that a new post
   * appeared which needs to be saved to Arweave, and then it handles saving
   * that post data.
   */
  handleOnAccountChange = async (accountInfo: any) => {
    console.log("\n- handleOnAccountChange firing.");
    const indexBN: anchor.BN = accountInfo.index;
    const index = indexBN.toNumber();
    const currentIndex = index === 0 ? 0 : index - 1;
    const post: RawPost = accountInfo.posts[currentIndex];

    // Proxy for empty placeholder posts, which should be ignored. These
    // occur when the storage account is garbage collected and the zeroth
    // index post is a default post.
    if (post.timestamp.toNumber() === 0) {
      console.log("- Received default/empty Post data, ignoring.");
      return;
    }

    const result = new TextDecoder("utf-8").decode(
      new Uint8Array(post.content)
    );
    const text = result.replace(/\x00/g, "");
    const decodedPost: CreatePostPayload = {
      content: text,
      author: post.author.toString(),
      timestamp: post.timestamp.toNumber() * 1000,
    };

    // Ensure we have not already saved this post by hashing it and checking
    // a local cached of saved post hashes. If not, save this post to Arweave.
    if (!this.checkForPostHashRecord(decodedPost)) {
      const id = await this.savePostToArweave(decodedPost);
      console.log(`- Saved post successfully to Arweave, tx id: ${id}. Post:`);
      console.log(decodedPost);

      if (id) {
        await this.postProcessNewPost(id);
      }

      // Run the garbage collection checkpoint after each successful save
      await this.garbageCollectionCheckpoint();
    } else {
      console.log("- [NOTE]: Post has already been saved.");
    }
  };

  /**
   * The Solana storage account is a "big account" but has limits to the number
   * of posts it can contain. Currently that limit is 500. Posts are continuously
   * saved to Arweave as they are written on-chain, but that primary storage
   * account needs to be garbage collected periodically to avoid overflowing
   * the storage array. These method handles that by checking the current
   * index in the storage account and triggering a garbage collection operation
   * when the storage is half full (index greater than or equal to 250).
   */
  garbageCollectionCheckpoint = async () => {
    // Avoid running if a garbage collection is already in progress
    if (this.garbageCollectionInProgress === true) {
      return;
    }

    this.garbageCollectionInProgress = true;
    const storageAccountState = await this.programUtil.getStorageAccountState();
    const index = storageAccountState.index.toNumber();

    if (index >= 250) {
      console.log(
        `- Running Garbage Collection on StorageAccount. Current account index = ${index}`
      );
      await this.programUtil.garbageCollect();
    }

    this.garbageCollectionInProgress = false;
  };

  /**
   * Load an Arweave wallet from the locally saved keypair or create a new
   * one if no keypair is present. Airdrop AR to the wallet if necessary.
   */
  initArweaveWallet = async () => {
    const keyPath = "../keys/arweave-jwk.json";
    const key = fs.readFileSync(keyPath, "utf-8");
    if (key) {
      const jwk = JSON.parse(key);
      this.jwk = jwk;
    } else {
      this.jwk = await this.generateArweaveKey();
      fs.writeFileSync("../keys/arweave-jwk.json", JSON.stringify(this.jwk));
    }

    await this.addArweaveBalanceIfNecessary();
  };

  generateArweaveKey = async () => {
    const key = await this.arweave.wallets.generate();
    return key;
  };

  getArweaveWalletAddress = async () => {
    const jwk = this.jwk;
    if (jwk) {
      const address = await this.arweave.wallets.getAddress(jwk);
      return address;
    } else {
      throw new Error("Arweave JWK wallet not initialized.");
    }
  };

  getArweaveWalletBalance = async (address: string) => {
    const balance = await this.arweave.wallets.getBalance(address);
    return balance;
  };

  airdropArweaveTokens = async (amount: number, address: string) => {
    const tw = this.testWeave;
    if (tw) {
      await tw.drop(address, String(amount));
    }
  };

  /**
   * Handle saving a post to Arweave. This create a new transaction, applies
   * the required tags, checks to verify this post has not already been
   * saved, and then submits the transaction to Arweave.
   */
  savePostToArweave = async (payload: CreatePostPayload) => {
    const tw = this.testWeave;
    if (tw) {
      const jwk = tw.rootJWK;
      const data = JSON.stringify(payload);
      const opts: Partial<CreateTransactionInterface> = { data };
      const tx = await this.arweave.createTransaction(opts, jwk);
      tx.addTag(ArweaveTag.name, ArweaveTag.value);
      await this.arweave.transactions.sign(tx, jwk);

      if (!this.checkForPostHashRecord(payload)) {
        this.cacheNewPostHash(payload);
        await this.arweave.transactions.post(tx);
        await tw.mine();
        return tx.id;
      }
    }
  };

  /**
   * Fetch Arweave transaction data given a specific transaction id.
   */
  fetchArweaveTransactionData = async (id: string) => {
    const bytes = await this.arweave.transactions.getData(id, {
      decode: true,
    });
    const json = new TextDecoder("utf-8").decode(
      new Uint8Array(bytes as Uint8Array)
    );
    const data: Post = JSON.parse(json);
    return data;
  };

  fetchArweaveTransactionStatus = async (id: string) => {
    const status = await this.arweave.transactions.getStatus(id);
    return status;
  };

  /**
   * Handle side effects after saving a post successfully. This method fetches
   * the post data from Arweave, adds the post to the in-memory cached
   * post history, caches the post in the local file system cache, and then
   * emits a socket-io event to all connected clients with the post data.
   */
  postProcessNewPost = async (id: string) => {
    const tx = await this.fetchArweaveTransactionData(id);
    const post: ArweavePost = { ...tx, id };

    // Add to in-memory cache
    this.posts.unshift(post);

    // Cache in file store cache
    await this.fileStore.setItem(id, post);

    // Emit event to socket clients
    const io = this.socket;
    if (io) {
      io.emit("post", post);
    }
  };

  /**
   * Hash a new post and store the hash.
   */
  cacheNewPostHash = (post: CreatePostPayload) => {
    const postHash = this.hashPostObject(post);
    console.log(`- Caching post hash: ${postHash}`);
    this.recentSavedPostHashes.unshift(postHash);
    this.recentSavedPostHashes.slice(0, 25);
  };

  /**
   * Check if a given post exists in the recent post hash records.
   */
  checkForPostHashRecord = (post: CreatePostPayload) => {
    const hashSet = new Set(this.recentSavedPostHashes);
    const postHash = this.hashPostObject(post);
    return hashSet.has(postHash);
  };

  hashPostObject = (post: CreatePostPayload) => {
    return hash(post);
  };

  addArweaveBalanceIfNecessary = async () => {
    const address = await this.getArweaveWalletAddress();
    let balance = await this.getArweaveWalletBalance(address);
    if (Number(balance) < 10) {
      await this.airdropArweaveTokens(1000, address);
    }

    balance = await this.getArweaveWalletBalance(address);
    console.log(`- Arweave Wallet AR Balance: ${balance}`);
  };
}

const readWriteService = new ReadWriteService();

export default readWriteService;
