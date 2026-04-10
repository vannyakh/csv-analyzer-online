import { useCallback, useEffect, useRef } from 'react'
import Handsontable from 'handsontable'
import Papa from 'papaparse'
import { parseCsvText } from './lib/csvParse.js'
import { applyHandsontableSearch } from './lib/handsontableSearch.js'
import { handsontableCells } from './lib/handsontableCellClasses.js'
import { useAppStore } from './store/useAppStore.js'
import { SheetsMenuBar } from './components/SheetsMenuBar.jsx'
import { DataToolbar } from './components/DataToolbar.jsx'
import { UrlModal } from './components/UrlModal.jsx'
import { ChartAnalysisPanel } from './components/ChartAnalysisPanel.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'

const ENABLE_ADS = false

const base = import.meta.env.BASE_URL

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function NoticeToast() {
  const notice = useAppStore((s) => s.notice)
  const setNotice = useAppStore((s) => s.setNotice)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2800)
    return () => clearTimeout(t)
  }, [notice, setNotice])

  if (!notice) return null
  return (
    <div className="toast-banner" role="status" aria-live="polite">
      <span>{notice.text}</span>
      <button type="button" className="toast-dismiss" onClick={() => setNotice(null)} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export default function App() {
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)
  const hotContainerRef = useRef(null)
  const hotRef = useRef(null)
  const chartDomRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const parsedData = useAppStore((s) => s.parsedData)
  const displayName = useAppStore((s) => s.displayName)
  const renaming = useAppStore((s) => s.renaming)
  const loading = useAppStore((s) => s.loading)
  const errorMessage = useAppStore((s) => s.errorMessage)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const copyDone = useAppStore((s) => s.copyDone)

  const showError = useAppStore((s) => s.showError)
  const clearError = useAppStore((s) => s.clearError)
  const setLoading = useAppStore((s) => s.setLoading)
  const applyParsedDataSuccess = useAppStore((s) => s.applyParsedDataSuccess)
  const setDisplayName = useAppStore((s) => s.setDisplayName)
  const setRenaming = useAppStore((s) => s.setRenaming)
  const commitDisplayName = useAppStore((s) => s.commitDisplayName)
  const cancelRename = useAppStore((s) => s.cancelRename)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const openUrlModal = useAppStore((s) => s.openUrlModal)
  const setStatsOpen = useAppStore((s) => s.setStatsOpen)
  const openChartPanel = useAppStore((s) => s.openChartPanel)
  const clearWorkspaceState = useAppStore((s) => s.clearWorkspaceState)
  const setNotice = useAppStore((s) => s.setNotice)
  const flashCopyDone = useAppStore((s) => s.flashCopyDone)

  const processParsedFile = useCallback(
    (file, data) => {
      if (data.errors?.length) {
        console.warn('CSV parsing warnings:', data.errors)
      }
      if (!data.data?.length) {
        showError('The CSV file appears to be empty or invalid.')
        setLoading(false)
        return
      }
      applyParsedDataSuccess(file, data)
    },
    [applyParsedDataSuccess, setLoading, showError],
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
          processParsedFile(file, data)
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
    [clearError, processParsedFile, setLoading, showError],
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

    let syncTimer = null
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
      afterChange: (changes, source) => {
        if (!changes || source === 'loadData') return
        clearTimeout(syncTimer)
        syncTimer = setTimeout(() => {
          const h = hotRef.current
          if (!h) return
          const prev = useAppStore.getState().parsedData
          if (!prev) return
          const data = h.getSourceData()
          useAppStore.setState({
            parsedData: { ...prev, data },
          })
        }, 400)
      },
    })
    hotRef.current = hot

    return () => {
      clearTimeout(syncTimer)
      hot.destroy()
      if (hotRef.current === hot) hotRef.current = null
    }
  }, [parsedData])

  useEffect(() => {
    applyHandsontableSearch(hotRef.current, searchQuery)
  }, [searchQuery, parsedData])

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
  }, [parsedData])

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
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useAppStore.getState()
      if (s.urlModalOpen) s.closeUrlModal()
      else if (s.statsOpen) s.setStatsOpen(false)
      else if (s.chartOpen) s.setChartOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!useAppStore.getState().parsedData) return
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const headers = parsedData ? parsedData.meta.fields || Object.keys(parsedData.data[0] || {}) : []
  const rowCount = parsedData?.data?.length ?? 0
  const colCount = headers.length

  const exportBaseName = () => {
    const { currentFile, displayName } = useAppStore.getState()
    const raw = (currentFile?.name || displayName || 'export').replace(/\.csv$/i, '')
    return raw || 'export'
  }

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
    a.download = `${exportBaseName()}_export.csv`
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
    a.download = `${exportBaseName()}_export.json`
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
      flashCopyDone()
    } catch {
      showError('Failed to copy to clipboard')
    }
  }

  const handlePrint = () => {
    const hot = hotRef.current
    if (!hot) return
    const data = hot.getData()
    const hdrs = hot.getColHeader()
    const { currentFile, displayName } = useAppStore.getState()
    const title = currentFile?.name || displayName || 'CSV Data'
    const printWindow = window.open('', '_blank')
    const rowsHtml = data
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '')}</td>`).join('')}</tr>`)
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

  const clearWorkspace = useCallback(() => {
    if (hotRef.current) {
      hotRef.current.destroy()
      hotRef.current = null
    }
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
    clearWorkspaceState()
  }, [clearWorkspaceState])

  return (
    <div className="app-container">
      <NoticeToast />

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
                      onBlur={commitDisplayName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitDisplayName()
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
            <button type="button" className="sheets-icon-btn" title="Import from URL" onClick={openUrlModal} aria-label="Import from URL">
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
          onOpenUrl={openUrlModal}
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
            <p className="drop-lead">
              Or use <strong>Open</strong> — everything runs locally in your browser.
            </p>
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

      <UrlModal />

      <StatsPanel />

      <ChartAnalysisPanel hotRef={hotRef} chartDomRef={chartDomRef} chartInstanceRef={chartInstanceRef} />

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
