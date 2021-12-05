const http = "http://localhost:8787";
const https = "https://space-cats-dao-backend.com";

const ws = "ws://localhost:8787";
const wss = "wss://space-cats-dao-backend.com";
const localhost = {
  socket: ws,
  backend: http,
};

const production = {
  socket: wss,
  backend: https,
};

// Toggle flag to switch environments.
const isDev = false;

export const SERVER_CONFIG = isDev ? localhost : production;
