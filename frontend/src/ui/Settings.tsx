import React from "react";
import { Select } from "antd";
import { useConnection } from "../context/connection";
import { ClusterName, networks } from "../tools/networks";
import { useTheme } from "../context/theme";

export const Settings = () => {
  const { theme, themes, handleSetTheme } = useTheme();
  const { network, handleSetNetwork } = useConnection();
  return (
    <>
      <div style={{ display: "grid" }}>
        Theme:{" "}
        <Select
          disabled
          value={theme}
          onSelect={handleSetTheme}
          style={{ marginBottom: 20 }}
        >
          {themes.map((name) => (
            <Select.Option value={name} key={name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div style={{ display: "grid" }}>
        Network:{" "}
        <Select
          disabled
          value={network.name}
          onSelect={(clusterName: ClusterName) => {
            const network = networks.find((x) => x.name === clusterName);
            if (network) {
              handleSetNetwork(network);
            }
          }}
          style={{ marginBottom: 20 }}
        >
          {networks.map(({ name }) => (
            <Select.Option value={name} key={name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </div>
    </>
  );
};
