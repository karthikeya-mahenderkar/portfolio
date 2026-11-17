import { lazy, Suspense, useEffect, useState } from 'react'
import { OPEN_PALETTE_EVENT } from '@/lib/actions'
import type { Theme } from '@/hooks/useTheme'

const CommandPalette = lazy(() => import('./CommandPalette'))

/** Owns the ⌘K shortcut; the palette itself is code-split and loaded on first use. */
export function CommandMenu({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const show = () => {
      setMounted(true)
      setOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMounted(true)
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, show)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, show)
    }
  }, [])

  if (!mounted) return null
  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} theme={theme} onToggleTheme={onToggleTheme} />
    </Suspense>
  )
}
