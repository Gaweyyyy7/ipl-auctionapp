const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const auctionPlayers = [
  { id: 1, name: "Virat Kohli", role: "Batsman", basePrice: 2 },
  { id: 2, name: "MS Dhoni", role: "Wicketkeeper", basePrice: 1.5 },
  { id: 3, name: "Jasprit Bumrah", role: "Bowler", basePrice: 2 },
  { id: 4, name: "Andre Russell", role: "All-Rounder", basePrice: 2 },
  { id: 5, name: "Rohit Sharma", role: "Batsman", basePrice: 2 },
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function startTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  let timeLeft = 10;

  if (room.timer) {
    clearInterval(room.timer);
  }

  io.to(roomCode).emit("timer_update", timeLeft);

  room.timer = setInterval(() => {
    timeLeft--;

    io.to(roomCode).emit("timer_update", timeLeft);

    if (timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;

      // SOLD logic
      if (room.highestBidder) {
        const player = auctionPlayers[room.currentPlayerIndex];
        const team = room.teams[room.highestBidder];

        if (team && team.purse >= room.currentBid) {
          team.purse -= room.currentBid;
          team.squad.push(player.name);
        }

        io.to(roomCode).emit("player_sold", {
          player: player.name,
          winner: room.highestBidder,
          price: room.currentBid,
          teams: room.teams,
        });
      } else {
        io.to(roomCode).emit("player_unsold", {
          player: auctionPlayers[room.currentPlayerIndex].name,
        });
      }

      // move to next player automatically after 2 seconds
      setTimeout(() => {
        const currentRoom = rooms[roomCode];
        if (!currentRoom) return;

        currentRoom.currentPlayerIndex++;

        if (currentRoom.currentPlayerIndex >= auctionPlayers.length) {
          io.to(roomCode).emit("auction_finished", {
            teams: currentRoom.teams,
          });
          return;
        }

        const next = auctionPlayers[currentRoom.currentPlayerIndex];
        currentRoom.currentBid = next.basePrice;
        currentRoom.highestBidder = null;

        io.to(roomCode).emit("next_player_started", {
          currentPlayer: next,
          currentBid: currentRoom.currentBid,
          highestBidder: null,
          teams: currentRoom.teams,
        });

        startTimer(roomCode);
      }, 2000);
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create_room", (username) => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      players: [{ id: socket.id, name: username }],
      host: socket.id,
      auctionStarted: false,
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidder: null,
      teams: {
        [username]: { purse: 10, squad: [] },
      },
      timer: null,
    };

    socket.join(roomCode);

    socket.emit("room_created", {
      roomCode,
      players: rooms[roomCode].players,
      hostId: socket.id,
    });
  });

  socket.on("join_room", ({ roomCode, username }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("join_error", "Room not found");
      return;
    }

    if (room.players.length >= 4) {
      socket.emit("join_error", "Room full");
      return;
    }

    room.players.push({ id: socket.id, name: username });
    room.teams[username] = { purse: 10, squad: [] };
    socket.join(roomCode);

    socket.emit("join_success", {
      roomCode,
      players: room.players,
      hostId: room.host,
    });

    io.to(roomCode).emit("players_update", room.players);
  });

  socket.on("start_auction", (roomCode) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("join_error", "Room not found");
      return;
    }

    if (room.host !== socket.id) {
      socket.emit("join_error", "Only host can start auction");
      return;
    }

    room.auctionStarted = true;
    room.currentPlayerIndex = 0;
    room.currentBid = auctionPlayers[0].basePrice;
    room.highestBidder = null;

    io.to(roomCode).emit("auction_started", {
      currentPlayer: auctionPlayers[0],
      currentBid: room.currentBid,
      highestBidder: room.highestBidder,
      teams: room.teams,
    });

    startTimer(roomCode);
  });

  socket.on("place_bid", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.auctionStarted) return;

    const bidder = room.players.find((p) => p.id === socket.id);
    if (!bidder) return;

    const bidderTeam = room.teams[bidder.name];
    if (!bidderTeam) return;

    const nextBid = room.currentBid + 0.5;

    // do not allow bid if purse not enough
    if (bidderTeam.purse < nextBid) {
      socket.emit("join_error", "Not enough purse for this bid");
      return;
    }

    room.currentBid = nextBid;
    room.highestBidder = bidder.name;

    io.to(roomCode).emit("bid_updated", {
      currentPlayer: auctionPlayers[room.currentPlayerIndex],
      currentBid: room.currentBid,
      highestBidder: room.highestBidder,
      teams: room.teams,
    });
  });

  socket.on("next_player", (roomCode) => {
    const room = rooms[roomCode];

    if (!room) return;
    if (room.host !== socket.id) return;

    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }

    room.currentPlayerIndex++;

    if (room.currentPlayerIndex >= auctionPlayers.length) {
      io.to(roomCode).emit("auction_finished", {
        teams: room.teams,
      });
      return;
    }

    const next = auctionPlayers[room.currentPlayerIndex];
    room.currentBid = next.basePrice;
    room.highestBidder = null;

    io.to(roomCode).emit("next_player_started", {
      currentPlayer: next,
      currentBid: room.currentBid,
      highestBidder: room.highestBidder,
      teams: room.teams,
    });

    startTimer(roomCode);
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      room.players = room.players.filter((player) => player.id !== socket.id);

      if (room.players.length === 0) {
        if (room.timer) {
          clearInterval(room.timer);
        }
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit("players_update", room.players);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});