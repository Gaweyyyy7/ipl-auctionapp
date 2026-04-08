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
const AUCTION_TIME = 7;

const auctionPlayers = [
  { id: 1, name: "Virat Kohli", role: "Batsman", overseas: "Local", basePrice: 2 },
  { id: 2, name: "MS Dhoni", role: "Wicketkeeper", overseas: "Local", basePrice: 1.5 },
  { id: 3, name: "Jasprit Bumrah", role: "Bowler", overseas: "Local", basePrice: 2 },
  { id: 4, name: "Andre Russell", role: "All-Rounder", overseas: "Overseas", basePrice: 2 },
  { id: 5, name: "Rohit Sharma", role: "Batsman", overseas: "Local", basePrice: 2 },
  { id: 6, name: "KL Rahul", role: "Wicketkeeper", overseas: "Local", basePrice: 2 },
  { id: 7, name: "Rashid Khan", role: "Bowler", overseas: "Overseas", basePrice: 2 },
  { id: 8, name: "Shubman Gill", role: "Batsman", overseas: "Local", basePrice: 2 },
  { id: 9, name: "Suryakumar Yadav", role: "Batsman", overseas: "Local", basePrice: 2 },
  { id: 10, name: "Ruturaj Gaikwad", role: "Batsman", overseas: "Local", basePrice: 1.5 },
  { id: 11, name: "Jos Buttler", role: "Wicketkeeper", overseas: "Overseas", basePrice: 2 },
  { id: 12, name: "Pat Cummins", role: "Bowler", overseas: "Overseas", basePrice: 2 },
  { id: 13, name: "Hardik Pandya", role: "All-Rounder", overseas: "Local", basePrice: 2 },
  { id: 14, name: "Trent Boult", role: "Bowler", overseas: "Overseas", basePrice: 1.5 },
  { id: 15, name: "Nicholas Pooran", role: "Wicketkeeper", overseas: "Overseas", basePrice: 1.5 },
];

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getAvailableTeams(room) {
  const takenTeams = room.players.map((player) => player.franchise);
  return IPL_TEAMS.filter((team) => !takenTeams.includes(team));
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

  if (room.timer) {
    clearInterval(room.timer);
  }

  room.timeLeft = AUCTION_TIME;
  io.to(roomCode).emit("timer_update", room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    io.to(roomCode).emit("timer_update", room.timeLeft);

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;

      const currentPlayer = auctionPlayers[room.currentPlayerIndex];

      if (room.highestBidderFranchise) {
        const franchiseData = room.franchises[room.highestBidderFranchise];

        if (franchiseData && franchiseData.purse >= room.currentBid) {
          franchiseData.purse -= room.currentBid;
          franchiseData.players.push({
            name: currentPlayer.name,
            role: currentPlayer.role,
            overseas: currentPlayer.overseas,
            price: room.currentBid,
          });
        }

        io.to(roomCode).emit("player_sold", {
          player: currentPlayer.name,
          role: currentPlayer.role,
          overseas: currentPlayer.overseas,
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
        updatedRoom.timeLeft = AUCTION_TIME;

        io.to(roomCode).emit("next_player_started", {
          currentPlayer: nextPlayer,
          currentBid: updatedRoom.currentBid,
          highestBidder: null,
          highestBidderFranchise: null,
          franchises: updatedRoom.franchises,
          currentPlayerIndex: updatedRoom.currentPlayerIndex,
          auctionPlayers: auctionPlayers,
        });

        startTimer(roomCode);
      }, 2000);
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create_room", ({ username, franchise }) => {
    const cleanName = username?.trim();
    const cleanFranchise = franchise?.trim();

    if (!cleanName || !cleanFranchise) {
      socket.emit("join_error", "Owner name and franchise are required");
      return;
    }

    if (!IPL_TEAMS.includes(cleanFranchise)) {
      socket.emit("join_error", "Invalid franchise selected");
      return;
    }

    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      players: [
        {
          id: socket.id,
          name: cleanName,
          franchise: cleanFranchise,
        },
      ],
      host: socket.id,
      auctionStarted: false,
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidder: null,
      highestBidderFranchise: null,
      timer: null,
      timeLeft: AUCTION_TIME,
      franchises: {
        [cleanFranchise]: {
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
        franchise: cleanFranchise,
      availableTeams: getAvailableTeams(rooms[roomCode]),
      franchises: rooms[roomCode].franchises,
    });

    emitRoomUpdate(roomCode);
  });

  socket.on("join_room", ({ roomCode, username, franchise }) => {
    const room = rooms[roomCode];
    const cleanName = username?.trim();
    const cleanFranchise = franchise?.trim();

    if (!room) {
      socket.emit("join_error", "Room not found");
      return;
    }

    if (!cleanName || !cleanFranchise) {
      socket.emit("join_error", "Owner name and franchise are required");
      return;
    }

    if (!IPL_TEAMS.includes(cleanFranchise)) {
      socket.emit("join_error", "Invalid franchise selected");
      return;
    }

    const franchiseTaken = room.players.some(
      (player) => player.franchise === cleanFranchise
    );

    if (franchiseTaken) {
      socket.emit("join_error", "That franchise is already taken");
      return;
    }

    room.players.push({
      id: socket.id,
      name: cleanName,
      franchise: cleanFranchise,
    });

    room.franchises[cleanFranchise] = {
      purse: STARTING_PURSE,
      players: [],
    };

    socket.join(roomCode);

    socket.emit("join_success", {
      roomCode,
      players: room.players,
      hostId: room.host,
        franchise: cleanFranchise,
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
    room.timeLeft = AUCTION_TIME;

    io.to(roomCode).emit("auction_started", {
      currentPlayer: auctionPlayers[0],
      currentBid: room.currentBid,
      highestBidder: null,
      highestBidderFranchise: null,
      franchises: room.franchises,
      auctionPlayers: auctionPlayers,
      currentPlayerIndex: 0,
    });

    startTimer(roomCode);
  });

  socket.on("place_bid", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.auctionStarted) return;

    const bidder = room.players.find((player) => player.id === socket.id);
    if (!bidder) return;

    if (room.highestBidderFranchise === bidder.franchise) {
      socket.emit("join_error", "You are already the highest bidder! Wait for someone else to bid.");
      return;
    }

    const bidderFranchiseData = room.franchises[bidder.franchise];
    const nextBid = room.currentBid + 0.5;

    if (!bidderFranchiseData || bidderFranchiseData.purse < nextBid) {
      socket.emit("join_error", "Not enough purse for this bid");
      return;
    }

    room.currentBid = nextBid;
    room.highestBidder = bidder.name;
    room.highestBidderFranchise = bidder.franchise;

    startTimer(roomCode);

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
    room.timeLeft = AUCTION_TIME;

    io.to(roomCode).emit("next_player_started", {
      currentPlayer: nextPlayer,
      currentBid: room.currentBid,
      highestBidder: null,
      highestBidderFranchise: null,
      franchises: room.franchises,
      currentPlayerIndex: room.currentPlayerIndex,
      auctionPlayers: auctionPlayers,
    });

    startTimer(roomCode);
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      const disconnectedPlayer = room.players.find(
        (player) => player.id === socket.id
      );

      room.players = room.players.filter((player) => player.id !== socket.id);

      if (disconnectedPlayer) {
        delete room.franchises[disconnectedPlayer.franchise];
      }

      if (room.players.length === 0) {
        if (room.timer) {
          clearInterval(room.timer);
        }
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

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});