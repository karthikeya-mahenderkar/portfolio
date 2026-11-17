import { ArrowUp } from 'lucide-react'
import { profile } from '@/data/profile'
import { scrollToTarget } from '@/lib/scroll'
import { isMac, openCommandPalette } from '@/lib/actions'
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons'

export function Footer() {
  const year = new Date().getFullYear()
  const toTop = () => {
    scrollToTarget(0)
    document.getElementById('home')?.focus({ preventScroll: true })
  }
  return (
    <footer className="border-t border-line">
      <div className="container-page py-14">
        <p
          aria-hidden="true"
          className="mb-12 bg-gradient-to-b from-fg/25 to-fg/[0.02] bg-clip-text font-serif text-[clamp(3.25rem,14vw,11rem)] leading-[0.9] tracking-tight whitespace-nowrap text-transparent italic select-none"
        >
          {profile.firstName}
          <span className="text-accent">.</span>
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="mt-1 text-sm text-subtle">© {year} · Designed & built from scratch with React, TypeScript & Tailwind.</p>
            <button type="button" onClick={openCommandPalette} className="mt-3 hidden items-center gap-2 font-mono text-[11px] text-subtle transition-colors hover:text-fg md:inline-flex">
              Tip: press
              <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px]">{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
              to jump anywhere
            </button>
          </div>
          <div className="flex items-center gap-2">
            {profile.links.github && (
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:text-fg">
                <GithubIcon className="size-4" />
              </a>
            )}
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:text-fg">
              <LinkedinIcon className="size-4" />
            </a>
            <button
              type="button"
              onClick={toTop}
              className="group ml-2 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Back to top
              <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
