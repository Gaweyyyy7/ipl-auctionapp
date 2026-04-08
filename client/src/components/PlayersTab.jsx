export default function PlayersTab({ players, hostId, expandedPlayer, onTogglePlayer }) {
  return (
    <div>
      {players.map((player) => {
        const isExpanded = expandedPlayer === player.id;
        const isPlayerHost = player.id === hostId;

        return (
          <div
            key={player.id}
            style={{ borderBottom: "1px solid #222", paddingBottom: "12px", marginBottom: "12px" }}
          >
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => onTogglePlayer(isExpanded ? null : player.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28a745", flexShrink: 0 }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>{player.name}</span>
                    {isPlayerHost && (
                      <span style={{ background: "#5a2d8a", color: "white", fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: "bold" }}>HOST</span>
                    )}
                  </div>
                </div>
              </div>
              <span style={{ color: "#aaa", fontSize: "18px" }}>{isExpanded ? "∧" : "∨"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}