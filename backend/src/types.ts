import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export interface CreatePostPayload {
  content: string;
  author: string;
  timestamp: number;
}

export interface RawPost {
  content: number[];
  author: PublicKey;
  timestamp: anchor.BN;
}

export interface Post {
  content: string;
  author: string;
  timestamp: Date;
}

export interface ArweavePost extends Post {
  id: string;
}
