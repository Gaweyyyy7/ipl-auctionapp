import { useState } from "react";

export default function AuctionPanel({
  auctionStarted,
  currentPlayer,
  currentBid,
  highestBidder,
  highestBidderFranchise,
  timer,
  pinnedMessage,
  pinnedTheme,
  selectedFranchise,
  roleColors,
  teamThemes,
  onPlaceBid,
  onNextPlayer,
  isHost,
  currentPlayerIndex,
  auctionPlayers,
  currentFranchise,
}) {
  const [showPlayers, setShowPlayers] = useState(false);

  if (!auctionStarted || !currentPlayer) return null;

  const remainingPlayers = auctionPlayers ? auctionPlayers.slice(currentPlayerIndex + 1) : [];

  return (
    <div style={{ background: "#11182c", border: "1px solid #555", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h2 style={{ color: "lime", fontSize: "18px", margin: "0" }}>Auction Live</h2>
        <button
          onClick={() => setShowPlayers(!showPlayers)}
          style={{
            padding: "4px 10px",
            fontSize: "11px",
            background: "transparent",
            color: "#aaa",
            border: "1px solid #666",
            cursor: "pointer",
            borderRadius: "4px",
            textDecoration: "underline",
          }}
        >
          Auction Players
        </button>
      </div>

      {showPlayers && remainingPlayers.length > 0 && (
        <div
          onClick={() => setShowPlayers(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            padding: "16px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#10182a",
              border: "1px solid #334",
              borderRadius: "14px",
              boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #243048" }}>
              <div>
                <div style={{ color: "#FFD700", fontSize: "13px", fontWeight: "700" }}>Auction Players</div>
                <div style={{ color: "#8ea0c0", fontSize: "10px" }}>{remainingPlayers.length} players coming next</div>
              </div>
              <button
                onClick={() => setShowPlayers(false)}
                style={{ background: "transparent", color: "#aaa", border: "none", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ maxHeight: "320px", overflowY: "auto", padding: "10px 12px" }}>
              {remainingPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  style={{
                    padding: "8px 10px",
                    marginBottom: "6px",
                    background: "#17233b",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#d7def0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: "700", color: "#fff" }}>{currentPlayerIndex + idx + 2}.</span> {player.name}
                  </div>
                  <span style={{ color: "#8ec5ff", fontSize: "10px", whiteSpace: "nowrap" }}>₹{player.basePrice}Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <h3 style={{ margin: "0", fontSize: "14px" }}>{currentPlayer.name}</h3>
        {roleColors[currentPlayer.role] && (
          <span style={{ color: "#FFD700", fontSize: "11px", fontWeight: "400", textTransform: "uppercase" }}>
            {currentPlayer.role}
          </span>
        )}
      </div>
      <p style={{ fontSize: "11px", margin: "4px 0" }}>Type: {currentPlayer.overseas}</p>
      <p style={{ fontSize: "11px", margin: "4px 0" }}>Base Price: Rs.{currentPlayer.basePrice} Cr</p>
      <p style={{ fontSize: "11px", margin: "4px 0" }}>Current Bid: Rs.{currentBid} Cr</p>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
        {highestBidderFranchise && teamThemes[highestBidderFranchise]?.logo && (
          <img src={teamThemes[highestBidderFranchise].logo} alt={highestBidderFranchise} style={{ width: "20px", height: "20px", objectFit: "contain" }} />
        )}
        <p style={{ margin: "0", fontSize: "11px" }}>Highest Bidder: {highestBidder || "No bids yet"}</p>
      </div>

      <p style={{ fontSize: "11px", margin: "4px 0" }}>Time Left: {timer}s</p>

      {pinnedMessage && (
        <div style={{
          background: pinnedTheme ? `linear-gradient(135deg, ${pinnedTheme.color}33, ${pinnedTheme.secondaryColor}33)` : "#2a2a2a",
          border: `1px solid ${pinnedTheme ? pinnedTheme.color : "#888"}`,
          borderRadius: "6px",
          padding: "8px 10px",
          margin: "8px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          {pinnedTheme?.logo && (
            <img src={pinnedTheme.logo} alt="winner" style={{ width: "24px", height: "24px", objectFit: "contain", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: "11px", fontWeight: "bold", color: pinnedTheme ? pinnedTheme.color : "#ccc" }}>
            {pinnedMessage}
          </span>
        </div>
      )}

      {currentFranchise && highestBidderFranchise !== currentFranchise && (
        <button
          onClick={onPlaceBid}
          style={{ marginTop: "8px", marginRight: "8px", padding: "8px 16px", fontSize: "12px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "6px" }}
        >
          Place Bid (+0.5 Cr)
        </button>
      )}

      {isHost && (
        <button
          onClick={onNextPlayer}
          style={{ marginTop: "8px", padding: "8px 16px", fontSize: "12px", background: "#ff9800", color: "white", border: "none", cursor: "pointer", borderRadius: "6px" }}
        >
          Next Player
        </button>
      )}
    </div>
  );
}