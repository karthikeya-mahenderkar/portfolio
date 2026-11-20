import { useEffect, type ReactNode } from 'react'
import { Command } from 'cmdk'
import {
  ArrowDownToLine,
  AtSign,
  BriefcaseBusiness,
  Copy,
  CornerDownLeft,
  FolderGit2,
  GraduationCap,
  Home,
  Layers,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { navItems, profile, projects } from '@/data/profile'
import { copyEmail, downloadResume } from '@/lib/actions'
import { scrollToTarget, setScrollLocked } from '@/lib/scroll'
import type { Theme } from '@/hooks/useTheme'
import { GithubIcon, LinkedinIcon } from './BrandIcons'

const sectionIcons: Record<string, ReactNode> = {
  home: <Home />,
  about: <User />,
  skills: <Layers />,
  projects: <BriefcaseBusiness />,
  education: <GraduationCap />,
  contact: <AtSign />,
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void; theme: Theme; onToggleTheme: () => void }

function Item({ children, onSelect, value, hint }: { children: ReactNode; onSelect: () => void; value: string; hint?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors select-none data-[selected=true]:bg-fg/[0.07] data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {children}
      {hint && <span className="ml-auto font-mono text-[11px] text-subtle">{hint}</span>}
      <CornerDownLeft className="ml-auto hidden text-subtle group-data-[selected=true]:block" aria-hidden="true" />
    </Command.Item>
  )
}

const groupCls =
  'px-2 pb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-subtle [&_[cmdk-group-heading]]:uppercase'

export default function CommandPalette({ open, onOpenChange, theme, onToggleTheme }: Props) {
  useEffect(() => {
    setScrollLocked(open)
    return () => setScrollLocked(false)
  }, [open])

  const run = (fn: () => void) => () => {
    onOpenChange(false)
    // let the dialog close before scrolling / opening things
    requestAnimationFrame(fn)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      loop
      overlayClassName="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
      contentClassName="fixed top-[12vh] left-1/2 z-[81] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 glass-thick overflow-hidden rounded-2xl border outline-none"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span className="font-mono text-xs text-accent" aria-hidden="true">
          &gt;
        </span>
        <Command.Input
          autoFocus
          placeholder="Search sections, projects, actions…"
          className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
        />
        <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-subtle">ESC</kbd>
      </div>

      <Command.List data-lenis-prevent className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain pb-2">
        <Command.Empty className="px-4 py-10 text-center text-sm text-subtle">No results. Try “resume” or “projects”.</Command.Empty>

        <Command.Group heading="Actions" className={groupCls}>
          <Item value="copy email address" onSelect={run(copyEmail)}>
            <Copy /> Copy email address
          </Item>
          <Item value="download resume cv pdf" onSelect={run(downloadResume)}>
            <ArrowDownToLine /> Download resume
          </Item>
          <Item value="toggle theme dark light mode" onSelect={run(onToggleTheme)}>
            {theme === 'dark' ? <Sun /> : <Moon />} Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </Item>
          <Item value="send email compose" onSelect={run(() => (window.location.href = `mailto:${profile.email}`))}>
            <Mail /> Send an email
          </Item>
        </Command.Group>

        <Command.Group heading="Projects" className={groupCls}>
          {projects.map((p) => (
            <Item key={p.id} value={`project ${p.name} ${p.stack.join(' ')}`} onSelect={run(() => scrollToTarget(p.id))} hint={p.index}>
              <FolderGit2 /> {p.name}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigate" className={groupCls}>
          {navItems.map((n) => (
            <Item key={n.id} value={`go to ${n.label}`} onSelect={run(() => scrollToTarget(n.id))}>
              {sectionIcons[n.id]} {n.label}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading="Elsewhere" className={groupCls}>
          <Item value="linkedin profile" onSelect={run(() => window.open(profile.links.linkedin, '_blank', 'noopener,noreferrer'))}>
            <LinkedinIcon /> LinkedIn
          </Item>
          {profile.links.github && (
            <Item value="github profile code" onSelect={run(() => window.open(profile.links.github!, '_blank', 'noopener,noreferrer'))}>
              <GithubIcon /> GitHub
            </Item>
          )}
        </Command.Group>
      </Command.List>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[10px] text-subtle">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span className="ml-auto">esc close</span>
      </div>
    </Command.Dialog>
  )
}
