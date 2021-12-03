import { clusterApiUrl } from "@solana/web3.js";

export enum ClusterName {
  devnet = "Devnet",
  mainnet = "Mainnet",
  testnet = "Testnet",
  localhost = "localhost",
}

export type Network = {
  name: ClusterName;
  url: string;
  fallbackUrl: string;
  programId: string | undefined;
};

export const networks: Network[] = [
  {
    name: ClusterName.mainnet,
    url: clusterApiUrl("mainnet-beta"),
    fallbackUrl: clusterApiUrl("mainnet-beta"),
    programId: process.env.REACT_APP_MAINNET_PROGRAM_ID,
  },
  {
    name: ClusterName.devnet,
    url: clusterApiUrl("devnet"),
    fallbackUrl: clusterApiUrl("devnet"),
    programId: process.env.REACT_APP_DEVNET_PROGRAM_ID,
  },
  {
    name: ClusterName.testnet,
    url: clusterApiUrl("testnet"),
    fallbackUrl: clusterApiUrl("testnet"),
    programId: process.env.REACT_APP_TESTNET_PROGRAM_ID,
  },
  {
    name: ClusterName.localhost,
    url: "http://127.0.0.1:8899",
    fallbackUrl: "http://127.0.0.1:8899",
    programId: process.env.REACT_APP_LOCAL_PROGRAM_ID,
  },
];
