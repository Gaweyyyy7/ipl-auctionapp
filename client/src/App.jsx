import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

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

function App() {
  const [username, setUsername] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [highestBidderFranchise, setHighestBidderFranchise] = useState("");

  const [timer, setTimer] = useState(10);
  const [franchises, setFranchises] = useState({});
  const [availableTeams, setAvailableTeams] = useState(IPL_TEAMS);
  const [soldMessage, setSoldMessage] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setMessage("Connected to server");
    });

    socket.on("room_created", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setIsHost(true);
      setMessage(`Room created: ${data.roomCode}`);
      setSoldMessage("");
    });

    socket.on("join_success", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setIsHost(socket.id === data.hostId);
      setMessage(`Joined room: ${data.roomCode}`);
    });

    socket.on("players_update", (data) => {
      setPlayers(data.players || []);
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setFranchises(data.franchises || {});
    });

    socket.on("auction_started", (data) => {
      setAuctionStarted(true);
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setHighestBidderFranchise(data.highestBidderFranchise || "");
      setFranchises(data.franchises || {});
      setSoldMessage("");
      setTimer(10);
      setMessage("Auction has started!");
    });

    socket.on("bid_updated", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setHighestBidderFranchise(data.highestBidderFranchise || "");
      setFranchises(data.franchises || {});
    });

    socket.on("timer_update", (time) => {
      setTimer(time);
    });

    socket.on("player_sold", (data) => {
      setSoldMessage(
        `${data.player} SOLD to ${data.winner} for ₹${data.price} Cr`
      );
      setFranchises(data.franchises || {});
    });

    socket.on("player_unsold", (data) => {
      setSoldMessage(`${data.player} UNSOLD`);
    });

    socket.on("next_player_started", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setHighestBidderFranchise(data.highestBidderFranchise || "");
      setFranchises(data.franchises || {});
      setSoldMessage("");
      setTimer(10);
    });

    socket.on("auction_finished", (data) => {
      setAuctionStarted(false);
      setCurrentPlayer(null);
      setFranchises(data?.franchises || {});
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
      socket.off("timer_update");
      socket.off("player_sold");
      socket.off("player_unsold");
      socket.off("next_player_started");
      socket.off("auction_finished");
      socket.off("join_error");
    };
  }, []);

  const createRoom = () => {
    if (!username.trim() || !selectedFranchise) {
      setMessage("Enter owner name and select a franchise");
      return;
    }

    socket.emit("create_room", {
      username: username.trim(),
      franchise: selectedFranchise,
    });
  };

  const joinRoom = () => {
    if (!username.trim() || !roomCode.trim() || !selectedFranchise) {
      setMessage("Enter owner name, room code, and franchise");
      return;
    }

    socket.emit("join_room", {
      roomCode: roomCode.toUpperCase().trim(),
      username: username.trim(),
      franchise: selectedFranchise,
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
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "10px", textAlign: "center" }}>
        IPL Auction App
      </h1>

      <p style={{ textAlign: "center", fontSize: "18px" }}>
        <strong>Status:</strong> {message}
      </p>

      {!joinedRoom && (
        <div style={{ maxWidth: "700px", margin: "30px auto", textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter owner name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "12px",
              width: "260px",
              marginBottom: "15px",
              background: "#333",
              color: "white",
              border: "1px solid #777",
              fontSize: "18px",
            }}
          />

          <br />

          <select
            value={selectedFranchise}
            onChange={(e) => setSelectedFranchise(e.target.value)}
            style={{
              padding: "12px",
              width: "290px",
              marginBottom: "20px",
              background: "#333",
              color: "white",
              border: "1px solid #777",
              fontSize: "18px",
            }}
          >
            <option value="">Select Franchise</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={createRoom}
              style={{
                padding: "12px 28px",
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
                padding: "12px",
                width: "220px",
                marginRight: "10px",
                background: "#333",
                color: "white",
                border: "1px solid #777",
                fontSize: "18px",
              }}
            />
            <button
              onClick={joinRoom}
              style={{
                padding: "12px 28px",
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
        </div>
      )}

      {joinedRoom && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "24px",
            maxWidth: "1400px",
            margin: "30px auto 0",
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                background: "#11182c",
                border: "1px solid #444",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontSize: "22px" }}>
                <strong>Joined Room:</strong> {joinedRoom}
              </p>
              <p style={{ fontSize: "22px" }}>
                <strong>Players Joined:</strong> {players.length}/10
              </p>

              <h3 style={{ fontSize: "28px", marginTop: "20px" }}>Owners</h3>
              <ul style={{ listStyle: "none", padding: 0, fontSize: "18px" }}>
                {players.map((player, index) => (
                  <li key={player.id} style={{ margin: "8px 0" }}>
                    {index + 1}. {player.name} — {player.franchise}
                  </li>
                ))}
              </ul>

              {isHost && !auctionStarted && (
                <button
                  onClick={startAuction}
                  style={{
                    marginTop: "20px",
                    padding: "12px 24px",
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
            </div>

            {auctionStarted && currentPlayer && (
              <div
                style={{
                  background: "#11182c",
                  border: "1px solid #555",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h2 style={{ color: "lime", fontSize: "30px" }}>Auction Live</h2>

                <h2>{currentPlayer.name}</h2>
                <p>Role: {currentPlayer.role}</p>
                <p>Base Price: ₹{currentPlayer.basePrice} Cr</p>
                <p>Current Bid: ₹{currentBid} Cr</p>
                <p>Highest Bidder: {highestBidder || "No bids yet"}</p>
                <p>
                  Highest Franchise: {highestBidderFranchise || "No bids yet"}
                </p>
                <p>⏱️ Time Left: {timer}s</p>
                <p style={{ color: "orange", fontWeight: "bold" }}>
                  {soldMessage}
                </p>

                <button
                  onClick={placeBid}
                  style={{
                    marginTop: "12px",
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
                      marginTop: "12px",
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
          </div>

          <div
            style={{
              background: "#11182c",
              border: "1px solid #444",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h2 style={{ marginBottom: "18px" }}>Franchise Table</h2>

            {IPL_TEAMS.map((team) => {
              const data = franchises[team];

              return (
                <div
                  key={team}
                  style={{
                    marginBottom: "18px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #333",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>{team}</div>
                  <div>Purse: ₹{data ? data.purse.toFixed(2) : STARTING_PURSE.toFixed(2)} Cr</div>
                  <div style={{ marginTop: "6px" }}>
                    Players:
                    {data && data.players.length > 0 ? (
                      <table
                        style={{
                          width: "100%",
                          marginTop: "8px",
                          borderCollapse: "collapse",
                          fontSize: "14px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Name</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Role</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.players.map((p, idx) => (
                            <tr key={`${team}-${idx}`}>
                              <td style={{ paddingTop: "4px" }}>{p.name}</td>
                              <td style={{ paddingTop: "4px" }}>{p.role}</td>
                              <td style={{ paddingTop: "4px" }}>₹{p.price} Cr</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span> None</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;