import * as anchor from "@project-serum/anchor";
import React, { createContext, useContext, useMemo, useState } from "react";
import { Connection } from "@solana/web3.js";
import { Network, networks } from "../tools/networks";
import { Program, Provider, Wallet } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "../space_cats_dao.json";
import { programID } from "../tools/web3";

const DEFAULT_NETWORK = networks[1];

export type ConnectionContextType = {
  network: Network;
  networks: Network[];
  connection: Connection;
  handleSetConnection: React.Dispatch<React.SetStateAction<Connection>>;
  handleSetNetwork: (network: Network) => void;
};

// const localhost = "http://127.0.0.1:8899";
const devnet = "https://api.devnet.solana.com";

export const ConnectionContext = createContext<ConnectionContextType>({
  networks,
  network: DEFAULT_NETWORK,
  connection: new Connection(devnet),
  handleSetNetwork: () => {},
  handleSetConnection: () => {},
});

export const ConnectionProvider: React.FC = ({ children }) => {
  const [network, setNetwork] = useState(DEFAULT_NETWORK);

  const [connection, setConnection] = useState(
    new Connection(network.url, {
      commitment: "confirmed",
    })
  );

  const handleSetNetwork = (newNetwork: Network) => {
    setNetwork(newNetwork);
    setConnection(new Connection(newNetwork.url, "confirmed"));
  };

  const state: ConnectionContextType = {
    network,
    networks,
    connection,
    handleSetNetwork,
    handleSetConnection: setConnection,
  };

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = (): ConnectionContextType => {
  return useContext(ConnectionContext);
};

export const useProvider = (): Provider | null => {
  const { wallet } = useWallet();
  const { connection } = useConnection();

  return useMemo(() => {
    if (wallet && connection) {
      const providerWallet = wallet as unknown as Wallet;
      return new Provider(connection, providerWallet, {
        preflightCommitment: "processed",
      });
    }

    return null;
  }, [wallet, connection]);
};

export type ProgramType = anchor.Program<anchor.Idl>;

export const useProgram = (): anchor.Program<anchor.Idl> | null => {
  const provider = useProvider();

  return useMemo(() => {
    if (provider) {
      const programIDL = idl as anchor.Idl;
      const program = new Program(programIDL, programID, provider);
      return program;
    }

    return null;
  }, [provider]);
};
