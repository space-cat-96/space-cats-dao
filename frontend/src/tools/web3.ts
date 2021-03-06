import axios from "axios";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BaseSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { ProgramType } from "../context/connection";
import { SERVER_CONFIG } from "./constants";

export const programID = new PublicKey(
  "76cyyWGTHNmt8ruNohBDYYv86q5HZcgvwRi8GayVLjUs"
);

export const storageAccount = new PublicKey(
  "77A79h1TVdZGyGDpADKKBr5DYjsRmYAEcdh8chhqqPRn"
);

type SendTransactionFn = BaseSignerWalletAdapter["sendTransaction"];

export interface Post {
  content: string;
  author: string;
  timestamp: number;
}

export interface ArweavePost extends Post {
  id: string;
}

class ProgramUtil {
  storageAccount: PublicKey;

  constructor() {
    this.storageAccount = storageAccount;
  }

  public generateKeyPair = () => anchor.web3.Keypair.generate();

  public async requestAirdrop(address: PublicKey, connection: Connection) {
    const signature = await connection.requestAirdrop(address, 1_000_000_000);
    await connection.confirmTransaction(signature);
  }

  public async storageAccountExists(program: Program) {
    try {
      await program.account.storageAccount.fetch(this.storageAccount);
      return true;
    } catch (err) {
      // Assume error means account doesn't exist...
      return false;
    }
  }

  public async getStorageAccountState(program: Program) {
    const storage = await program.account.storageAccount.fetch(
      this.storageAccount
    );
    return storage;
  }

  public async getAuthorAccount(program: Program, user: PublicKey) {
    const [authorAccount, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("author"), user.toBytes()],
        program.programId
      );

    return { bump, authorAccount };
  }

  public async getAuthorAccountState(program: Program, user: PublicKey) {
    try {
      const { authorAccount } = await this.getAuthorAccount(program, user);
      const state = await program.account.authorAccount.fetch(authorAccount);
      return state;
    } catch (err) {
      return false;
    }
  }

  public async createAuthor(
    program: ProgramType,
    connection: Connection,
    author: PublicKey,
    sendTransaction: SendTransactionFn
  ) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        program,
        author
      );
      const tx = program.transaction.createAuthor(bump, {
        accounts: {
          authorAccount,
          payer: author,
          author: author,
          systemProgram: SystemProgram.programId,
        },
      });

      const { blockhash } = await connection.getRecentBlockhash("max");
      tx.feePayer = author;
      tx.recentBlockhash = blockhash;
      const result = await sendTransaction(tx, connection);

      await connection.confirmTransaction(result, "processed");
      await this.getAuthorAccountState(program, authorAccount);
    } catch (err) {
      console.log("createAuthor Error: ", err);
    }
  }

  public async updateAuthorProfile(
    bio: string | null,
    username: string | null,
    author: PublicKey,
    program: ProgramType,
    connection: Connection,
    sendTransaction: SendTransactionFn
  ) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        program,
        author
      );

      const update = {
        bio,
        username,
      };

      const tx = program.transaction.updateAuthorProfile(bump, update, {
        accounts: {
          authorAccount,
          author: author,
        },
      });

      const { blockhash } = await connection.getRecentBlockhash("max");
      tx.feePayer = author;
      tx.recentBlockhash = blockhash;

      const result = await sendTransaction(tx, connection);
      const final = await connection.confirmTransaction(result, "processed");
      return final;
    } catch (err) {
      console.log("updateAuthorProfile Error: ", err);
    }
  }

  public async createPost(
    program: ProgramType,
    connection: Connection,
    author: PublicKey,
    message: string,
    sendTransaction: SendTransactionFn
  ) {
    try {
      const { bump, authorAccount } = await this.getAuthorAccount(
        program,
        author
      );
      const tx = program.transaction.createPost(bump, message, {
        accounts: {
          authorAccount,
          author: author,
          storageAccount: this.storageAccount,
        },
      });

      const { blockhash } = await connection.getRecentBlockhash("max");
      tx.feePayer = author;
      tx.recentBlockhash = blockhash;

      const result = await sendTransaction(tx, connection);
      const final = await connection.confirmTransaction(result, "processed");
      return final;
    } catch (err) {
      console.log("createPost Error: ", err);
    }
  }

  public async fetchPostHistory() {
    const backend = `${SERVER_CONFIG.backend}/posts`;
    const response = await axios.get<ArweavePost[]>(backend);
    const result = response.data;
    return result;
  }
}

const programUtil = new ProgramUtil();

export default programUtil;
