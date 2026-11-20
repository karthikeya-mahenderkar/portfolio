import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Check, Maximize2, MessageSquare, MousePointerClick, ShieldCheck, X } from 'lucide-react'
import { projects, type Project } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { Badge } from '@/components/Badge'
import { GithubIcon } from '@/components/BrandIcons'
import { ProjectVisual } from '@/components/ProjectVisual'
import { ArchitectureFlow, CodeBlock } from '@/components/CaseStudyExtras'
import { cn } from '@/lib/cn'
import { ScrambleText } from '@/components/ScrambleText'
import { DrawLine } from '@/components/motion'
import { setScrollLocked } from '@/lib/scroll'

const HIGHLIGHTS = 2

/** Interactive demo frame with a pointer-follow spotlight (mouse only). */
function PreviewFrame({ project, onExpand }: { project: Project; onExpand?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, var(--accent-soft), transparent 60%)`

  const onMove = (e: ReactPointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 100)
    my.set(((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className="group/frame glow-border relative overflow-hidden rounded-2xl border border-line bg-elev shadow-card transition-colors duration-500 hover:border-line-strong"
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <span className="mr-auto inline-flex min-w-0 items-center gap-2 text-[13px] font-medium text-fg/90">
          <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
          {project.guarantee}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 font-mono text-[10px] tracking-wide whitespace-nowrap text-accent uppercase">
          <MousePointerClick className="size-3" aria-hidden="true" />
          Try it
        </span>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Open ${project.name} case study`}
            aria-haspopup="dialog"
            className="-mr-2 grid size-8 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <Maximize2 className="size-3.5" />
          </button>
        )}
      </div>
      <div className="relative bg-grid">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/frame:opacity-100"
          style={{ background: spotlight }}
        />
        <div className="relative">
          <ProjectVisual kind={project.visual} />
        </div>
      </div>
    </div>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  const { github, live } = project.links
  const linkCls =
    'inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm transition-colors hover:border-fg/40 hover:bg-fg/[0.04]'
  if (!github && !live) {
    return (
      <a href="#contact" className="group inline-flex h-10 items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
        <MessageSquare className="size-4" />
        Ask me about this project
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {github && (
        <a href={github} target="_blank" rel="noopener noreferrer" className={linkCls}>
          <GithubIcon className="size-4" /> Source
        </a>
      )}
      {live && (
        <a href={live} target="_blank" rel="noopener noreferrer" className={cn(linkCls, 'border-transparent bg-fg text-bg hover:bg-accent hover:text-accent-fg')}>
          Live demo <ArrowUpRight className="size-4" />
        </a>
      )}
    </div>
  )
}

const featureList = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }
const featureItem = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

/** Feature bullets; `animateIn` staggers them in (used for the expanded breakdown). */
function FeatureList({ items, animateIn = false }: { items: string[]; animateIn?: boolean }) {
  return (
    <motion.ul
      className="space-y-3"
      variants={featureList}
      initial={animateIn ? 'hidden' : false}
      animate="show"
    >
      {items.map((f) => (
        <motion.li key={f} variants={animateIn ? featureItem : undefined} className="flex gap-3 text-[15px] leading-relaxed text-muted">
          <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{f}</span>
        </motion.li>
      ))}
    </motion.ul>
  )
}

const LAYOUT_SPRING = { type: 'spring' as const, stiffness: 210, damping: 30, mass: 0.9 }

function ProjectRow({ project, flip, isOpen, onOpen }: { project: Project; flip: boolean; isOpen: boolean; onOpen: (id: string) => void }) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [slotHeight, setSlotHeight] = useState<number>()
  const highlights = project.features.slice(0, HIGHLIGHTS)

  const open = () => {
    setSlotHeight(slotRef.current?.offsetHeight)
    onOpen(project.id)
  }

  return (
    <article id={project.id} aria-labelledby={`${project.id}-title`} className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
      <Reveal x={flip ? 40 : -40} y={0} className={cn('lg:col-span-6', flip && 'lg:order-2')}>
        {/* keeps the row's height while the frame is lifted into the case study */}
        <div ref={slotRef} style={{ minHeight: isOpen ? slotHeight : undefined }}>
          {!isOpen && (
            <motion.div layoutId={`frame-${project.id}`} transition={LAYOUT_SPRING} style={{ borderRadius: 16 }} className="relative z-10">
              <PreviewFrame project={project} onExpand={open} />
            </motion.div>
          )}
        </div>
      </Reveal>

      <div className="lg:col-span-6">
        <Reveal>
          <div className="mb-5 flex items-center gap-4">
            <span className="font-serif text-5xl leading-none text-accent italic sm:text-6xl">{project.index}</span>
            <DrawLine className="flex-1" delay={0.25} />
            <ScrambleText text={project.tagline} className="text-right font-mono text-[11px] tracking-wider text-subtle uppercase" />
          </div>
          <h3 id={`${project.id}-title`} className="text-3xl font-medium tracking-tight sm:text-4xl">
            {project.name}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">{project.summary}</p>
        </Reveal>

        <Reveal delay={0.06} className="mt-7">
          <FeatureList items={highlights} />
        </Reveal>

        <Reveal delay={0.1} className="mt-6">
          <button
            type="button"
            onClick={open}
            aria-haspopup="dialog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
          >
            Open case study: problem, role & all features
            <Maximize2 className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
          </button>

          <div className="mt-6 flex flex-col gap-5 border-t border-line pt-6">
            <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
              {project.stack.map((s) => (
                <li key={s}>
                  <Badge>{s}</Badge>
                </li>
              ))}
            </ul>
            <ProjectLinks project={project} />
          </div>
        </Reveal>
      </div>
    </article>
  )
}

/** Full-screen case study; the demo frame flies in from the row via a shared layoutId. */
function CaseStudy({ project, onClose, fromLink = false }: { project: Project; onClose: () => void; fromLink?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = `${project.id}-case-title`

  useEffect(() => {
    setScrollLocked(true)
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const content = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  })

  return (
    <>
      <motion.div
        key="backdrop"
        aria-hidden="true"
        className="fixed inset-0 z-[90] bg-bg/70 backdrop-blur-2xl backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className="fixed inset-0 z-[91] overflow-y-auto overscroll-contain"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-8 sm:py-10" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div {...content(0.05)} className="mb-6 flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 flex items-center gap-3 font-mono text-[11px] tracking-wider text-subtle uppercase">
                <span className="text-accent">{project.index}</span>
                {project.tagline}
              </p>
              <h2 id={titleId} className="text-3xl font-medium tracking-tight sm:text-5xl">
                {project.name}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close case study"
              className="liquid-glass relative grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </motion.div>

          <motion.div
            layoutId={fromLink ? undefined : `frame-${project.id}`}
            transition={LAYOUT_SPRING}
            style={{ borderRadius: 16 }}
            {...(fromLink && { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } })}
            className="relative"
          >
            <PreviewFrame project={project} />
          </motion.div>

          <motion.p {...content(0.3)} className="mt-10 text-lg leading-relaxed text-fg/90 sm:text-xl">
            {project.summary}
          </motion.p>

          <motion.div {...content(0.38)} className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            <div className="bg-bg p-6">
              <p className="mb-2 font-mono text-[11px] tracking-wider text-subtle uppercase">The problem</p>
              <p className="text-[15px] leading-relaxed text-fg/85">{project.problem}</p>
            </div>
            <div className="bg-bg p-6">
              <p className="mb-2 font-mono text-[11px] tracking-wider text-subtle uppercase">My contribution</p>
              <p className="text-[15px] leading-relaxed text-fg/85">{project.contribution}</p>
            </div>
          </motion.div>

          <motion.div {...content(0.44)} className="mt-10">
            <p className="mb-4 font-mono text-[11px] tracking-wider text-subtle uppercase">Architecture</p>
            <ArchitectureFlow steps={project.architecture} />
          </motion.div>

          <motion.div {...content(0.5)} className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] tracking-wider text-subtle uppercase">Key code</p>
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-subtle transition-colors hover:text-accent">
                  view full source ↗
                </a>
              )}
            </div>
            <CodeBlock code={project.code} />
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{project.code.note}</p>
          </motion.div>

          <motion.div {...content(0.56)} className="mt-10">
            <p className="mb-4 font-mono text-[11px] tracking-wider text-subtle uppercase">Key engineering</p>
            <FeatureList items={project.features} animateIn />
          </motion.div>

          <motion.div {...content(0.62)} className="mt-10 flex flex-col gap-5 border-t border-line pt-6 pb-6">
            <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
              {project.stack.map((s) => (
                <li key={s}>
                  <Badge>{s}</Badge>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ProjectLinks project={project} />
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
                <ArrowLeft className="size-4" /> Back to projects
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}

const CASE_PREFIX = '#case-'
const caseFromHash = () => {
  const h = window.location.hash
  if (!h.startsWith(CASE_PREFIX)) return null
  const id = h.slice(CASE_PREFIX.length)
  return projects.some((p) => p.id === id) ? id : null
}

export function Projects() {
  // A case study shared by link opens instantly (no fly-in from an offscreen row).
  const [openId, setOpenId] = useState<string | null>(() => (typeof window === 'undefined' ? null : caseFromHash()))
  const [fromLink, setFromLink] = useState(() => openId !== null)
  const pushedState = useRef(false)
  const openProject = projects.find((p) => p.id === openId) ?? null

  // Browser back/forward opens and closes case studies.
  useEffect(() => {
    const onPop = () => {
      pushedState.current = false
      setFromLink(false)
      setOpenId(caseFromHash())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Return focus to the project's "Open case study" button after closing.
  const wasOpen = useRef(openId)
  useEffect(() => {
    if (wasOpen.current && !openId) {
      const id = wasOpen.current
      window.setTimeout(() => document.querySelector<HTMLElement>(`#${id} button[aria-haspopup="dialog"]:not([aria-label])`)?.focus({ preventScroll: true }), 0)
    }
    wasOpen.current = openId
  }, [openId])

  const onOpen = useCallback((id: string) => {
    window.history.pushState({ caseStudy: id }, '', `${CASE_PREFIX}${id}`)
    pushedState.current = true
    setFromLink(false)
    setOpenId(id)
  }, [])

  const onClose = useCallback(() => {
    if (pushedState.current) {
      // we added the history entry, so stepping back closes it (via popstate)
      window.history.back()
    } else {
      // opened from a shared link: just drop the hash
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setOpenId(null)
    }
  }, [])

  return (
    <section id="projects" aria-labelledby="projects-title" className="relative overflow-x-clip border-t border-line py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          id="projects-title"
          index="03"
          eyebrow="Selected work"
          title={
            <>
              Systems built to <span className="font-serif text-muted italic">hold up.</span>
            </>
          }
          description="Three projects, each built around one hard guarantee. Each preview is a live demo: race the buyers, drag the price, send a payment."
        />
        <LayoutGroup>
          <div className="space-y-24 md:space-y-32">
            {projects.map((p, i) => (
              <ProjectRow key={p.id} project={p} flip={i % 2 === 1} isOpen={openId === p.id} onOpen={onOpen} />
            ))}
          </div>
          <AnimatePresence>{openProject && <CaseStudy key={openProject.id} project={openProject} onClose={onClose} fromLink={fromLink} />}</AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  )
}
