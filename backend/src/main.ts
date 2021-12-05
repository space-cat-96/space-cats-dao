require("dotenv").config();

import http from "http";
import cors from "cors";
import { Socket } from "socket.io";
import express, { Request, Response } from "express";
import ReadWriteService from "./read-write-service";

const port = 8787;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Space Cats DAO Backend Online.");
});

// This API returns this cached post history. Posts are fetched and cached in
// memory in this server on launch, and cached locally in the file system. If
// a post isn't present in the local cache, it is fetch from Arweave.
app.get("/posts", (req: Request, res: Response) => {
  const posts = ReadWriteService.getPostHistory();
  res.json(posts);
});

const launch = async () => {
  // Setup web socket for client/server communication
  const io: Socket = require("socket.io")(server, {
    cors: {
      // origin: "http://localhost:3001",
      origin: "https://space-cats-dao.surge.sh",
      methods: ["GET", "POST"],
    },
  });

  // Initialize read/write service with socket-io listener
  await ReadWriteService.init(io);

  // Start the server
  server.listen(port, () => {
    console.log(`- App listening at http://localhost:${port}`);
  });
};

launch();
