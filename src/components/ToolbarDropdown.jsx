import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { IconChevronDown } from './toolbarIcons.jsx'

const ToolbarDropdownCloseContext = createContext(null)

/**
 * @param {{ label: string, children: import('react').ReactNode }} props
 */
export function ToolbarDropdown({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="toolbar-dropdown" ref={ref}>
      <button
        type="button"
        className="toolbar-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <IconChevronDown />
      </button>
      {open ? (
        <ToolbarDropdownCloseContext.Provider value={close}>
          <div id={menuId} className="toolbar-dropdown-panel" role="menu">
            {children}
          </div>
        </ToolbarDropdownCloseContext.Provider>
      ) : null}
    </div>
  )
}

/**
 * @param {{
 *   onClick: () => void,
 *   icon?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 *   variant?: 'primary' | 'success',
 * }} props
 */
export function ToolbarMenuButton({ onClick, icon, children, variant }) {
  const closeMenu = useContext(ToolbarDropdownCloseContext)
  const cls = ['toolbar-menu-item']
  if (variant === 'primary') cls.push('toolbar-menu-item--primary')
  if (variant === 'success') cls.push('toolbar-menu-item--success')
  return (
    <button
      type="button"
      className={cls.join(' ')}
      role="menuitem"
      onClick={() => {
        onClick()
        closeMenu?.()
      }}
    >
      {icon ? <span className="toolbar-menu-item-icon">{icon}</span> : null}
      <span className="toolbar-menu-item-label">{children}</span>
    </button>
  )
}
