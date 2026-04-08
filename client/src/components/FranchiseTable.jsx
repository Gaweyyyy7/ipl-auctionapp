export default function FranchiseTable({
  franchises,
  teamThemes,
  startingPurse,
  roleColors,
  expandedFranchise,
  onToggleFranchise,
}) {
  return (
    <div style={{ background: "#11182c", border: "1px solid #444", borderRadius: "12px", padding: "20px", maxHeight: "600px", overflowY: "auto" }}>
      <h2 style={{ marginBottom: "18px" }}>Franchise Table</h2>
      {Object.keys(teamThemes).map((team) => {
        const data = franchises[team];
        const theme = teamThemes[team];
        return (
          <div key={team} style={{ marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #333" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              {theme?.logo && (
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: theme.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `2px solid ${theme.secondaryColor}`,
                }}>
                  <img src={theme.logo} alt={team} style={{ width: "28px", height: "28px", objectFit: "contain" }} />
                </div>
              )}
              <span style={{ fontWeight: "bold", fontSize: "16px", color: theme?.color || "white" }}>{team}</span>
            </div>
            <div style={{ fontSize: "14px", color: "#ccc" }}>
              Purse: Rs.{data ? data.purse.toFixed(2) : startingPurse.toFixed(2)} Cr
            </div>
            <div style={{ marginTop: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => onToggleFranchise(expandedFranchise === team ? null : team)}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Players:</span>
                <span style={{ fontSize: "12px", color: "#999" }}>{data?.players.length || 0}</span>
                <span style={{ fontSize: "16px", color: "#aaa" }}>{expandedFranchise === team ? "∧" : "∨"}</span>
              </div>
              {expandedFranchise === team && data && data.players.length > 0 ? (
                <div style={{ marginTop: "12px" }}>
                  {["Batsman", "Wicketkeeper", "Bowler", "All-Rounder"].map((role) => {
                    const playersInRole = data.players.filter((p) => p.role === role);
                    if (playersInRole.length === 0) return null;
                    const roleLabel = role === "Wicketkeeper" ? "WICKET-KEEPERS" : role === "Batsman" ? "BATSMEN" : role === "Bowler" ? "BOWLERS" : "ALL-ROUNDERS";
                    const roleInfo = roleColors[role];

                    return (
                      <div key={role} style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", color: "#FFD700", fontWeight: "bold", marginBottom: "6px" }}>
                          {roleLabel}
                        </div>
                        {playersInRole.map((player, index) => (
                          <div key={`${team}-${role}-${index}`} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#aaa", marginBottom: "6px", paddingLeft: "8px" }}>
                            <span style={{ flex: 1 }}>{player.name}</span>
                            <span style={{ color: "#FFD700", fontWeight: "500", minWidth: "30px" }}>{roleInfo.abbr}</span>
                            <span>{player.overseas === "Overseas" ? "✈️ OS" : "🏏"}</span>
                            <span style={{ color: "#28a745", fontWeight: "bold", minWidth: "70px", textAlign: "right" }}>Rs.{player.price} Cr</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : expandedFranchise === team ? (
                <span style={{ color: "#666" }}> None</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}