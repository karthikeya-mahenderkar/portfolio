import { motion, useReducedMotion } from 'motion/react'
import { MapPin } from 'lucide-react'
import { about, profile, softSkills } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'

function Portrait() {
  const reduce = useReducedMotion()
  const { photo } = profile
  return (
    <motion.figure
      initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="group relative mx-auto w-full max-w-sm md:max-w-none"
    >
      {/* offset frame behind the photo */}
      <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-line-strong transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-sunk shadow-card">
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 40vw, 384px"
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
          <span>
            <span className="block text-base font-medium tracking-tight">{profile.name}</span>
            <span className="mt-0.5 block font-mono text-[11px] tracking-wide text-white/75">
              IIT Hyderabad · B.Tech ’{profile.graduation.slice(2)}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] text-white/90 backdrop-blur-md">
            <MapPin className="size-3" aria-hidden="true" />
            Hyderabad
          </span>
        </figcaption>
      </div>
    </motion.figure>
  )
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 md:py-32">
      <div className="container-page">
        <SectionHeading id="about-title" index="01" eyebrow="About" title="Model the failure first. Then build." />

        <div className="grid gap-12 md:grid-cols-12 md:gap-14 lg:gap-20">
          {/* Portrait: first on mobile, right-hand column (sticky) on larger screens */}
          <div className="md:order-2 md:col-span-5">
            <div className="md:sticky md:top-28">
              <Portrait />
            </div>
          </div>

          <div className="md:order-1 md:col-span-7">
            <div className="space-y-6">
              {about.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <p className={i === 0 ? 'text-xl leading-relaxed text-fg sm:text-2xl sm:leading-relaxed' : 'text-base leading-relaxed text-muted sm:text-lg'}>
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15} className="mt-10">
              <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elev shadow-card">
                {about.focus.map((f) => (
                  <div key={f.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                    <dt className="font-mono text-[11px] tracking-wider text-subtle uppercase sm:pt-0.5">{f.label}</dt>
                    <dd className="text-sm text-fg/90">{f.value}</dd>
                  </div>
                ))}
                <div className="grid gap-2 px-6 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                  <dt className="font-mono text-[11px] tracking-wider text-subtle uppercase sm:pt-1">Strengths</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {softSkills.map((s) => (
                      <span key={s} className="rounded-md bg-fg/[0.05] px-2 py-1 text-xs text-muted">
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
