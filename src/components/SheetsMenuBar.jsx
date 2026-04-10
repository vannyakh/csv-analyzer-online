import { MenubarDropdown, MenubarItem } from './MenubarDropdown.jsx'

/**
 * @param {{
 *   onChooseFile: () => void,
 *   onOpenUrl: () => void,
 *   onExportCsv: () => void,
 *   onExportJson: () => void,
 *   onCopy: () => void,
 *   onPrint: () => void,
 *   onStats: () => void,
 *   onCharts: () => void,
 *   hasData: boolean,
 * }} props
 */
export function SheetsMenuBar({
  onChooseFile,
  onOpenUrl,
  onExportCsv,
  onExportJson,
  onCopy,
  onPrint,
  onStats,
  onCharts,
  hasData,
}) {
  return (
    <nav className="sheets-menubar" aria-label="Application menu">
      <MenubarDropdown label="File">
        <MenubarItem onClick={onChooseFile}>Open…</MenubarItem>
        <MenubarItem onClick={onOpenUrl}>Import from URL…</MenubarItem>
        <div className="menubar-sep" role="separator" />
        <MenubarItem onClick={onExportCsv} disabled={!hasData}>
          Export CSV
        </MenubarItem>
        <MenubarItem onClick={onExportJson} disabled={!hasData}>
          Export JSON
        </MenubarItem>
      </MenubarDropdown>
      <MenubarDropdown label="Edit" disabled={!hasData}>
        <MenubarItem onClick={onCopy}>Copy as CSV</MenubarItem>
        <MenubarItem onClick={onPrint}>Print…</MenubarItem>
      </MenubarDropdown>
      <MenubarDropdown label="View" disabled={!hasData}>
        <MenubarItem onClick={onStats}>Column statistics</MenubarItem>
        <MenubarItem onClick={onCharts}>Charts</MenubarItem>
      </MenubarDropdown>
      <MenubarDropdown label="Insert" disabled />
      <MenubarDropdown label="Format" disabled />
      <MenubarDropdown label="Data" disabled />
      <MenubarDropdown label="Tools" disabled />
      <MenubarDropdown label="Help" disabled />
    </nav>
  )
}
