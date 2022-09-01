import * as path from "path";
import express from "express";
import type { Response } from "express";
import * as http from "http";
import { Server } from "socket.io";
import * as easymidi from "easymidi";
import type { WsMessage } from "../model/types";
import { SongModel } from "../model/SongModel";
import { playNote, stopNote } from "../backends/easymidibackend";

const message: string = path.dirname("main.ts");
console.log(message);

const app = express();
app.use(express.static(path.join(__dirname, "..", "..", "server", "public")));
app.get("/socket.io.js", function (_: unknown, res: Response) {
  res.sendFile("socket.io.js", {
    root: path.join(__dirname, "node_modules", "socket.io-client", "dist"),
  });
});

const server = new http.Server(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let output: easymidi.Output, clock: easymidi.Input;

try {
  output = new easymidi.Output("loopMIDI Port 2");
} catch (e) {
  output = new easymidi.Output("pastator", true);
}
try {
  clock = new easymidi.Input("loopMIDI Port 1");
} catch (e) {
  clock = new easymidi.Input("pastator", true);
}

const song = new SongModel("back", {
  playNote: playNote(output),
  stopNote: stopNote(output),
  remoteMessage: function () {
    // Will be overridden when the web socket connects
  },
});

io.sockets.on("connection", function (socket) {
  console.log("User connected");
  setTimeout(() => {
    console.log("Send song from server to client");
    socket.emit("setSong", song.save());
  }, 100);
  if (song && song.callbacks) {
    song.callbacks.remoteMessage = (messageType: string, messageData: any) => {
      console.log("Emit to client", messageType, messageData);
      socket.emit(messageType, messageData);
    };
  }

  socket.emit("connected", {
    messageType: "root",
    messageData: { debugMessage: "User connected" },
  });

  socket.on("noteon", function (channel, note, velocity) {
    output.send("noteon", {
      channel,
      velocity,
      note,
    });
  });
  socket.on("noteoff", function (channel, note) {
    output.send("noteoff", {
      channel,
      velocity: 0,
      note,
    });
  });
  socket.on("setSong", function (songData) {
    console.log("Got setSong from client", songData);
    song.apply(songData);
  });
  socket.on("setTrack", function ({ trackId, data }) {
    console.log("Got setTrack from client", trackId, data);
    song.tracks[trackId]?.apply(data);
  });
});

clock.addListener("start", () => song.playpause(true, true));
clock.addListener("continue", () => song.playpause(true, true));
clock.addListener("stop", () => song.panic());

const SendClockToClient = false;

clock.addListener("clock", (clockEv) => {
  const msg: WsMessage = {
    messageType: "clock",
    messageData: {},
  };
  if (SendClockToClient) {
    io.emit("midimessage", msg);
  }
  song.tick();
});

process.on("SIGINT", function () {
  console.log("Caught interrupt signal");
  song.panic();
  io.close();
  process.exit();
});

server.listen(8080, function () {
  console.log("Listening on 8080");
});
