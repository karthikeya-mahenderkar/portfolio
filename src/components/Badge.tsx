import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'default' | 'applied' | 'accent'

export function Badge({ children, tone = 'default', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none tracking-tight transition-colors',
        tone === 'default' && 'border-line-strong bg-fg/[0.04] text-fg/90',
        tone === 'applied' && 'border-line bg-accent-soft/50 text-fg/75',
        tone === 'accent' && 'border-accent/30 bg-accent-soft text-accent',
        className,
      )}
    >
      {tone === 'applied' && <span aria-hidden="true" className="size-1 rounded-full bg-accent" />}
      {children}
    </span>
  )
}
