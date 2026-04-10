import { useEffect, useRef } from 'react'
import '@/assets/styles/modal.css'
import { parseCsvText } from '@/lib/csvParse.js'
import { parseJsonTable } from '@/lib/jsonTableParse.js'
import { getRecentUrls, rememberUrl } from '@/lib/recentUrls.js'
import { useAppStore } from '@/store/useAppStore.js'

export function UrlModal() {
  const urlFieldRef = useRef(null)
  const urlModalOpen = useAppStore((s) => s.urlModalOpen)
  const urlInput = useAppStore((s) => s.urlInput)
  const urlError = useAppStore((s) => s.urlError)
  const closeUrlModal = useAppStore((s) => s.closeUrlModal)
  const setUrlInput = useAppStore((s) => s.setUrlInput)
  const setUrlError = useAppStore((s) => s.setUrlError)
  const setLoading = useAppStore((s) => s.setLoading)
  const applyParsedDataSuccess = useAppStore((s) => s.applyParsedDataSuccess)

  useEffect(() => {
    if (urlModalOpen) {
      requestAnimationFrame(() => urlFieldRef.current?.focus())
    }
  }, [urlModalOpen])

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
      const text = await response.text()
      const trimmed = text.trim()
      const data = trimmed.startsWith('[') ? parseJsonTable(text) : parseCsvText(text)
      if (!data.data?.length) throw new Error('The file appears to be empty or invalid.')
      rememberUrl(url)
      applyParsedDataSuccess(null, data)
      closeUrlModal()
    } catch (err) {
      setUrlError(`Error loading file: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div
      id="url-modal"
      className="modal"
      style={{ display: urlModalOpen ? 'flex' : 'none' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUrlModal()
      }}
      role="presentation"
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="url-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="url-modal-title">Load CSV from URL</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={closeUrlModal}>
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
            <button type="button" className="btn-ghost" onClick={closeUrlModal}>
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
  )
}
