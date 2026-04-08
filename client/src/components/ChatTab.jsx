import { useEffect, useRef } from "react";

export default function ChatTab({
  feedMessages,
  chatMessages,
  chatInput,
  setChatInput,
  onSendChat,
  username,
  selectedFranchise,
  teamThemes,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [feedMessages, chatMessages]);

  const getTeamAbbr = (franchise) => {
    const theme = teamThemes[franchise];
    return theme?.abbr || franchise?.substring(0, 3).toUpperCase() || "";
  };

  const getTeamHashtags = (franchise) => {
    const tags = {
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
    return tags[franchise] || [];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "500px" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", marginBottom: "12px", paddingRight: "4px" }}>
        {feedMessages.length === 0 && chatMessages.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#666" }}>No activity yet.</p>
        ) : (
          <>
            {feedMessages.map((msg, i) => {
              const playerTheme = teamThemes[msg.franchise];
              const teamAbbr = getTeamAbbr(msg.franchise);
              const hashtags = getTeamHashtags(msg.franchise);

              if (msg.type === "sold" && msg.franchise && playerTheme) {
                // Extract player name and price from message (format: "PlayerName - ₹XCr")
                const parts = msg.text.split(" - ");
                const playerName = parts[0] || msg.text;
                const price = parts[1] || "";
                const hashtag = hashtags.length > 0 ? hashtags.slice(0, 1)[0] : "";

                return (
                  <div
                    key={`feed-${i}`}
                    style={{
                      marginBottom: "10px",
                      borderRadius: "9px",
                      overflow: "hidden",
                      background: `linear-gradient(90deg, ${playerTheme.color}d8 0%, ${playerTheme.secondaryColor}d8 100%)`,
                      border: `1px solid ${playerTheme.color}66`,
                      padding: "8px 10px 7px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", minHeight: "30px" }}>
                      {playerTheme?.logo && (
                        <img
                          src={playerTheme.logo}
                          alt={msg.franchise}
                          style={{
                            width: "24px",
                            height: "24px",
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span
                          style={{
                            color: "white",
                            fontWeight: "800",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {playerName}
                        </span>
                        <span style={{ color: "#FFD700", fontWeight: "700", fontSize: "10px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          SOLD
                        </span>
                        <span style={{ color: "white", fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap", marginLeft: "auto" }}>
                          {price}
                        </span>
                      </div>
                    </div>
                    {hashtag && (
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px", fontStyle: "italic", lineHeight: "1", paddingLeft: "34px" }}>
                        {hashtag}
                      </div>
                    )}
                  </div>
                );
              }

              if (msg.type === "bid" && msg.franchise && playerTheme) {
                return (
                  <div
                    key={`feed-${i}`}
                    style={{
                      marginBottom: "10px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      borderLeft: `3px solid ${playerTheme.color}`,
                      background: `linear-gradient(90deg, ${playerTheme.color}12, ${playerTheme.secondaryColor}12)`,
                      border: `1px solid ${playerTheme.color}22`,
                      padding: "8px 10px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      minHeight: "42px",
                    }}
                  >
                    {playerTheme?.logo && (
                      <img
                        src={playerTheme.logo}
                        alt={msg.franchise}
                        style={{
                          width: "22px",
                          height: "22px",
                          objectFit: "contain",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#ddd", lineHeight: "1.15", whiteSpace: "nowrap", overflow: "hidden" }}>
                        <span
                          style={{
                            color: playerTheme?.color || "white",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {teamAbbr}
                        </span>
                        <span style={{ color: "#999" }}>bids</span>
                        <span style={{ color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.text}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // System messages
              if (msg.text.startsWith("NEXT_PLAYER:")) {
                const playerName = msg.text.replace("NEXT_PLAYER:", "");
                return (
                  <div key={`feed-${i}`} style={{ fontSize: "12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "#999" }}>Next player:</span>
                    <span style={{ color: "#FFD700", fontWeight: "bold", fontSize: "14px" }}>{playerName}</span>
                  </div>
                );
              }
              
              return (
                <div key={`feed-${i}`} style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                  {msg.text}
                </div>
              );
            })}
            {chatMessages.map((msg, i) => {
              const playerTheme = teamThemes[msg.franchise];
              return (
                <div key={`chat-${i}`} style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {playerTheme?.logo && (
                    <img src={playerTheme.logo} alt={msg.franchise} style={{ width: "20px", height: "20px", objectFit: "contain", borderRadius: "50%", flexShrink: 0 }} />
                  )}
                  <span style={{ color: playerTheme?.color || "white", fontWeight: "600", fontSize: "11px" }}>{msg.name}:</span>
                  <span style={{ color: "#ccc", fontSize: "11px" }}>{msg.text}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid #333" }}>
        <input
          type="text"
          placeholder="Type message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && chatInput.trim()) {
              onSendChat({ name: username, franchise: selectedFranchise, text: chatInput });
            }
          }}
          style={{ flex: 1, padding: "8px", background: "#1a2a4a", color: "white", border: "1px solid #444", borderRadius: "4px", fontSize: "12px", outline: "none" }}
        />
        <button
          onClick={() => {
            if (chatInput.trim()) {
              onSendChat({ name: username, franchise: selectedFranchise, text: chatInput });
            }
          }}
          style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}