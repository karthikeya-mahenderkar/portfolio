import { motion } from 'motion/react'
import { Code2, Database, LayoutPanelTop, Server, Sparkles, Wrench, type LucideIcon } from 'lucide-react'
import { skillGroups, type SkillGroup } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { Badge } from '@/components/Badge'
import { cn } from '@/lib/cn'

const icons: Record<SkillGroup['icon'], LucideIcon> = {
  code: Code2,
  server: Server,
  layout: LayoutPanelTop,
  database: Database,
  wrench: Wrench,
  sparkles: Sparkles,
}

/** Bento placement — presentation only, so it lives here rather than in the content file. */
const layout: Record<SkillGroup['icon'], { order: number; span: string }> = {
  server: { order: 0, span: 'lg:col-span-2' },
  code: { order: 1, span: '' },
  database: { order: 2, span: '' },
  layout: { order: 3, span: '' },
  sparkles: { order: 4, span: '' },
  wrench: { order: 5, span: 'sm:col-span-2 lg:col-span-3' },
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.15 } },
}
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function Skills() {
  const groups = [...skillGroups].sort((a, b) => layout[a.icon].order - layout[b.icon].order)

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative border-t border-line bg-sunk/40 py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          id="skills-title"
          index="02"
          eyebrow="Toolkit"
          title="The tools I reach for."
          description={
            <>
              Core skills are outlined. Badges marked{' '}
              <Badge tone="applied" className="align-middle">
                like this
              </Badge>{' '}
              are technologies I’ve used inside my projects.
            </>
          }
        />

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, i) => {
            const Icon = icons[group.icon]
            const wide = group.icon === 'wrench'
            return (
              <li key={group.title} className={layout[group.icon].span}>
                <Reveal
                  delay={(i % 3) * 0.06}
                  className={cn(
                    'group glow-border h-full rounded-2xl border border-line bg-bg p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card sm:p-7',
                    wide && 'lg:flex lg:items-center lg:gap-10',
                  )}
                >
                  <div className={cn('flex items-start gap-4', wide ? 'mb-5 lg:mb-0 lg:w-64 lg:shrink-0' : 'mb-6')}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent">
                      <Icon className="size-[18px]" />
                    </span>
                    <div>
                      <h3 className="text-lg leading-tight font-medium tracking-tight">{group.title}</h3>
                      <p className="mt-1 text-sm text-muted">{group.blurb}</p>
                    </div>
                  </div>
                  <motion.ul
                    variants={list}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {group.core.map((s) => (
                      <motion.li key={s} variants={item}>
                        <Badge>{s}</Badge>
                      </motion.li>
                    ))}
                    {group.applied?.map((s) => (
                      <motion.li key={s} variants={item}>
                        <Badge tone="applied">{s}</Badge>
                      </motion.li>
                    ))}
                  </motion.ul>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
