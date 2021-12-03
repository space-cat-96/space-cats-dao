import React, { FC, useCallback, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ConnectionProvider } from "./context/connection";
import { notification } from "antd";
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet,
  getTorusWallet,
} from "@solana/wallet-adapter-wallets";
import { Navigation } from "./ui/Navigation";
import { ThemeProvider } from "./context/theme";

require("./App.less");

const getWallets = (network: WalletAdapterNetwork) => {
  return [
    getPhantomWallet(),
    getSlopeWallet(),
    getSolflareWallet(),
    getTorusWallet({
      options: { clientId: "Get a client ID @ https://developer.tor.us" },
    }),
    getLedgerWallet(),
    getSolletWallet({ network }),
    getSolletExtensionWallet({ network }),
  ];
};

const App: FC = () => {
  const network = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(() => getWallets(network), [network]);

  const onError = useCallback((e: WalletError) => {
    const description = e.message ? `${e.name}: ${e.message}` : e.name;
    console.error("Wallet Connection Error: ", e);
    notification.error({
      message: "Wallet Connection Error",
      description,
      placement: "bottomRight",
    });
  }, []);

  return (
    <BrowserRouter>
      <ConnectionProvider>
        <WalletProvider wallets={wallets} onError={onError} autoConnect>
          <WalletModalProvider>
            <ThemeProvider>
              <Navigation />
            </ThemeProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </BrowserRouter>
  );
};

export default App;
