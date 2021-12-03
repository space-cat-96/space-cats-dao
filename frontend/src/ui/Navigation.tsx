import React, { FC, useEffect, useState } from "react";
import { Button, notification, Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import { Posts } from "./Posts";
import styled from "styled-components";
import { Settings } from "./Settings";
import { useWallet } from "@solana/wallet-adapter-react";
import programUtil from "../tools/web3";
import { useConnection } from "../context/connection";
import { Link, Route, Routes } from "react-router-dom";
import { About } from "./About";
import { Profile } from "./Profile";
import { Stake } from "./Stake";
import { PublicKey, Connection } from "@solana/web3.js";
import { lamportsToSol } from "../tools/utils";
import { Timeline } from "./Timeline";

export const Navigation: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<{
    loading: boolean;
    value: null | number;
  }>({ loading: true, value: null });

  const fetchBalance = async (address: PublicKey, connection: Connection) => {
    const balance = await connection.getBalance(address);
    setBalance({ loading: false, value: balance });
  };

  useEffect(() => {
    if (publicKey && connection) {
      fetchBalance(publicKey, connection);
    }
  }, [publicKey, connection]);

  return (
    <AppContainer>
      <Header>
        <HeaderLeft>
          <Link to="/">
            <Typography.Title level={4} style={{ margin: 0, color: "white" }}>
              Space Cats DAO
            </Typography.Title>
          </Link>
          {/* <Diagonal />
          <HeaderLink to="/profile">Profile</HeaderLink>
          <Diagonal />
          <HeaderLink to="/stake">Stake</HeaderLink>
          <Diagonal />
          <HeaderLink to="/about">About</HeaderLink>
          <Diagonal />
          <HeaderLink to="/timeline">Timeline</HeaderLink> */}
        </HeaderLeft>
        <WalletMultiButton
          style={{
            background: "rgba(15, 15, 15, 0.5)",
            borderColor: "rgba(250, 250, 250, 0.15)",
          }}
        />
        <Popover
          placement="topRight"
          title="Settings"
          content={<Settings />}
          trigger="click"
        >
          <Button
            type="text"
            size="large"
            style={{
              marginLeft: 2,
              background: "rgba(15, 15, 15, 0.5)",
              borderColor: "rgba(250, 250, 250, 0.15)",
            }}
            icon={<SettingOutlined />}
          />
        </Popover>
      </Header>
      <Routes>
        <Route path="/" element={<Posts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stake" element={<Stake />} />
        <Route path="/about" element={<About />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="*" element={<Posts />} />
      </Routes>
      <BottomLeft>
        {publicKey && (
          <StyledButton
            onClick={async () => {
              await programUtil.requestAirdrop(publicKey, connection);
              notification.success({
                message: "Airdrop Successful",
                placement: "bottomRight",
              });
              await fetchBalance(publicKey, connection);
            }}
          >
            Airdrop SOL
          </StyledButton>
        )}
        <Paragraph style={{ marginTop: 6, marginLeft: 2 }}>
          Wallet:{" "}
          {balance.loading
            ? "..."
            : `${lamportsToSol(balance.value as number)} SOL`}
        </Paragraph>
      </BottomLeft>
    </AppContainer>
  );
};

const StyledButton = styled(Button)`
  :focus {
    outline: none;
  }
`;

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: scroll;
`;

const Header = styled.div`
  z-index: 10;
  position: fixed;
  width: 100%;
  height: 60px;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding-left: 20px;
  padding-right: 20px;
  background: rgb(16, 16, 16);
  border-bottom: 1px solid rgba(93, 82, 252, 0.75);
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-grow: 1;
  margin: auto;
`;

// const Diagonal = styled.div`
//   width: 12px;
//   margin-left: 14px;
//   margin-right: 14px;
//   background: linear-gradient(
//     to top left,
//     rgba(0, 0, 0, 0) 0%,
//     rgba(0, 0, 0, 0) calc(50% - 0.8px),
//     rgba(255, 255, 255, 0.4) 50%,
//     rgba(0, 0, 0, 0) calc(50% + 0.8px),
//     rgba(0, 0, 0, 0) 100%
//   );
// `;

// const HeaderLink = styled(Link)`
//   margin: 0;
//   display: flex;
//   align-items: center;
//   font-weight: 500;
// `;

const Paragraph = styled.p`
  margin: 0;
  font-weight: 300;
  color: rgba(250, 250, 250, 0.75);
`;

const BottomLeft = styled.div`
  position: fixed;
  bottom: 15px;
  left: 15px;
  display: none;
`;
