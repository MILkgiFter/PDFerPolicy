/* eslint-disable react-refresh/only-export-components -- provider + hook pattern */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export type ToastKind = 'info' | 'success' | 'error'

export type Toast = {
  id: number
  message: string
  kind: ToastKind
}

type ToastContextValue = {
  toasts: Toast[]
  pushToast: (message: string, kind?: ToastKind) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++toastSeq
    setToasts((prev) => [...prev, { id, message, kind }])
    window.setTimeout(() => dismissToast(id), 4200)
  }, [dismissToast])

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast requires ToastProvider')
  return ctx
}
