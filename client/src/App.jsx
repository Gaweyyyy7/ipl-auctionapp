import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import PlayersTab from "./components/PlayersTab";
import ChatTab from "./components/ChatTab";
import AuctionPanel from "./components/AuctionPanel";
import FranchiseTable from "./components/FranchiseTable";

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
  "Batsman": { bg: "#1a5c9c", text: "#87CEEB", abbr: "BAT", emoji: "🏏" },
  "Wicketkeeper": { bg: "#5c1a1a", text: "#ff9999", abbr: "WK", emoji: "🧤" },
  "Bowler": { bg: "#1a5c2a", text: "#90ee90", abbr: "BOW", emoji: "🎾" },
  "All-Rounder": { bg: "#5c3d1a", text: "#ffd700", abbr: "AR", emoji: "⭐" },
};

const CELEBRATION_MESSAGES = [
  "Welcome to the family! 🎊",
  "Your new home awaits! 🏏",
  "Let's bring home the trophy! 🏆",
  "Time to shine at the crease! ⭐",
  "Ready to make history! 🔥",
  "A new star joins the army! 💪",
  "Here comes the game changer! 💥",
  "Welcome aboard the winning team! 🚀",
  "Your journey begins here! 🎯",
  "Time to create magic! ✨",
];

const TEAM_HASHTAGS = {
  "Chennai Super Kings": ["#WelcomeToAnbuDen", "#YellowArmy", "#WhistlePodu"],
  "Mumbai Indians": ["#DilDilMumbai", "#BlueArmy", "#OneFamily"],
  "Kolkata Knight Riders": ["#KorboLorboJeetbo", "#PurpleAndGold", "#AmiKKR"],
  "Royal Challengers Bengaluru": ["#PlayBold", "#EeSalaCupNamde", "#RedArmy"],
  "Rajasthan Royals": ["#HallaBol", "#RoyalsFamily", "#PinkArmy"],
  "Delhi Capitals": ["#DilWaliDilli", "#RoarKaro", "#BlueAndRed"],
  "Punjab Kings": ["#SaddaPunjab", "#PunjabiVibe", "#KingsArmy"],
  "Sunrisers Hyderabad": ["#OrangeArmy", "#RiseWithUs", "#SunrisersUnited"],
  "Gujarat Titans": ["#AavaDe", "#TitansUnited", "#BlueAndGold"],
  "Lucknow Super Giants": ["#JeetegaLucknow", "#SuperGiantArmy", "#LucknowKaJazbaa"],
};

const TEAM_THEMES = {
  "Chennai Super Kings": {
    color: "#FFD700",
    secondaryColor: "#0A2463",
    abbr: "CSK",
    abbrBg: "#FFD700",
    abbrText: "#0A2463",
    logo: "/logos/csk.png",
  },
  "Delhi Capitals": {
    color: "#004C97",
    secondaryColor: "#EF1C25",
    abbr: "DC",
    abbrBg: "#004C97",
    abbrText: "#ffffff",
    logo: "/logos/dc.png",
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
    color: "#3A225D",
    secondaryColor: "#B3862E",
    abbr: "KKR",
    abbrBg: "#3A225D",
    abbrText: "#B3862E",
    logo: "logos/kolkata.png",
  },
  "Lucknow Super Giants": {
    color: "#9d0303",
    secondaryColor: "#bcad00",
    abbr: "LSG",
    abbrBg: "#A72056",
    abbrText: "#00B4D8",
  logo: "/logos/lsg.png"  },

  "Mumbai Indians": {
    color: "#004BA0",
    secondaryColor: "#D4AF37",
    abbr: "MI",
    abbrBg: "#004BA0",
    abbrText: "#D4AF37",
    logo: "/logos/mumbai.png",
  },
  "Punjab Kings": {
    color: "#C41E3A",
    secondaryColor: "#FFD700",
    abbr: "PBKS",
    abbrBg: "#C41E3A",
    abbrText: "#FFD700",
    logo: "/logos/punjk.png",
  },
  "Rajasthan Royals": {
    color: "#E8447A",
    secondaryColor: "#2A52BE",
    abbr: "RR",
    abbrBg: "#E8447A",
    abbrText: "#ffffff",
    logo: "/logos/rr1.png",
  },
  "Royal Challengers Bengaluru": {
    color: "#b40c12",
    secondaryColor: "#b19a05",
    abbr: "RCB",
    abbrBg: "#EC1C24",
    abbrText: "#ffffff",
    logo: "/logos/rcb.png",
  },
  "Sunrisers Hyderabad": {
    color: "#c2590f",
    secondaryColor: "#000000",
    abbr: "SRH",
    abbrBg: "#FF822A",
    abbrText: "#000000",
    logo: "/logos/srh.png",
  },
};

const STARTING_PURSE = 125;

function App() {
  const [username, setUsername] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState("");
  const [currentFranchise, setCurrentFranchise] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [activeTab, setActiveTab] = useState("players");
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [expandedFranchise, setExpandedFranchise] = useState(null);

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [highestBidderFranchise, setHighestBidderFranchise] = useState("");
  const [hostId, setHostId] = useState("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [auctionPlayers, setAuctionPlayers] = useState([]);

  const [timer, setTimer] = useState(7);
  const [franchises, setFranchises] = useState({});
  const [availableTeams, setAvailableTeams] = useState(IPL_TEAMS);
  const [pinnedMessage, setPinnedMessage] = useState("");
  const [pinnedFranchise, setPinnedFranchise] = useState("");
  const [feedMessages, setFeedMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const addFeedMessage = (msg, type = "bid", franchise = "", username = "") => {
    setFeedMessages((prev) => {
      const updated = [
        ...prev,
        { text: msg, type, franchise, username, time: new Date().toLocaleTimeString() },
      ];
      return updated.slice(-5);
    });
  };

  useEffect(() => {
    socket.on("connect", () => {
      setMessage("Connected to server");
    });

    socket.on("room_created", (data) => {
      setJoinedRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players || []);
      setIsHost(true);
      setCurrentFranchise(data.franchise || selectedFranchise);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setMessage("Room created successfully!");
    });

    socket.on("join_success", (data) => {
      setJoinedRoom(data.roomCode);
      setPlayers(data.players || []);
      setHostId(data.hostId);
      setCurrentFranchise(data.franchise || selectedFranchise);
      setFranchises(data.franchises || {});
      setAvailableTeams(data.availableTeams || IPL_TEAMS);
      setMessage("Joined room successfully!");
      setRoomCode("");
      setSelectedFranchise("");
    });

    socket.on("players_update", (data) => {
      setPlayers(data.players);
      setFranchises(data.franchises);
      setAvailableTeams(data.availableTeams);
    });

    socket.on("auction_started", (data) => {
      setAuctionStarted(true);
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(null);
      setHighestBidderFranchise("");
      setAuctionPlayers(data.auctionPlayers || []);
      setCurrentPlayerIndex(data.currentPlayerIndex || 0);
      addFeedMessage(`Auction started! Player: ${data.currentPlayer.name}`, "system");
    });

    socket.on("bid_updated", (data) => {
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder);
      setHighestBidderFranchise(data.highestBidderFranchise);
      
      // Find the bidding player to get their username
      const biddingPlayer = players.find(p => p.franchise === data.highestBidderFranchise);
      const bidderUsername = biddingPlayer ? biddingPlayer.name : data.highestBidder;
      
      addFeedMessage(
        `${data.currentPlayer.name} - ₹${data.currentBid}Cr`,
        "bid",
        data.highestBidderFranchise,
        bidderUsername
      );
    });

    socket.on("timer_update", (timeLeft) => {
      setTimer(timeLeft);
    });

    socket.on("player_sold", (data) => {
      const message = `${data.player} - ₹${data.price}Cr`;
      addFeedMessage(message, "sold", data.winner);
      setPinnedMessage(`${data.player} sold to ${data.winner} for ₹${data.price}Cr`);
      setPinnedFranchise(data.winner);
      setFranchises(data.franchises || {});
    });

    socket.on("player_unsold", (data) => {
      addFeedMessage(`${data.player} went unsold`, "unsold");
    });

    socket.on("next_player_started", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(null);
      setHighestBidderFranchise("");
      setPinnedMessage("");
      setCurrentPlayerIndex(data.currentPlayerIndex || 0);
      setAuctionPlayers(data.auctionPlayers || []);
      addFeedMessage("NEXT_PLAYER:" + data.currentPlayer.name, "system");
    });

    socket.on("auction_finished", () => {
      setAuctionStarted(false);
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
    setRoomCode("");
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
  const sendChatMessage = (chatMessage) => {
    const franchise = currentFranchise || selectedFranchise;
    setChatMessages((prev) => [...prev, { ...chatMessage, franchise }]);
    setChatInput("");
  };

  const getFeedBubbleStyle = (type, franchise = "") => {
    const base = {
      padding: "8px 12px",
      borderRadius: "10px",
      marginBottom: "8px",
      fontSize: "14px",
      lineHeight: "1.4",
    };
    if ((type === "bid" || type === "sold") && franchise && TEAM_THEMES[franchise]) {
      const theme = TEAM_THEMES[franchise];
      return {
        ...base,
        background: `linear-gradient(135deg, ${theme.color}33, ${theme.secondaryColor}33)`,
        borderLeft: `4px solid ${theme.color}`,
        borderRight: `4px solid ${theme.secondaryColor}`,
        color: "white",
      };
    }
    if (type === "celebration" && franchise && TEAM_THEMES[franchise]) {
      const theme = TEAM_THEMES[franchise];
      return {
        ...base,
        background: `linear-gradient(135deg, ${theme.color}33, ${theme.secondaryColor}33)`,
        borderLeft: `4px solid ${theme.color}`,
        borderRight: `4px solid #FFD700`,
        color: "white",
        fontStyle: "italic",
      };
    }
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
    <div style={{ minHeight: "100vh", background: "#0b1020", color: "white", fontFamily: "'Poppins', sans-serif", padding: "20px" }}>
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
          <div>
            <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", margin: "4px 0" }}><strong>Joined Room:</strong> {joinedRoom}</p>
              <p style={{ fontSize: "14px", margin: "8px 0" }}><strong>Players Joined:</strong> {players.length}/10</p>

              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "16px", marginTop: "16px" }}>
                <button onClick={() => setActiveTab("players")} style={tabStyle("players")}>
                  Players <span style={{ background: "#333", borderRadius: "10px", padding: "1px 7px", fontSize: "12px" }}>{players.length}/10</span>
                </button>
                <button onClick={() => setActiveTab("settings")} style={tabStyle("settings")}>Settings</button>
              </div>

              {activeTab === "players" && (
                <PlayersTab
                  players={players}
                  hostId={hostId}
                  expandedPlayer={expandedPlayer}
                  onTogglePlayer={setExpandedPlayer}
                />
              )}

              {activeTab === "settings" && (
                <div style={{ fontSize: "14px", color: "#aaa" }}>
                  <p>Room Code: <strong style={{ color: "white" }}>{joinedRoom}</strong></p>
                    <p>Your Franchise: <strong style={{ color: "white" }}>{currentFranchise || selectedFranchise}</strong></p>
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

            <AuctionPanel
              auctionStarted={auctionStarted}
              currentPlayer={currentPlayer}
              currentBid={currentBid}
              highestBidder={highestBidder}
              highestBidderFranchise={highestBidderFranchise}
              timer={timer}
              pinnedMessage={pinnedMessage}
              pinnedTheme={pinnedTheme}
              selectedFranchise={selectedFranchise}
              roleColors={ROLE_COLORS}
              teamThemes={TEAM_THEMES}
              onPlaceBid={placeBid}
              onNextPlayer={nextPlayer}
              isHost={isHost}
              currentPlayerIndex={currentPlayerIndex}
              auctionPlayers={auctionPlayers}
              currentFranchise={currentFranchise || selectedFranchise}
            />
          </div>

          <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", height: "600px" }}>
            <h2 style={{ marginBottom: "12px", fontSize: "22px" }}>Chat</h2>
            <ChatTab
              feedMessages={feedMessages}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendChat={sendChatMessage}
              username={username}
              selectedFranchise={currentFranchise || selectedFranchise}
              teamThemes={TEAM_THEMES}
            />
          </div>

          <FranchiseTable
            franchises={franchises}
            teamThemes={TEAM_THEMES}
            startingPurse={STARTING_PURSE}
            roleColors={ROLE_COLORS}
            expandedFranchise={expandedFranchise}
            onToggleFranchise={setExpandedFranchise}
          />
        </div>
      )}
    </div>
  );
}

export default App;