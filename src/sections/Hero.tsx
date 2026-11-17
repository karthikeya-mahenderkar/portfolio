import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownToLine, ArrowRight, Mail, MapPin } from 'lucide-react'
import { profile, projects } from '@/data/profile'
import { LinkButton } from '@/components/Button'
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons'
import { MeshCanvas } from '@/components/MeshCanvas'
import { Magnetic, SplitText } from '@/components/motion'
import { useScrolled } from '@/hooks/useScrolled'
import { cn } from '@/lib/cn'

const iconBtn =
  'grid size-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-fg'

const glance = [
  { k: 'Focus', v: 'Backend · Full-stack' },
  { k: 'Backend', v: 'Java · Spring Boot · PostgreSQL' },
  { k: 'Frontend', v: 'React · TypeScript' },
]

/** Compact "at a glance" card — gives the hero a right-hand focal point. */
function NowCard() {
  return (
    <div className="glow-border w-full overflow-hidden rounded-2xl border border-line bg-elev/80 shadow-card backdrop-blur-md lg:w-[25rem]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] tracking-wider text-subtle uppercase">At a glance</span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent">
          <span className="size-1.5 rounded-full bg-accent [animation:pulse-dot_2s_ease-in-out_infinite]" />
          Available
        </span>
      </div>
      <dl className="divide-y divide-line">
        {glance.map(({ k, v }) => (
          <div key={k} className="flex items-baseline justify-between gap-6 px-5 py-3">
            <dt className="font-mono text-[11px] tracking-wider text-subtle uppercase">{k}</dt>
            <dd className="text-right text-sm text-fg/90">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line p-2">
        <p className="px-3 pt-2 pb-1.5 font-mono text-[11px] tracking-wider text-subtle uppercase">Featured work</p>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-fg/[0.05]">
                <span className="font-mono text-[11px] text-accent">{p.index}</span>
                <span className="flex-1 truncate">{p.name}</span>
                <ArrowRight className="size-3.5 -translate-x-1 text-subtle opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Hero() {
  const reduce = useReducedMotion()
  const scrolled = useScrolled(40)

  const ease = [0.22, 1, 0.36, 1] as const
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease },
  })

  return (
    <section id="home" aria-labelledby="hero-title" className="grain relative flex min-h-[100svh] flex-col overflow-hidden pt-16">
      {/* Background layers */}
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="absolute -top-40 right-[-10%] size-[42rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 65%)' }}
      />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
        <MeshCanvas className="size-full" />
      </div>

      <div className="container-page relative z-10 flex flex-1 flex-col justify-center py-14 md:py-20">
        <motion.div {...rise(0.05)} className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs text-muted">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-elev/70 px-3 py-1.5 backdrop-blur">
            <span className="size-2 rounded-full bg-accent [animation:pulse-dot_2s_ease-in-out_infinite]" />
            Open to SDE opportunities · Class of {profile.graduation}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {profile.location}
          </span>
        </motion.div>


        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
          <h1 id="hero-title" className="max-w-5xl lg:max-w-none">
            <SplitText
              text={profile.firstName}
              delay={0.1}
              className="-mb-[0.14em] text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.92] font-medium tracking-[-0.045em] [&>span[aria-hidden]]:pb-[0.14em]"
            />
            <span className="flex items-end">
              <SplitText
                text={profile.lastName}
                delay={0.45}
                stagger={0.03}
                className="-mb-[0.12em] font-serif text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.95] tracking-[-0.02em] text-muted italic [&>span[aria-hidden]]:pr-[0.08em] [&>span[aria-hidden]]:pb-[0.12em]"
              />
              <motion.span
                aria-hidden="true"
                initial={reduce ? { opacity: 0 } : { y: '-120%', opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { y: '0%', opacity: 1 }}
                transition={reduce ? { duration: 0.4, delay: 0.9 } : { type: 'spring', stiffness: 420, damping: 13, delay: 1.05 }}
                className="mb-[0.16em] -ml-[0.06em] inline-block size-[0.14em] min-h-2 min-w-2 rounded-full bg-accent text-[clamp(2.75rem,9vw,7.5rem)]"
              />
            </span>
          </h1>
          <motion.div {...rise(0.75)} className="mt-10 md:mt-12">
            <p className="text-balance text-2xl leading-snug font-medium tracking-tight sm:text-3xl">{profile.headline}</p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-[17px]">{profile.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <LinkButton href="#projects">
                  View Projects
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </LinkButton>
              </Magnetic>
              <Magnetic>
                <LinkButton href={profile.resumeUrl} download={profile.resumeFileName} variant="secondary">
                  <ArrowDownToLine className="size-4" />
                  Download Resume
                </LinkButton>
              </Magnetic>
              <div className="flex items-center gap-2 sm:ml-2">
                {profile.links.github && (
                  <a href={profile.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className={iconBtn}>
                    <GithubIcon className="size-4" />
                  </a>
                )}
                <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className={iconBtn}>
                  <LinkedinIcon className="size-4" />
                </a>
                <a href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}`} className={iconBtn}>
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </motion.div>
          </div>

          <motion.aside {...rise(0.9)} aria-label="At a glance" className="lg:col-span-5 lg:justify-self-end">
            <NowCard />
          </motion.aside>
        </div>
      </div>

      {/* Scroll cue — laptop/desktop only (on phones the hero runs past the fold); hides once scrolling starts */}
      <a
        href="#about"
        aria-label="Scroll to About"
        className={cn(
          'absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-subtle transition-[opacity,color] duration-500 hover:text-fg lg:flex [@media(max-height:720px)]:!hidden',
          scrolled && 'pointer-events-none opacity-0',
        )}
      >
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase">Scroll</span>
        <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-line-strong">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-accent [animation:scroll-cue_2s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:hidden" />
        </span>
      </a>
    </section>
  )
}
