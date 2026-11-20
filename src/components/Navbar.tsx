import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownToLine, Menu, Search, X } from 'lucide-react'
import { navItems, profile } from '@/data/profile'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useScrolled } from '@/hooks/useScrolled'
import type { Origin, Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'
import { setScrollLocked } from '@/lib/scroll'
import { isMac, openCommandPalette } from '@/lib/actions'
import { ThemeToggle } from './ThemeToggle'
import { GithubIcon, LinkedinIcon } from './BrandIcons'
import { Magnetic } from './motion'

const sectionIds = navItems.map((n) => n.id)

export function Navbar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: (origin?: Origin) => void }) {
  const scrolled = useScrolled()
  const active = useActiveSection(sectionIds)
  const [open, setOpen] = useState(false)
  const [mac] = useState(isMac)

  // Lock scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return
    setScrollLocked(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-2.5"
    >
      <a
        href="#main"
        className="pointer-events-auto sr-only rounded-full bg-fg px-4 py-2 text-bg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70]"
      >
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className={cn(
          'liquid-glass pointer-events-auto relative mx-auto flex h-14 w-full max-w-[66rem] items-center justify-between gap-4 rounded-full pr-2 pl-3',
          scrolled && 'is-scrolled',
        )}
      >
        <a href="#home" className="group flex items-center gap-2.5" aria-label={`${profile.name} — home`}>
          <span className="relative grid size-8 place-items-center rounded-lg bg-fg font-serif text-lg text-bg italic transition-transform duration-300 group-hover:-rotate-6">
            k
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />
          </span>
          <span className="hidden text-sm font-medium tracking-tight sm:block">{profile.name}</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? 'true' : undefined}
                className={cn(
                  'relative block rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
                  active === item.id ? 'text-fg' : 'text-muted hover:text-fg',
                )}
              >
                {active === item.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-fg/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Open command menu"
            aria-keyshortcuts="Meta+K Control+K"
            className="hidden h-10 items-center gap-2 rounded-full border border-line pr-2 pl-3.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg md:inline-flex"
          >
            <Search className="size-3.5" />
            <span>Search</span>
            <kbd className="rounded-md border border-line bg-fg/[0.04] px-1.5 py-0.5 font-mono text-[10px]">{mac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Magnetic strength={0.2} className="hidden sm:inline-flex">
            <a
              href={profile.resumeUrl}
              download={profile.resumeFileName}
              className="hidden h-10 items-center gap-2 rounded-full bg-fg px-4 text-[13px] font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg sm:inline-flex"
            >
              <ArrowDownToLine className="size-3.5" />
              Resume
            </a>
          </Magnetic>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-10 place-items-center rounded-full border border-line text-fg lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>
    </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            data-lenis-prevent
            className="glass-thick fixed inset-0 z-40 overflow-y-auto pt-16 lg:hidden"
          >
            <div className="container-page flex h-full flex-col justify-between pt-8 pb-10">
              <ul className="space-y-1">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.35 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 border-b border-line py-4 text-3xl font-medium tracking-tight"
                    >
                      <span className="font-mono text-xs text-accent">0{i + 1}</span>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="space-y-5 pt-8">
                <div className="flex items-center gap-2">
                  {profile.links.github && (
                    <a href={profile.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="grid size-11 place-items-center rounded-full border border-line text-muted">
                      <GithubIcon className="size-4" />
                    </a>
                  )}
                  <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="grid size-11 place-items-center rounded-full border border-line text-muted">
                    <LinkedinIcon className="size-4" />
                  </a>
                  <a href={`mailto:${profile.email}`} className="ml-1 truncate font-mono text-xs text-muted underline decoration-line-strong underline-offset-4">
                    {profile.email}
                  </a>
                </div>
                <a
                  href={profile.resumeUrl}
                  download={profile.resumeFileName}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-fg text-sm font-medium text-bg"
                >
                  <ArrowDownToLine className="size-4" />
                  Download Resume
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
