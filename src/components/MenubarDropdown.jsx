import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'

const MenubarCloseContext = createContext(null)

export function MenubarDropdown({ label, children, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open || disabled) return
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
  }, [open, disabled])

  if (disabled) {
    return (
      <span className="menubar-dropdown-trigger menubar-dropdown-trigger--disabled" aria-disabled="true">
        {label}
      </span>
    )
  }

  const close = () => setOpen(false)

  return (
    <div className="menubar-dropdown" ref={ref}>
      <button
        type="button"
        className="menubar-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <MenubarCloseContext.Provider value={close}>
          <div id={menuId} className="menubar-dropdown-panel" role="menu">
            {children}
          </div>
        </MenubarCloseContext.Provider>
      ) : null}
    </div>
  )
}

export function MenubarItem({ onClick, children, disabled }) {
  const closeMenu = useContext(MenubarCloseContext)
  if (disabled) {
    return (
      <div className="menubar-item menubar-item--disabled" role="menuitem" aria-disabled="true">
        {children}
      </div>
    )
  }
  return (
    <button
      type="button"
      className="menubar-item"
      role="menuitem"
      onClick={() => {
        onClick()
        closeMenu?.()
      }}
    >
      {children}
    </button>
  )
}
