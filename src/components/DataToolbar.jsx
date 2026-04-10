import { ToolbarDropdown, ToolbarMenuButton } from './ToolbarDropdown.jsx'
import { IconBars, IconCheck, IconCopy, IconDownload, IconPrint } from './toolbarIcons.jsx'

/**
 * @param {{
 *   searchInputRef: import('react').RefObject<HTMLInputElement | null>,
 *   searchQuery: string,
 *   onSearchChange: (value: string) => void,
 *   copyDone: boolean,
 *   onExportCsv: () => void,
 *   onExportJson: () => void,
 *   onCopy: () => void,
 *   onPrint: () => void,
 *   onStats: () => void,
 *   onCharts: () => void,
 * }} props
 */
export function DataToolbar({
  searchInputRef,
  searchQuery,
  onSearchChange,
  copyDone,
  onExportCsv,
  onExportJson,
  onCopy,
  onPrint,
  onStats,
  onCharts,
}) {
  return (
    <div id="toolbar" className="toolbar toolbar--sheets" style={{ display: 'flex' }}>
      <div className="toolbar-section toolbar-section-grow">
        <div className="search-wrapper search-wrapper--sheets">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            id="search-input"
            placeholder="Menus"
            title="Search cells in the table"
            className="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery.trim() ? (
            <button type="button" id="clear-search" className="clear-btn" title="Clear search" onClick={() => onSearchChange('')}>
              ×
            </button>
          ) : null}
        </div>
      </div>
      <div className="toolbar-section toolbar-section-menus">
        <ToolbarDropdown label="Export">
          <ToolbarMenuButton onClick={onExportCsv} icon={<IconDownload />}>
            Export CSV
          </ToolbarMenuButton>
          <ToolbarMenuButton onClick={onExportJson} icon={<IconDownload />}>
            Export JSON
          </ToolbarMenuButton>
        </ToolbarDropdown>
        <ToolbarDropdown label="Edit">
          <ToolbarMenuButton onClick={onCopy} icon={copyDone ? <IconCheck /> : <IconCopy />} variant={copyDone ? 'success' : undefined}>
            {copyDone ? 'Copied!' : 'Copy'}
          </ToolbarMenuButton>
          <ToolbarMenuButton onClick={onPrint} icon={<IconPrint />}>
            Print
          </ToolbarMenuButton>
        </ToolbarDropdown>
        <ToolbarDropdown label="Analyze">
          <ToolbarMenuButton onClick={onStats} icon={<IconBars />}>
            Stats
          </ToolbarMenuButton>
          <ToolbarMenuButton onClick={onCharts} icon={<IconBars />} variant="primary">
            Charts
          </ToolbarMenuButton>
        </ToolbarDropdown>
      </div>
    </div>
  )
}
