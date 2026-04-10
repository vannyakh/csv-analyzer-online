import { useCallback, useEffect, useRef, useState } from 'react'
import Handsontable from 'handsontable'
import Papa from 'papaparse'
import * as echarts from 'echarts'
import { buildEChartsOption } from './lib/chartConfig.js'
import { suggestChartColumns } from './lib/suggestChartColumns.js'
import { getRecentUrls, rememberUrl } from './lib/recentUrls.js'
import { applyHandsontableSearch } from './lib/handsontableSearch.js'
import { handsontableCells } from './lib/handsontableCellClasses.js'
import { DataToolbar } from './components/DataToolbar.jsx'
import { SheetsMenuBar } from './components/SheetsMenuBar.jsx'

const ENABLE_ADS = false

const base = import.meta.env.BASE_URL

function parseCsvText(csv) {
  return Papa.parse(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function App() {
  const fileInputRef = useRef(null)
  const urlFieldRef = useRef(null)
  const searchInputRef = useRef(null)
  const hotContainerRef = useRef(null)
  const hotRef = useRef(null)
  const chartDomRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const [parsedData, setParsedData] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  const [statsOpen, setStatsOpen] = useState(false)
  const [chartOpen, setChartOpen] = useState(false)

  const [chartType, setChartType] = useState('line')
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [extraSeries, setExtraSeries] = useState([])

  const [copyDone, setCopyDone] = useState(false)
  const [chartGenerated, setChartGenerated] = useState(false)
  const [notice, setNotice] = useState(null)

  const showError = useCallback((message) => {
    setErrorMessage(message)
  }, [])

  const clearError = useCallback(() => setErrorMessage(''), [])

  const resetChartUi = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
    setChartType('line')
    setXAxis('')
    setYAxis('')
    setExtraSeries([])
    setChartGenerated(false)
  }, [])

  const applyParsedData = useCallback(
    (file, data) => {
      if (data.errors?.length) {
        console.warn('CSV parsing warnings:', data.errors)
      }
      if (!data.data?.length) {
        showError('The CSV file appears to be empty or invalid.')
        setLoading(false)
        return
      }
      setParsedData(data)
      setCurrentFile(file)
      const name = file ? file.name : 'Loaded from URL'
      setDisplayName(name)
      setRenaming(false)
      setSearchQuery('')
      resetChartUi()
      clearError()
      setLoading(false)
    },
    [clearError, resetChartUi, showError],
  )

  const processFile = useCallback(
    (file) => {
      if (!file) return
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('Please select a valid CSV file.')
        return
      }
      setLoading(true)
      clearError()
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = parseCsvText(e.target.result)
          applyParsedData(file, data)
        } catch (err) {
          showError(`Error processing CSV file: ${err.message}`)
          setLoading(false)
        }
      }
      reader.onerror = () => {
        showError('Error reading file. Please try again.')
        setLoading(false)
      }
      reader.readAsText(file)
    },
    [applyParsedData, clearError, showError],
  )

  useEffect(() => {
    const el = hotContainerRef.current
    if (!el || !parsedData?.data?.length) {
      if (hotRef.current) {
        hotRef.current.destroy()
        hotRef.current = null
      }
      return
    }

    if (hotRef.current) {
      hotRef.current.destroy()
      hotRef.current = null
    }

    el.innerHTML = ''
    el.className = 'table-container'

    const hot = new Handsontable(el, {
      data: parsedData.data,
      rowHeaders: true,
      colHeaders: parsedData.meta.fields || Object.keys(parsedData.data[0] || {}),
      columnSorting: true,
      width: '100%',
      height: '100%',
      licenseKey: 'non-commercial-and-evaluation',
      className: 'ht-theme-analyzer',
      stretchH: 'all',
      autoWrapRow: true,
      autoWrapCol: true,
      contextMenu: true,
      filters: true,
      dropdownMenu: true,
      manualColumnResize: true,
      manualRowResize: true,
      readOnly: false,
      search: true,
      cells: handsontableCells,
    })
    hotRef.current = hot

    return () => {
      hot.destroy()
      if (hotRef.current === hot) hotRef.current = null
    }
  }, [parsedData])

  useEffect(() => {
    applyHandsontableSearch(hotRef.current, searchQuery)
  }, [searchQuery, parsedData])

  useEffect(() => {
    if (!chartGenerated || !chartOpen) return
    const el = chartDomRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      chartInstanceRef.current?.resize()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [chartGenerated, chartOpen])

  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault()
    }
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2800)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (urlModalOpen) {
        setUrlModalOpen(false)
        setUrlInput('')
        setUrlError('')
      } else if (statsOpen) {
        setStatsOpen(false)
      } else if (chartOpen) {
        setChartOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [urlModalOpen, statsOpen, chartOpen])

  useEffect(() => {
    if (urlModalOpen) {
      requestAnimationFrame(() => urlFieldRef.current?.focus())
    }
  }, [urlModalOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!parsedData) return
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [parsedData])

  useEffect(() => {
    if (!ENABLE_ADS) return
    const containers = document.querySelectorAll('.ads-container')
    containers.forEach((c) => {
      c.style.display = 'flex'
    })
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* ignore */
    }
  }, [])

  const headers = parsedData
    ? parsedData.meta.fields || Object.keys(parsedData.data[0] || {})
    : []

  const rowCount = parsedData?.data?.length ?? 0
  const colCount = headers.length

  const handleExportCsv = () => {
    const hot = hotRef.current
    if (!hot) return
    const data = hot.getData()
    const hdrs = hot.getColHeader()
    const csv = Papa.unparse({ fields: hdrs, data })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = `${currentFile ? currentFile.name.replace(/\.csv$/i, '') : 'export'}_export.csv`
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ type: 'success', text: 'CSV download started — check your downloads folder.' })
  }

  const handleExportJson = () => {
    const hot = hotRef.current
    if (!hot) return
    const data = hot.getData()
    const hdrs = hot.getColHeader()
    const jsonData = data.map((row) => {
      const obj = {}
      hdrs.forEach((h, i) => {
        obj[h] = row[i]
      })
      return obj
    })
    const json = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = `${currentFile ? currentFile.name.replace(/\.csv$/i, '') : 'export'}_export.json`
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ type: 'success', text: 'JSON download started — check your downloads folder.' })
  }

  const handleCopy = async () => {
    const hot = hotRef.current
    if (!hot) return
    try {
      const data = hot.getData()
      const hdrs = hot.getColHeader()
      const csv = Papa.unparse({ fields: hdrs, data })
      await navigator.clipboard.writeText(csv)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      showError('Failed to copy to clipboard')
    }
  }

  const handlePrint = () => {
    const hot = hotRef.current
    if (!hot) return
    const data = hot.getData()
    const hdrs = hot.getColHeader()
    const title = currentFile ? currentFile.name : 'CSV Data'
    const printWindow = window.open('', '_blank')
    const rowsHtml = data
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '')}</td>`).join('')}</tr>`,
      )
      .join('')
    const html = `<!DOCTYPE html><html><head><title>CSV Viewer - Print</title><style>
      body{font-family:Arial,sans-serif;margin:20px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f2f2f2;font-weight:bold}
      @media print{body{margin:0}table{page-break-inside:auto}tr{page-break-inside:avoid}}
    </style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr>${hdrs.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleGenerateChart = () => {
    if (!parsedData || !hotRef.current) {
      showError('Please load a CSV file first.')
      return
    }
    if (!xAxis || !yAxis) {
      showError('Please select both X-axis and Y-axis columns.')
      return
    }
    const dom = chartDomRef.current
    if (!dom) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }

    const extra = extraSeries.map((s) => s.value).filter(Boolean)
    const option = buildEChartsOption(parsedData, {
      type: chartType,
      xAxis,
      yAxis,
      extraSeries: extra,
    })
    if (!option) return

    const chart = echarts.init(dom, null, { renderer: 'canvas' })
    chart.setOption(option, true)
    chartInstanceRef.current = chart
    setChartGenerated(true)
    requestAnimationFrame(() => chart.resize())
  }

  const handleClearChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
    setXAxis('')
    setYAxis('')
    setChartType('line')
    setExtraSeries([])
    setChartGenerated(false)
  }

  const saveDisplayName = () => {
    const raw = displayName.trim()
    if (raw.length > 0) {
      const finalName = raw.endsWith('.csv') ? raw : `${raw}.csv`
      setDisplayName(finalName)
      if (currentFile) {
        try {
          Object.defineProperty(currentFile, 'name', { writable: true, value: finalName })
        } catch {
          /* ignore */
        }
      }
    } else {
      setDisplayName(currentFile ? currentFile.name : 'Loaded from URL')
    }
    setRenaming(false)
  }

  const cancelRename = () => {
    setDisplayName(currentFile ? currentFile.name : 'Loaded from URL')
    setRenaming(false)
  }

  const loadFromUrl = async () => {
    const url = urlInput.trim()
    if (!url) {
      setUrlError('Please enter a valid URL')
      return
    }
    setLoading(true)
    setUrlError('')
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const csv = await response.text()
      const data = parseCsvText(csv)
      if (!data.data?.length) throw new Error('The CSV file appears to be empty or invalid.')
      rememberUrl(url)
      applyParsedData(null, data)
      setUrlModalOpen(false)
      setUrlInput('')
    } catch (err) {
      setUrlError(`Error loading CSV: ${err.message}`)
      setLoading(false)
    }
  }

  const multiSeriesVisible = chartType === 'line' || chartType === 'bar' || chartType === 'radar'

  const addSeriesRow = () => {
    setExtraSeries((prev) => [...prev, { id: crypto.randomUUID(), value: '' }])
  }

  const removeSeriesRow = (id) => {
    setExtraSeries((prev) => prev.filter((s) => s.id !== id))
  }

  const setSeriesValue = (id, value) => {
    setExtraSeries((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)))
  }

  const seriesOptionsForRow = (rowId, currentVal) => {
    const taken = new Set([yAxis, ...extraSeries.filter((s) => s.id !== rowId).map((s) => s.value)])
    return headers.filter((h) => !taken.has(h) || h === currentVal)
  }

  const clearWorkspace = useCallback(() => {
    if (hotRef.current) {
      hotRef.current.destroy()
      hotRef.current = null
    }
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
    setParsedData(null)
    setCurrentFile(null)
    setDisplayName('')
    setRenaming(false)
    setSearchQuery('')
    setUrlModalOpen(false)
    setUrlInput('')
    setUrlError('')
    setStatsOpen(false)
    setChartOpen(false)
    resetChartUi()
    clearError()
    setNotice(null)
    setLoading(false)
  }, [clearError, resetChartUi])

  const openChartPanel = () => {
    if (!parsedData) {
      showError('Please load a CSV file first.')
      return
    }
    const s = suggestChartColumns(parsedData)
    setXAxis((prev) => prev || s.x)
    setYAxis((prev) => prev || s.y)
    setChartOpen(true)
  }

  return (
    <div className="app-container">
      {notice ? (
        <div className="toast-banner" role="status" aria-live="polite">
          <span>{notice.text}</span>
          <button type="button" className="toast-dismiss" onClick={() => setNotice(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}

      <header className="sheets-chrome" role="banner">
        <div className="sheets-titlebar">
          <div className="sheets-titlebar-left">
            <img src={`${base}csv.png`} alt="" className="sheets-doc-icon" width="40" height="40" />
            <div className="sheets-title-block">
              <div className="sheets-doc-title-line">
                {parsedData ? (
                  !renaming ? (
                    <>
                      <span id="file-name" className="sheets-doc-title">
                        {displayName}
                      </span>
                      <button type="button" className="sheets-rename-btn" title="Rename" onClick={() => setRenaming(true)} aria-label="Rename file">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="sheets-doc-title-input"
                      value={displayName}
                      autoFocus
                      aria-label="File name"
                      onChange={(e) => setDisplayName(e.target.value)}
                      onBlur={saveDisplayName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          saveDisplayName()
                        } else if (e.key === 'Escape') cancelRename()
                      }}
                    />
                  )
                ) : (
                  <span className="sheets-doc-title sheets-doc-title--app">CSV Analyzer</span>
                )}
              </div>
              <div className="sheets-doc-meta">
                {parsedData
                  ? `${rowCount.toLocaleString()} rows × ${colCount} columns · Local`
                  : 'Local spreadsheet · Open a CSV to begin'}
              </div>
            </div>
          </div>
          <div className="sheets-titlebar-right">
            <input
              ref={fileInputRef}
              type="file"
              id="input-file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) processFile(file)
                e.target.value = ''
              }}
            />
            <button type="button" className="sheets-icon-btn" title="Import from URL" onClick={() => setUrlModalOpen(true)} aria-label="Import from URL">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
            <label htmlFor="input-file" className="sheets-btn sheets-btn--primary">
              Open
            </label>
            {parsedData ? (
              <button type="button" className="sheets-btn sheets-btn--danger-outline" title="Close file" onClick={clearWorkspace}>
                Close
              </button>
            ) : null}
          </div>
        </div>

        <SheetsMenuBar
          hasData={!!parsedData}
          onChooseFile={() => fileInputRef.current?.click()}
          onOpenUrl={() => setUrlModalOpen(true)}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onCopy={handleCopy}
          onPrint={handlePrint}
          onStats={() => setStatsOpen(true)}
          onCharts={openChartPanel}
        />
      </header>

      {ENABLE_ADS ? (
        <>
          <div className="ads-container ads-top" style={{ display: 'flex' }}>
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-9402558370681469"
              data-ad-slot="3423641218"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </>
      ) : null}

      {!parsedData && !loading ? (
        <div
          id="drop-zone"
          className="drop-zone"
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.classList.add('drag-over')
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.classList.remove('drag-over')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.classList.remove('drag-over')
            const files = e.dataTransfer.files
            if (files.length > 0) processFile(files[0])
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget || e.target.closest('.drop-zone-content')) {
              fileInputRef.current?.click()
            }
          }}
          role="presentation"
        >
          <div className="drop-zone-content">
            <div className="drop-icon-wrap" aria-hidden>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2>Drop a CSV to get started</h2>
            <p className="drop-lead">Or use <strong>Choose CSV File</strong> — everything runs locally in your browser.</p>
            <ul className="drop-features">
              <li>Search, filter, and edit in the grid</li>
              <li>Column stats and Apache ECharts visuals</li>
              <li>Export to CSV or JSON, or copy to clipboard</li>
            </ul>
            <p className="drop-kbd">
              <kbd>Esc</kbd> closes panels · <kbd>/</kbd> focuses search when a file is open
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div id="loading" className="loading" style={{ display: 'flex' }}>
          <div className="spinner" />
          <p>Loading CSV file...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div id="error" className="error-banner" role="alert">
          <span className="error-text">{errorMessage}</span>
          <button type="button" className="error-dismiss" onClick={clearError} aria-label="Dismiss error">
            ×
          </button>
        </div>
      ) : null}

      {ENABLE_ADS ? (
        <div className="ads-container ads-in-content" style={{ display: 'flex' }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9402558370681469"
            data-ad-slot="3423641218"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : null}

      <div className={`main-stage ${parsedData ? 'main-stage--table' : ''}`}>
        {loading && parsedData ? <div className="loading-overlay" aria-busy="true" aria-label="Loading" /> : null}
        {parsedData ? <div ref={hotContainerRef} id="handsontable-container" className="table-container" /> : null}
      </div>

      <div
        id="url-modal"
        className="modal"
        style={{ display: urlModalOpen ? 'flex' : 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setUrlModalOpen(false)
            setUrlInput('')
            setUrlError('')
          }
        }}
        role="presentation"
      >
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="url-modal-title" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 id="url-modal-title">Load CSV from URL</h2>
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => {
                setUrlModalOpen(false)
                setUrlInput('')
                setUrlError('')
              }}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <label className="field-label" htmlFor="url-input">
              CSV URL
            </label>
            <input
              ref={urlFieldRef}
              type="url"
              id="url-input"
              placeholder="https://example.com/data.csv"
              className="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadFromUrl()
              }}
            />
            {urlModalOpen && getRecentUrls().length > 0 ? (
              <div className="recent-urls">
                <span className="recent-urls-label">Recent</span>
                <ul className="recent-urls-list">
                  {getRecentUrls().map((u) => (
                    <li key={u}>
                      <button type="button" className="recent-url-btn" onClick={() => setUrlInput(u)}>
                        {u.length > 56 ? `${u.slice(0, 54)}…` : u}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setUrlModalOpen(false)
                  setUrlInput('')
                  setUrlError('')
                }}
              >
                Cancel
              </button>
              <button type="button" id="load-url-submit" className="action-btn" onClick={loadFromUrl}>
                Load
              </button>
            </div>
            {urlError ? (
              <div id="url-error" className="url-error" style={{ display: 'block' }}>
                {urlError}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {statsOpen ? <button type="button" className="drawer-backdrop" aria-label="Close statistics" onClick={() => setStatsOpen(false)} /> : null}
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

      {chartOpen ? <button type="button" className="drawer-backdrop" aria-label="Close charts" onClick={() => setChartOpen(false)} /> : null}
      <div
        id="chart-panel"
        className="chart-panel"
        style={{ display: chartOpen ? 'flex' : 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-title"
      >
        <div className="chart-header">
          <h3 id="chart-title">Chart Analysis</h3>
          <button type="button" className="chart-close" aria-label="Close" onClick={() => setChartOpen(false)}>
            ×
          </button>
        </div>
        <div className="chart-controls">
          <div className="chart-control-group">
            <label htmlFor="chart-type">Chart Type:</label>
            <select
              id="chart-type"
              className="chart-select"
              value={chartType}
              onChange={(e) => {
                const v = e.target.value
                setChartType(v)
                if (v !== 'line' && v !== 'bar' && v !== 'radar') setExtraSeries([])
              }}
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>
          <div className="chart-control-group">
            <label htmlFor="x-axis">X-Axis (Category):</label>
            <select id="x-axis" className="chart-select" value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-control-group">
            <label htmlFor="y-axis">Y-Axis (Value):</label>
            <select id="y-axis" className="chart-select" value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-control-group" id="multi-series-group" style={{ display: multiSeriesVisible ? 'block' : 'none' }}>
            <label>Additional Series (optional):</label>
            <div id="series-selectors">
              {extraSeries.map((s) => (
                <div key={s.id} className="series-selector">
                  <select
                    className="chart-select"
                    value={s.value}
                    onChange={(e) => setSeriesValue(s.id, e.target.value)}
                  >
                    <option value="">Select column...</option>
                    {seriesOptionsForRow(s.id, s.value).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="remove-series-btn" aria-label="Remove series" onClick={() => removeSeriesRow(s.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" id="add-series" className="add-series-btn" onClick={addSeriesRow}>
              + Add Series
            </button>
          </div>
          <div className="chart-control-group">
            <button type="button" id="generate-chart" className="generate-chart-btn" onClick={handleGenerateChart}>
              Generate Chart
            </button>
            <button type="button" id="clear-chart" className="clear-chart-btn" onClick={handleClearChart}>
              Clear
            </button>
          </div>
        </div>
        <div className="chart-container-wrapper">
          {!chartGenerated ? (
            <div className="chart-placeholder">
              <p className="chart-placeholder-title">No chart yet</p>
              <p className="chart-placeholder-hint">Choose columns and click &quot;Generate Chart&quot; to visualize your data.</p>
            </div>
          ) : null}
          <div id="chart-echarts" ref={chartDomRef} className="chart-echarts" role="img" aria-label="Data chart" />
        </div>
      </div>

      {ENABLE_ADS ? (
        <div className="ads-container ads-bottom" style={{ display: 'flex' }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9402558370681469"
            data-ad-slot="3423641218"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : null}
    </div>
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
