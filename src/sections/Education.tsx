import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { GraduationCap, Sparkles } from 'lucide-react'
import { education, extracurricular } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { CountUp } from '@/components/motion'

export function Education() {
  const [degree, ...schooling] = education
  const railRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 75%', 'end 60%'] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="education" aria-labelledby="education-title" className="relative border-t border-line bg-sunk/40 py-24 md:py-32">
      <div className="container-page">
        <SectionHeading id="education-title" index="04" eyebrow="Education" title="Where I’ve learned." />

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div ref={railRef} className="relative pl-9 sm:pl-12 lg:col-span-8">
            {/* rail: faint track + accent fill that draws with scroll */}
            <span aria-hidden="true" className="absolute top-3 bottom-3 left-[7px] w-px bg-line" />
            <motion.span
              aria-hidden="true"
              style={{ scaleY }}
              className="absolute top-3 bottom-3 left-[7px] w-px origin-top bg-accent"
            />

            {/* Degree — the headline item */}
            <div className="relative">
              <span aria-hidden="true" className="absolute top-7 -left-9 size-[15px] rounded-full border-[3px] border-bg bg-accent ring-1 ring-accent sm:-left-12" />
              <Reveal>
                <article className="group glass glow-border rounded-2xl border p-6 duration-300 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] text-accent">
                      <GraduationCap className="size-3.5" /> Currently pursuing
                    </span>
                    <span className="font-mono text-xs text-subtle">{degree.year}</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-tight sm:text-3xl">{degree.institution}</h3>
                  <p className="mt-2 text-muted">{degree.credential}</p>
                  <p className="mt-5 inline-flex items-baseline gap-2 font-mono text-sm">
                    <span className="text-subtle">CGPA</span>
                    <CountUp value={degree.score.replace(/^CGPA\s*/, '')} className="text-xl text-fg" />
                    <span className="text-subtle">/ 10</span>
                  </p>
                </article>
              </Reveal>
            </div>

            {/* Schooling — compact */}
            <div className="relative mt-8">
              <span aria-hidden="true" className="absolute top-5 -left-9 size-[15px] rounded-full border-[3px] border-bg bg-line-strong ring-1 ring-line-strong sm:-left-12" />
              <Reveal delay={0.08}>
                <p className="mb-3 font-mono text-[11px] tracking-wider text-subtle uppercase">Schooling</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {schooling.map((s) => (
                    <li key={s.institution} className="glass relative rounded-xl border px-5 py-4 duration-300">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-medium tracking-tight">{s.institution}</h3>
                        <span className="shrink-0 font-mono text-[11px] text-subtle">{s.year}</span>
                      </div>
                      <p className="mt-1 flex items-baseline justify-between gap-3 text-sm text-muted">
                        {s.credential}
                        <CountUp value={s.score} className="font-mono text-fg" />
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.12} className="lg:col-span-4">
            <div className="glass relative rounded-2xl border p-7 duration-300">
              <span className="mb-5 grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Sparkles className="size-[18px]" />
              </span>
              <h3 className="text-lg font-medium tracking-tight">Beyond the classroom</h3>
              <ul className="mt-4 space-y-3">
                {extracurricular.map((e) => (
                  <li key={e} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
