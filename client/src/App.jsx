import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setMessage("Connected to server");
    });

    socket.on("room_created", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setIsHost(true);
      setMessage(`Room created: ${data.roomCode}`);
    });

    socket.on("join_success", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setIsHost(socket.id === data.hostId);
      setMessage(`Joined room: ${data.roomCode}`);
    });

    socket.on("players_update", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("auction_started", (data) => {
      setAuctionStarted(true);
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setMessage("Auction has started!");
    });

    socket.on("bid_updated", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
    });

    socket.on("next_player_started", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
    });

    socket.on("auction_finished", () => {
      setAuctionStarted(false);
      setCurrentPlayer(null);
      setMessage("Auction finished!");
    });

    socket.on("join_error", (msg) => {
      setMessage(`Error: ${msg}`);
    });

    return () => {
      socket.off("connect");
      socket.off("room_created");
      socket.off("join_success");
      socket.off("players_update");
      socket.off("auction_started");
      socket.off("bid_updated");
      socket.off("next_player_started");
      socket.off("auction_finished");
      socket.off("join_error");
    };
  }, []);

  const createRoom = () => {
    if (!username.trim()) {
      setMessage("Please enter a team name");
      return;
    }
    socket.emit("create_room", username.trim());
  };

  const joinRoom = () => {
    if (!username.trim() || !roomCode.trim()) {
      setMessage("Enter team name and room code");
      return;
    }

    socket.emit("join_room", {
      roomCode: roomCode.toUpperCase().trim(),
      username: username.trim(),
    });
  };

  const startAuction = () => {
    socket.emit("start_auction", joinedRoom);
  };

  const placeBid = () => {
    socket.emit("place_bid", { roomCode: joinedRoom });
  };

  const nextPlayer = () => {
    socket.emit("next_player", joinedRoom);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", width: "100%", maxWidth: "800px" }}>
        <h1 style={{ fontSize: "64px", marginBottom: "20px" }}>
          IPL Auction App
        </h1>

        {!joinedRoom && (
          <>
            <input
              type="text"
              placeholder="Enter team name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: "14px",
                width: "250px",
                marginBottom: "20px",
                background: "#333",
                color: "white",
                border: "1px solid #777",
                fontSize: "20px",
              }}
            />

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={createRoom}
                style={{
                  padding: "14px 30px",
                  fontSize: "18px",
                  background: "#888",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Create Room
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                style={{
                  padding: "14px",
                  width: "250px",
                  marginRight: "12px",
                  background: "#333",
                  color: "white",
                  border: "1px solid #777",
                  fontSize: "18px",
                }}
              />
              <button
                onClick={joinRoom}
                style={{
                  padding: "14px 30px",
                  fontSize: "18px",
                  background: "#888",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Join Room
              </button>
            </div>
          </>
        )}

        <p style={{ marginTop: "20px", fontSize: "22px" }}>
          <strong>Status:</strong> {message}
        </p>

        {joinedRoom && (
          <>
            <p style={{ fontSize: "22px" }}>
              <strong>Joined Room:</strong> {joinedRoom}
            </p>
            <p style={{ fontSize: "22px" }}>
              <strong>Players Count:</strong> {players.length}/4
            </p>

            <h3 style={{ fontSize: "36px", marginTop: "30px" }}>Players:</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "22px" }}>
              {players.map((player, index) => (
                <li key={player.id} style={{ margin: "10px 0" }}>
                  {index + 1}. {player.name}
                </li>
              ))}
            </ul>

            {isHost && !auctionStarted && (
              <button
                onClick={startAuction}
                style={{
                  marginTop: "25px",
                  padding: "14px 30px",
                  fontSize: "18px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Start Auction
              </button>
            )}

            {auctionStarted && currentPlayer && (
              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  border: "1px solid #555",
                  borderRadius: "12px",
                  background: "#11182c",
                }}
              >
                <h2 style={{ color: "lime", fontSize: "32px" }}>
                  Auction Started!
                </h2>

                <h2>{currentPlayer.name}</h2>
                <p>Role: {currentPlayer.role}</p>
                <p>Base Price: ₹{currentPlayer.basePrice} Cr</p>
                <p>Current Bid: ₹{currentBid} Cr</p>
                <p>Highest Bidder: {highestBidder || "No bids yet"}</p>

                <button
                  onClick={placeBid}
                  style={{
                    marginTop: "15px",
                    marginRight: "10px",
                    padding: "12px 24px",
                    fontSize: "18px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Place Bid (+0.5 Cr)
                </button>

                {isHost && (
                  <button
                    onClick={nextPlayer}
                    style={{
                      marginTop: "15px",
                      padding: "12px 24px",
                      fontSize: "18px",
                      background: "#ff9800",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Next Player
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;