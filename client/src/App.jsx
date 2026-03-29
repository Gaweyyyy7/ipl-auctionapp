import { useEffect, useState, useRef } from "react";
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

const ROLE_COLORS = {
  "Batsman": { bg: "#1a5c9c", text: "#87CEEB", abbr: "BAT" },
  "Wicketkeeper": { bg: "#5c1a1a", text: "#ff9999", abbr: "WK" },
  "Bowler": { bg: "#1a5c2a", text: "#90ee90", abbr: "BOW" },
  "All-Rounder": { bg: "#5c3d1a", text: "#ffd700", abbr: "AR" },
};

const TEAM_THEMES = {
  "Chennai Super Kings": {
    color: "#FFD700",
    secondaryColor: "#0A2463",
    abbr: "CSK",
    abbrBg: "#FFD700",
    abbrText: "#0A2463",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",
  },
  "Delhi Capitals": {
    color: "#004C97",
    secondaryColor: "#EF1C25",
    abbr: "DC",
    abbrBg: "#004C97",
    abbrText: "#ffffff",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/Delhi_Capitals_Logo.svg",
  },
  "Gujarat Titans": {
    color: "#1C4C9C",
    secondaryColor: "#C8A84B",
    abbr: "GT",
    abbrBg: "#1C4C9C",
    abbrText: "#C8A84B",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",
  },
  "Kolkata Knight Riders": {
    color: "#B3862E",
    secondaryColor: "#3A225D",
    abbr: "KKR",
    abbrBg: "#3A225D",
    abbrText: "#B3862E",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",
  },
  "Lucknow Super Giants": {
    color: "#00B4D8",
    secondaryColor: "#A72056",
    abbr: "LSG",
    abbrBg: "#A72056",
    abbrText: "#00B4D8",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b1/Lucknow_Super_Giants_IPL_Logo.svg",
  },
  "Mumbai Indians": {
    color: "#004BA0",
    secondaryColor: "#D4AF37",
    abbr: "MI",
    abbrBg: "#004BA0",
    abbrText: "#D4AF37",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",
  },
  "Punjab Kings": {
    color: "#C41E3A",
    secondaryColor: "#FFD700",
    abbr: "PBKS",
    abbrBg: "#C41E3A",
    abbrText: "#FFD700",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo_2021.svg",
  },
  "Rajasthan Royals": {
    color: "#E8447A",
    secondaryColor: "#2A52BE",
    abbr: "RR",
    abbrBg: "#E8447A",
    abbrText: "#ffffff",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg",
  },
  "Royal Challengers Bengaluru": {
    color: "#EC1C24",
    secondaryColor: "#000000",
    abbr: "RCB",
    abbrBg: "#EC1C24",
    abbrText: "#ffffff",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bangalore_2020.svg",
  },
  "Sunrisers Hyderabad": {
    color: "#FF822A",
    secondaryColor: "#000000",
    abbr: "SRH",
    abbrBg: "#FF822A",
    abbrText: "#000000",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/3e/Sunrisers_Hyderabad.svg",
  },
};

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
  const [activeTab, setActiveTab] = useState("squad");
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [highestBidderFranchise, setHighestBidderFranchise] = useState("");
  const [hostId, setHostId] = useState("");

  const [timer, setTimer] = useState(7);
  const [franchises, setFranchises] = useState({});
  const [availableTeams, setAvailableTeams] = useState(IPL_TEAMS);
  const [pinnedMessage, setPinnedMessage] = useState("");
  const [pinnedFranchise, setPinnedFranchise] = useState("");
  const [feedMessages, setFeedMessages] = useState([]);

  const feedRef = useRef(null);

  const addFeedMessage = (msg, type = "bid", franchise = "") => {
    setFeedMessages((prev) => {
      const updated = [
        ...prev,
        { text: msg, type, franchise, time: new Date().toLocaleTimeString() },
      ];
      return updated.slice(-5);
    });
  };

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feedMessages]);

  useEffect(() => {
    socket.on("connect", () => {
      setMessage("Connected to server");
    });

    socket.on("room_created", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players || []);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setIsHost(true);
      setHostId(data.hostId);
      setMessage(`Room created: ${data.roomCode}`);
      setPinnedMessage("");
      setPinnedFranchise("");
    });

    socket.on("join_success", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players || []);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setIsHost(socket.id === data.hostId);
      setHostId(data.hostId);
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
      setPinnedMessage("");
      setPinnedFranchise("");
      setFeedMessages([]);
      setTimer(7);
      setMessage("Auction has started!");
      addFeedMessage(`Auction started! First up: ${data.currentPlayer.name}`, "system");
    });

    socket.on("bid_updated", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setHighestBidderFranchise(data.highestBidderFranchise || "");
      setFranchises(data.franchises || {});
      addFeedMessage(
        `${data.highestBidderFranchise} bid Rs.${data.currentBid} Cr for ${data.currentPlayer.name}`,
        "bid",
        data.highestBidderFranchise
      );
    });

    socket.on("timer_update", (time) => {
      setTimer(time);
    });

    socket.on("player_sold", (data) => {
      const msg = `${data.player} (${data.role}) sold to ${data.winner} for Rs.${data.price} Cr`;
      setPinnedMessage(msg);
      setPinnedFranchise(data.winner);
      setFranchises(data.franchises || {});
      addFeedMessage(`SOLD! ${msg}`, "sold");
    });

    socket.on("player_unsold", (data) => {
      const msg = `${data.player} went unsold`;
      setPinnedMessage(msg);
      setPinnedFranchise("");
      addFeedMessage(`UNSOLD: ${data.player}`, "unsold");
    });

    socket.on("next_player_started", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder || "");
      setHighestBidderFranchise(data.highestBidderFranchise || "");
      setFranchises(data.franchises || {});
      setPinnedMessage("");
      setPinnedFranchise("");
      setTimer(7);
      addFeedMessage(
        `Next up: ${data.currentPlayer.name} (Base: Rs.${data.currentBid} Cr)`,
        "system"
      );
    });

    socket.on("auction_finished", (data) => {
      setAuctionStarted(false);
      setCurrentPlayer(null);
      setFranchises(data?.franchises || {});
      setMessage("Auction finished!");
      setPinnedMessage("");
      setPinnedFranchise("");
      addFeedMessage("Auction has ended!", "system");
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
    socket.emit("create_room", { username: username.trim(), franchise: selectedFranchise });
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

  const startAuction = () => socket.emit("start_auction", joinedRoom);
  const placeBid = () => socket.emit("place_bid", { roomCode: joinedRoom });
  const nextPlayer = () => socket.emit("next_player", joinedRoom);

  const getFeedBubbleStyle = (type, franchise = "") => {
    const base = {
      padding: "8px 12px",
      borderRadius: "10px",
      marginBottom: "8px",
      fontSize: "14px",
      lineHeight: "1.4",
    };
    if (type === "bid" && franchise && TEAM_THEMES[franchise]) {
      const theme = TEAM_THEMES[franchise];
      return {
        ...base,
        background: `linear-gradient(135deg, ${theme.color}22, ${theme.secondaryColor}22)`,
        borderLeft: `3px solid ${theme.color}`,
        borderRight: `3px solid ${theme.secondaryColor}`,
        color: "white",
      };
    }
    if (type === "sold") return { ...base, background: "#1a3a1a", borderLeft: "3px solid #28a745" };
    if (type === "unsold") return { ...base, background: "#3a1a1a", borderLeft: "3px solid #dc3545" };
    return { ...base, background: "#2a2a2a", borderLeft: "3px solid #888" };
  };

  const pinnedTheme = pinnedFranchise ? TEAM_THEMES[pinnedFranchise] : null;

  const tabStyle = (tab) => ({
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    borderRadius: "8px",
    background: activeTab === tab ? "#1a5c2a" : "transparent",
    color: activeTab === tab ? "white" : "#aaa",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0b1020", color: "white", fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ fontSize: "48px", marginBottom: "10px", textAlign: "center" }}>IPL Auction App</h1>
      <p style={{ textAlign: "center", fontSize: "18px" }}><strong>Status:</strong> {message}</p>

      {!joinedRoom && (
        <div style={{ maxWidth: "700px", margin: "30px auto", textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter owner name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "12px", width: "260px", marginBottom: "15px", background: "#333", color: "white", border: "1px solid #777", fontSize: "18px" }}
          />
          <br />
          <select
            value={selectedFranchise}
            onChange={(e) => setSelectedFranchise(e.target.value)}
            style={{ padding: "12px", width: "290px", marginBottom: "20px", background: "#333", color: "white", border: "1px solid #777", fontSize: "18px" }}
          >
            <option value="">Select Franchise</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <div style={{ marginBottom: "20px" }}>
            <button onClick={createRoom} style={{ padding: "12px 28px", fontSize: "18px", background: "#888", color: "white", border: "none", cursor: "pointer" }}>
              Create Room
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              style={{ padding: "12px", width: "220px", marginRight: "10px", background: "#333", color: "white", border: "1px solid #777", fontSize: "18px" }}
            />
            <button onClick={joinRoom} style={{ padding: "12px 28px", fontSize: "18px", background: "#888", color: "white", border: "none", cursor: "pointer" }}>
              Join Room
            </button>
          </div>
        </div>
      )}

      {joinedRoom && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: "24px", maxWidth: "1600px", margin: "30px auto 0", alignItems: "start" }}>

          {/* LEFT: Room info + Auction */}
          <div>
            <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <p style={{ fontSize: "22px" }}><strong>Joined Room:</strong> {joinedRoom}</p>
              <p style={{ fontSize: "22px" }}><strong>Players Joined:</strong> {players.length}/10</p>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "16px", marginTop: "16px" }}>
                <button onClick={() => setActiveTab("activity")} style={tabStyle("activity")}>
                  Activity <span style={{ background: "#333", borderRadius: "10px", padding: "1px 7px", fontSize: "12px" }}>{feedMessages.length}</span>
                </button>
                <button onClick={() => setActiveTab("squad")} style={tabStyle("squad")}>
                  Squad <span style={{ background: "#333", borderRadius: "10px", padding: "1px 7px", fontSize: "12px" }}>{players.length}</span>
                </button>
                <button onClick={() => setActiveTab("community")} style={tabStyle("community")}>Community</button>
                <button onClick={() => setActiveTab("settings")} style={tabStyle("settings")}>Settings</button>
              </div>

              {/* Squad Tab */}
              {activeTab === "squad" && (
                <div>
                  {players.map((player) => {
                    const theme = TEAM_THEMES[player.franchise];
                    const isExpanded = expandedPlayer === player.id;
                    const isPlayerHost = player.id === hostId;
                    const franchiseData = franchises[player.franchise];
                    return (
                      <div
                        key={player.id}
                        style={{ borderBottom: "1px solid #222", paddingBottom: "12px", marginBottom: "12px" }}
                      >
                        <div
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                          onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28a745", flexShrink: 0 }} />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: "bold", fontSize: "16px" }}>{player.name}</span>
                                {isPlayerHost && (
                                  <span style={{ background: "#5a2d8a", color: "white", fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: "bold" }}>HOST</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                <span style={{
                                  background: theme?.abbrBg || "#333",
                                  color: theme?.abbrText || "white",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}>
                                  {theme?.abbr || "?"}
                                </span>
                                <span style={{ fontSize: "13px", color: "#aaa" }}>{player.franchise}</span>
                              </div>
                            </div>
                          </div>
                          <span style={{ color: "#aaa", fontSize: "18px" }}>{isExpanded ? "∧" : "∨"}</span>
                        </div>

                        {isExpanded && franchiseData && (
                          <div style={{ marginTop: "10px", paddingLeft: "20px" }}>
                            <p style={{ fontSize: "13px", color: "#ccc", margin: "4px 0" }}>
                              Purse: Rs.{franchiseData.purse.toFixed(2)} Cr
                            </p>
                            <p style={{ fontSize: "13px", color: "#ccc", margin: "4px 0" }}>
                              Players bought: {franchiseData.players.length}
                            </p>
                            {franchiseData.players.length > 0 && (
                              <div style={{ margin: "6px 0" }}>
                                {franchiseData.players.map((p, i) => {
                                  const roleColors = ROLE_COLORS[p.role] || { bg: "#333", text: "#999", abbr: "?" };
                                  return (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", fontSize: "12px", color: "#aaa" }}>
                                      <span style={{
                                        background: roleColors.bg,
                                        color: roleColors.text,
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        minWidth: "32px",
                                        textAlign: "center",
                                      }}>
                                        {roleColors.abbr}
                                      </span>
                                      <span>{p.name}</span>
                                      <span style={{ color: "#666" }}>—</span>
                                      <span style={{ color: "#28a745" }}>Rs.{p.price} Cr</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "activity" && (
                <div style={{ fontSize: "14px", color: "#aaa" }}>
                  {feedMessages.length === 0 ? "No activity yet." : feedMessages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: "8px", color: "#ccc" }}>
                      <span style={{ color: "#666", fontSize: "11px", marginRight: "6px" }}>{msg.time}</span>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "community" && (
                <p style={{ color: "#666", fontSize: "14px" }}>Community features coming soon.</p>
              )}

              {activeTab === "settings" && (
                <div style={{ fontSize: "14px", color: "#aaa" }}>
                  <p>Room Code: <strong style={{ color: "white" }}>{joinedRoom}</strong></p>
                  <p>Your Franchise: <strong style={{ color: "white" }}>{selectedFranchise}</strong></p>
                </div>
              )}

              {isHost && !auctionStarted && (
                <button
                  onClick={startAuction}
                  style={{ marginTop: "20px", padding: "12px 24px", fontSize: "18px", background: "#28a745", color: "white", border: "none", cursor: "pointer", borderRadius: "8px" }}
                >
                  Start Auction
                </button>
              )}
            </div>

            {/* Auction Panel */}
            {auctionStarted && currentPlayer && (
              <div style={{ background: "#11182c", border: "1px solid #555", borderRadius: "12px", padding: "20px" }}>
                <h2 style={{ color: "lime", fontSize: "30px" }}>Auction Live</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0 }}>{currentPlayer.name}</h2>
                  {ROLE_COLORS[currentPlayer.role] && (
                    <span style={{
                      background: ROLE_COLORS[currentPlayer.role].bg,
                      color: ROLE_COLORS[currentPlayer.role].text,
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "14px",
                      textTransform: "uppercase",
                    }}>
                      {currentPlayer.role}
                    </span>
                  )}
                </div>
                <p>Type: {currentPlayer.overseas}</p>
                <p>Base Price: Rs.{currentPlayer.basePrice} Cr</p>
                <p>Current Bid: Rs.{currentBid} Cr</p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
                  {highestBidderFranchise && TEAM_THEMES[highestBidderFranchise]?.logo && (
                    <img src={TEAM_THEMES[highestBidderFranchise].logo} alt={highestBidderFranchise} style={{ width: "28px", height: "28px", objectFit: "contain" }} />
                  )}
                  <p style={{ margin: 0 }}>Highest Bidder: {highestBidder || "No bids yet"}</p>
                </div>

                <p>Time Left: {timer}s</p>

                {/* Pinned sold/unsold result */}
                {pinnedMessage && (
                  <div style={{
                    background: pinnedTheme
                      ? `linear-gradient(135deg, ${pinnedTheme.color}33, ${pinnedTheme.secondaryColor}33)`
                      : "#2a2a2a",
                    border: `1px solid ${pinnedTheme ? pinnedTheme.color : "#888"}`,
                    borderRadius: "8px",
                    padding: "10px 14px",
                    margin: "10px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}>
                    {pinnedTheme?.logo && (
                      <img src={pinnedTheme.logo} alt={pinnedFranchise} style={{ width: "32px", height: "32px", objectFit: "contain", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: pinnedTheme ? pinnedTheme.color : "#ccc" }}>
                      {pinnedMessage}
                    </span>
                  </div>
                )}

                {highestBidderFranchise !== selectedFranchise && (
                  <button
                    onClick={placeBid}
                    style={{ marginTop: "12px", marginRight: "10px", padding: "12px 24px", fontSize: "18px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "8px" }}
                  >
                    Place Bid (+0.5 Cr)
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={nextPlayer}
                    style={{ marginTop: "12px", padding: "12px 24px", fontSize: "18px", background: "#ff9800", color: "white", border: "none", cursor: "pointer", borderRadius: "8px" }}
                  >
                    Next Player
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE: Live Feed */}
          <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", height: "600px" }}>
            <h2 style={{ marginBottom: "12px", fontSize: "22px" }}>Live Feed</h2>

            <div ref={feedRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
              {feedMessages.length === 0 && (
                <p style={{ color: "#666", fontSize: "14px" }}>Waiting for auction to start...</p>
              )}
              {feedMessages.map((msg, index) => (
                <div key={index} style={getFeedBubbleStyle(msg.type, msg.franchise)}>
                  {msg.franchise && TEAM_THEMES[msg.franchise]?.logo && (
                    <img src={TEAM_THEMES[msg.franchise].logo} alt={msg.franchise} style={{ width: "18px", height: "18px", objectFit: "contain", marginRight: "6px", verticalAlign: "middle" }} />
                  )}
                  <span style={{ color: "#aaa", fontSize: "11px", marginRight: "8px" }}>{msg.time}</span>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Franchise Table */}
          <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "20px", maxHeight: "600px", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "18px" }}>Franchise Table</h2>
            {IPL_TEAMS.map((team) => {
              const data = franchises[team];
              const theme = TEAM_THEMES[team];
              return (
                <div key={team} style={{ marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #333" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    {theme?.logo && (
                      <img src={theme.logo} alt={team} style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    )}
                    <span style={{ fontWeight: "bold", fontSize: "16px", color: theme?.color || "white" }}>{team}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#ccc" }}>
                    Purse: Rs.{data ? data.purse.toFixed(2) : STARTING_PURSE.toFixed(2)} Cr
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    Players:
                    {data && data.players.length > 0 ? (
                      <table style={{ width: "100%", marginTop: "8px", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555", paddingBottom: "4px" }}>Name</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555", paddingBottom: "4px" }}>Role</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555", paddingBottom: "4px" }}>Type</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #555", paddingBottom: "4px" }}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.players.map((player, index) => {
                            const roleColors = ROLE_COLORS[player.role] || { bg: "#333", text: "#999", abbr: "?" };
                            return (
                              <tr key={`${team}-${index}`}>
                                <td style={{ paddingTop: "4px" }}>{player.name}</td>
                                <td style={{ paddingTop: "4px" }}>
                                  <span style={{
                                    background: roleColors.bg,
                                    color: roleColors.text,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "bold",
                                    fontSize: "11px",
                                  }}>
                                    {player.role}
                                  </span>
                                </td>
                                <td style={{ paddingTop: "4px", fontSize: "12px", color: "#999" }}>{player.overseas}</td>
                                <td style={{ paddingTop: "4px" }}>Rs.{player.price} Cr</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <span style={{ color: "#666" }}> None</span>
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