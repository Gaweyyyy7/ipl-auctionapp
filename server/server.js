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

const IPL_TEAMS = [
  "Chennai Super Kings",
  "Delhi Capitals",
  "Gujarat Titans",
  "Kolkata Knight Riders",
  "Lucknow Super Giants",
  "Mumbai Indians",
  "Punjab Kings",
  "Rajasthan Royals",
  "Royal Challengers Bengaluru",
  "Sunrisers Hyderabad",
];

const STARTING_PURSE = 125;

const auctionPlayers = [
  { id: 1, name: "Virat Kohli", role: "Batsman", basePrice: 2 },
  { id: 2, name: "MS Dhoni", role: "Wicketkeeper", basePrice: 1.5 },
  { id: 3, name: "Jasprit Bumrah", role: "Bowler", basePrice: 2 },
  { id: 4, name: "Andre Russell", role: "All-Rounder", basePrice: 2 },
  { id: 5, name: "Rohit Sharma", role: "Batsman", basePrice: 2 },
  { id: 6, name: "KL Rahul", role: "Wicketkeeper", basePrice: 2 },
  { id: 7, name: "Rashid Khan", role: "Bowler", basePrice: 2 },
  { id: 8, name: "Shubman Gill", role: "Batsman", basePrice: 2 },
  { id: 9, name: "Suryakumar Yadav", role: "Batsman", basePrice: 2 },
  { id: 10, name: "Ruturaj Gaikwad", role: "Batsman", basePrice: 1.5 },
];

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getAvailableTeams(room) {
  const taken = room.players.map((p) => p.franchise);
  return IPL_TEAMS.filter((team) => !taken.includes(team));
}

function emitRoomUpdate(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  io.to(roomCode).emit("players_update", {
    players: room.players,
    availableTeams: getAvailableTeams(room),
    franchises: room.franchises,
  });
}

function startTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  let timeLeft = 10;

  if (room.timer) clearInterval(room.timer);

  io.to(roomCode).emit("timer_update", timeLeft);

  room.timer = setInterval(() => {
    timeLeft -= 1;
    io.to(roomCode).emit("timer_update", timeLeft);

    if (timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;

      const currentPlayer = auctionPlayers[room.currentPlayerIndex];

      if (room.highestBidderFranchise) {
        const franchise = room.franchises[room.highestBidderFranchise];

        if (franchise && franchise.purse >= room.currentBid) {
          franchise.purse -= room.currentBid;
          franchise.players.push({
            name: currentPlayer.name,
            role: currentPlayer.role,
            price: room.currentBid,
          });
        }

        io.to(roomCode).emit("player_sold", {
          player: currentPlayer.name,
          role: currentPlayer.role,
          winner: room.highestBidderFranchise,
          price: room.currentBid,
          franchises: room.franchises,
        });
      } else {
        io.to(roomCode).emit("player_unsold", {
          player: currentPlayer.name,
        });
      }

      setTimeout(() => {
        const updatedRoom = rooms[roomCode];
        if (!updatedRoom) return;

        updatedRoom.currentPlayerIndex += 1;

        if (updatedRoom.currentPlayerIndex >= auctionPlayers.length) {
          io.to(roomCode).emit("auction_finished", {
            franchises: updatedRoom.franchises,
          });
          return;
        }

        const nextPlayer = auctionPlayers[updatedRoom.currentPlayerIndex];
        updatedRoom.currentBid = nextPlayer.basePrice;
        updatedRoom.highestBidder = null;
        updatedRoom.highestBidderFranchise = null;

        io.to(roomCode).emit("next_player_started", {
          currentPlayer: nextPlayer,
          currentBid: updatedRoom.currentBid,
          highestBidder: null,
          highestBidderFranchise: null,
          franchises: updatedRoom.franchises,
        });

        startTimer(roomCode);
      }, 2000);
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create_room", ({ username, franchise }) => {
    if (!username?.trim() || !franchise?.trim()) {
      socket.emit("join_error", "Team owner name and franchise are required");
      return;
    }

    if (!IPL_TEAMS.includes(franchise)) {
      socket.emit("join_error", "Invalid franchise selected");
      return;
    }

    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      players: [
        {
          id: socket.id,
          name: username.trim(),
          franchise,
        },
      ],
      host: socket.id,
      auctionStarted: false,
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidder: null,
      highestBidderFranchise: null,
      timer: null,
      franchises: {
        [franchise]: {
          purse: STARTING_PURSE,
          players: [],
        },
      },
    };

    socket.join(roomCode);

    socket.emit("room_created", {
      roomCode,
      players: rooms[roomCode].players,
      hostId: socket.id,
      availableTeams: getAvailableTeams(rooms[roomCode]),
      franchises: rooms[roomCode].franchises,
    });

    emitRoomUpdate(roomCode);
  });

  socket.on("join_room", ({ roomCode, username, franchise }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("join_error", "Room not found");
      return;
    }

    if (!username?.trim() || !franchise?.trim()) {
      socket.emit("join_error", "Team owner name and franchise are required");
      return;
    }

    if (room.players.length >= 10) {
      socket.emit("join_error", "All franchises are already taken");
      return;
    }

    if (!IPL_TEAMS.includes(franchise)) {
      socket.emit("join_error", "Invalid franchise selected");
      return;
    }

    const franchiseTaken = room.players.some((p) => p.franchise === franchise);
    if (franchiseTaken) {
      socket.emit("join_error", "That franchise is already taken");
      return;
    }

    room.players.push({
      id: socket.id,
      name: username.trim(),
      franchise,
    });

    room.franchises[franchise] = {
      purse: STARTING_PURSE,
      players: [],
    };

    socket.join(roomCode);

    socket.emit("join_success", {
      roomCode,
      players: room.players,
      hostId: room.host,
      availableTeams: getAvailableTeams(room),
      franchises: room.franchises,
    });

    emitRoomUpdate(roomCode);
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
    room.highestBidderFranchise = null;

    io.to(roomCode).emit("auction_started", {
      currentPlayer: auctionPlayers[0],
      currentBid: room.currentBid,
      highestBidder: null,
      highestBidderFranchise: null,
      franchises: room.franchises,
    });

    startTimer(roomCode);
  });

  socket.on("place_bid", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.auctionStarted) return;

    const bidder = room.players.find((p) => p.id === socket.id);
    if (!bidder) return;

    const bidderFranchise = room.franchises[bidder.franchise];
    const nextBid = room.currentBid + 0.5;

    if (!bidderFranchise || bidderFranchise.purse < nextBid) {
      socket.emit("join_error", "Not enough purse for this bid");
      return;
    }

    room.currentBid = nextBid;
    room.highestBidder = bidder.name;
    room.highestBidderFranchise = bidder.franchise;

    io.to(roomCode).emit("bid_updated", {
      currentPlayer: auctionPlayers[room.currentPlayerIndex],
      currentBid: room.currentBid,
      highestBidder: room.highestBidder,
      highestBidderFranchise: room.highestBidderFranchise,
      franchises: room.franchises,
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

    room.currentPlayerIndex += 1;

    if (room.currentPlayerIndex >= auctionPlayers.length) {
      io.to(roomCode).emit("auction_finished", {
        franchises: room.franchises,
      });
      return;
    }

    const nextPlayer = auctionPlayers[room.currentPlayerIndex];
    room.currentBid = nextPlayer.basePrice;
    room.highestBidder = null;
    room.highestBidderFranchise = null;

    io.to(roomCode).emit("next_player_started", {
      currentPlayer: nextPlayer,
      currentBid: room.currentBid,
      highestBidder: null,
      highestBidderFranchise: null,
      franchises: room.franchises,
    });

    startTimer(roomCode);
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      const disconnectedPlayer = room.players.find((p) => p.id === socket.id);
      room.players = room.players.filter((p) => p.id !== socket.id);

      if (disconnectedPlayer) {
        delete room.franchises[disconnectedPlayer.franchise];
      }

      if (room.players.length === 0) {
        if (room.timer) clearInterval(room.timer);
        delete rooms[roomCode];
      } else {
        emitRoomUpdate(roomCode);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/ipl-teams", (req, res) => {
  res.json(IPL_TEAMS);
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});