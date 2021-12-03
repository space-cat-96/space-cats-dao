import { PublicKey } from "@solana/web3.js";
import BN from "bignumber.js";

export const formatPublicKey = (pk: PublicKey, padding = 8): string => {
  const key = pk.toString();
  const start = `${key.slice(0, padding)}`;
  const end = `${key.slice(key.length - padding, key.length)}`;
  return `${start}...${end}`;
};

export const lamportsToSol = (lamports: number) => {
  return new BN(lamports).dividedBy(10e8).toString();
};

export const toDateString = (date: number): string => {
  return new Date(date).toLocaleString();
};

export const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const addressToNumberForIcon = (pk: string) => {
  let result = "";
  for (let i = 0; i < pk.length; i++) {
    if (!isNaN(Number(pk.charAt(i)))) {
      result += pk.charAt(i);
    }
  }
  return Number(result);
};
