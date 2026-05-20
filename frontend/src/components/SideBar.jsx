import { COLORS } from '../colors'

const MODES = [
  { id: 'addNode',   label: 'Add Node',  hint: 'Click empty space to place a node',      key: 'A' },
  { id: 'addEdge',   label: 'Add Edge',  hint: 'Click two nodes to connect them',         key: 'E' },
  { id: 'colorNode', label: 'Color',     hint: 'Click a node to apply the active color',  key: 'C' },
  { id: 'delete',    label: 'Delete',    hint: 'Click a node or edge to remove it',       key: 'D' },
]

export default function SideBar({
  mode, setMode,
  selectedColor, setSelectedColor,
  log, clearLog, saveCheckpoint,
  isValid, validityReason,
  nodeCount, edgeCount, colorCount,
  clearGraph,
}) {
  const currentMode = MODES.find(m => m.id === mode)

  return (
    <div className="sidebar">

      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-name">Graph Recoloring</span>
      </div>

      {/* Graph stats */}
      <div className="sidebar-section">
        <div className="stats-row">
          <span className="stat"><strong>{nodeCount}</strong> nodes</span>
          <span className="stat"><strong>{edgeCount}</strong> edges</span>
          <span className="stat"><strong>{colorCount}</strong> colors</span>
        </div>
      </div>

      {/* Coloring validity */}
      <div className={`validity-badge ${isValid ? 'valid' : 'invalid'}`}>
        <span className="validity-icon">{isValid ? '✓' : '✗'}</span>
        <span className="validity-text">{validityReason}</span>
      </div>

      {/* Tool selector */}
      <div className="sidebar-section">
        <div className="section-label">Tool</div>
        <div className="mode-grid">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
              title={`${m.label}  [${m.key}]`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mode-hint">{currentMode?.hint}</div>
      </div>

      {/* Color palette */}
      <div className="sidebar-section">
        <div className="section-label">Color</div>
        <div className="color-palette">
          {COLORS.map(c => (
            <button
              key={c.value}
              className={`color-swatch ${selectedColor === c.value ? 'selected' : ''}`}
              style={{ '--swatch-color': c.value }}
              onClick={() => setSelectedColor(c.value)}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="sidebar-section">
        <div className="section-label">Actions</div>
        <div className="action-row">
          <button
            className="action-btn save-btn"
            onClick={saveCheckpoint}
            title="Save the current coloring as a checkpoint in the log"
          >
            Save checkpoint
          </button>
          <button
            className="action-btn"
            onClick={clearGraph}
            title="Remove all nodes and edges"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Recoloring log */}
      <div className="sidebar-section log-section">
        <div className="section-label-row">
          <span className="section-label">Recoloring Log</span>
          {log.length > 0 && (
            <button className="clear-log-btn" onClick={clearLog}>Clear</button>
          )}
        </div>
        <div className="log-list">
          {log.length === 0 ? (
            <div className="log-empty">Color a node to start logging</div>
          ) : (
            [...log].reverse().map((entry, idx) => (
              entry.type === 'checkpoint' ? (
                <div key={idx} className="log-checkpoint">
                  <span>📍</span>
                  <span>{entry.valid ? '✓' : '✗'} {entry.reason}</span>
                </div>
              ) : (
                <div key={idx} className={`log-entry ${entry.isValid ? '' : 'log-invalid'}`}>
                  <span className="log-step">#{entry.step}</span>
                  <span className="log-node">v{entry.nodeId}</span>
                  <span className="log-swatch" style={{ background: entry.fromColor || '#4a5568' }} />
                  <span className="log-arrow">→</span>
                  <span className="log-swatch" style={{ background: entry.toColor }} />
                  {!entry.isValid && <span className="log-warning" title="Coloring is invalid after this step">!</span>}
                </div>
              )
            ))
          )}
        </div>
      </div>

    </div>
  )
}
