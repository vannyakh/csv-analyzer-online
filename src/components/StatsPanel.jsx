import { useAppStore } from '../store/useAppStore.js'

function StatNumbers({ numericData }) {
  const sorted = [...numericData].sort((a, b) => a - b)
  const sum = numericData.reduce((a, b) => a + b, 0)
  const avg = sum / numericData.length
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  return (
    <>
      <div className="stat-item">
        <strong>Min:</strong> {min.toFixed(2)}
      </div>
      <div className="stat-item">
        <strong>Max:</strong> {max.toFixed(2)}
      </div>
      <div className="stat-item">
        <strong>Avg:</strong> {avg.toFixed(2)}
      </div>
      <div className="stat-item">
        <strong>Median:</strong> {median.toFixed(2)}
      </div>
    </>
  )
}

function StatsGrid({ data, headers }) {
  return (
    <div className="stats-grid">
      {headers.map((header) => {
        const columnData = data.map((row) => row[header]).filter((val) => val !== null && val !== undefined && val !== '')
        const numericData = columnData.map((val) => parseFloat(val)).filter((val) => !Number.isNaN(val))
        return (
          <div key={header} className="stat-card">
            <h4>{header}</h4>
            <div className="stat-item">
              <strong>Total:</strong> {columnData.length}
            </div>
            <div className="stat-item">
              <strong>Empty:</strong> {data.length - columnData.length}
            </div>
            {numericData.length > 0 ? (
              <>
                <div className="stat-item">
                  <strong>Numeric:</strong> {numericData.length}
                </div>
                <StatNumbers numericData={numericData} />
              </>
            ) : (
              <div className="stat-item">
                <strong>Unique:</strong> {new Set(columnData).size}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StatsPanel() {
  const parsedData = useAppStore((s) => s.parsedData)
  const statsOpen = useAppStore((s) => s.statsOpen)
  const setStatsOpen = useAppStore((s) => s.setStatsOpen)

  const headers = parsedData ? parsedData.meta.fields || Object.keys(parsedData.data[0] || {}) : []

  return (
    <>
      {statsOpen ? (
        <button type="button" className="drawer-backdrop" aria-label="Close statistics" onClick={() => setStatsOpen(false)} />
      ) : null}
      <div
        id="stats-panel"
        className="stats-panel"
        style={{ display: statsOpen ? 'flex' : 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
      >
        <div className="stats-header">
          <h3 id="stats-title">Column Statistics</h3>
          <button type="button" className="stats-close" aria-label="Close" onClick={() => setStatsOpen(false)}>
            ×
          </button>
        </div>
        <div id="stats-content" className="stats-content">
          {parsedData ? <StatsGrid data={parsedData.data} headers={headers} /> : null}
        </div>
      </div>
    </>
  )
}
