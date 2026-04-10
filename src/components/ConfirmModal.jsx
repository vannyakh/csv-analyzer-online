import { useEffect, useRef } from 'react'
import '@/assets/styles/modal.css'

export function ConfirmModal({
  open,
  title,
  message,
  detail,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => cancelRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal confirm-modal"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="presentation"
    >
      <div
        className="modal-content confirm-modal__content"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header confirm-modal__header">
          <h2 id="confirm-modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <div id="confirm-modal-desc" className="confirm-modal__desc">
            <p className="confirm-modal__message">{message}</p>
            {detail ? <p className="confirm-modal__detail">{detail}</p> : null}
          </div>
          <div className="modal-actions confirm-modal__actions">
            <button type="button" ref={cancelRef} className="btn-ghost" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className="action-btn" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
