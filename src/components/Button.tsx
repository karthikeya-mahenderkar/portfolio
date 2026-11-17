import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-300 select-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-fg text-bg h-11 px-5 hover:bg-accent hover:text-accent-fg',
  secondary: 'h-11 px-5 border border-line-strong text-fg hover:border-fg/40 hover:bg-fg/[0.04]',
  ghost: 'h-10 px-3 text-muted hover:text-fg',
}

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; children: ReactNode }

export function LinkButton({ variant = 'primary', className, children, ...rest }: Props) {
  const external = rest.href?.startsWith('http')
  return (
    <a
      className={cn(base, variants[variant], className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}
