import { Activity, ArrowRight, GraduationCap, MapPin, ShieldCheck, Ticket, type LucideIcon } from 'lucide-react'
import { about, profile, projects, softSkills } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'

const problemIcons: Record<(typeof about.problems)[number]['icon'], LucideIcon> = {
  ticket: Ticket,
  shield: ShieldCheck,
  activity: Activity,
}

function SubHeading({ children }: { children: string }) {
  return <h3 className="mb-6 font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">{children}</h3>
}

function DetailsCard() {
  return (
    <div className="glass glow-border overflow-hidden rounded-2xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
          <GraduationCap className="size-4 text-accent" aria-hidden="true" />
          IIT Hyderabad · B.Tech ’{profile.graduation.slice(2)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-subtle">
          <MapPin className="size-3.5" aria-hidden="true" />
          {profile.location}
        </span>
      </div>
      <dl className="divide-y divide-line">
        {about.focus.map((f) => (
          <div key={f.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-mono text-[11px] tracking-wider text-subtle uppercase sm:pt-0.5">{f.label}</dt>
            <dd className="text-sm text-fg/90">{f.value}</dd>
          </div>
        ))}
        <div className="grid gap-2 px-6 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
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
    </div>
  )
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 md:py-32">
      <div className="container-page">
        <SectionHeading id="about-title" index="01" eyebrow="About" title="Model the failure first. Then build." />

        {/* Lead + quick facts side by side */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="text-balance text-2xl leading-snug font-medium tracking-tight text-fg sm:text-[2rem] sm:leading-[1.25]">
              {about.lead}
            </p>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-5">
            <DetailsCard />
          </Reveal>
        </div>

        {/* Problems I like: each card leads to the project that solves it */}
        <div className="mt-20 md:mt-24">
          <Reveal>
            <SubHeading>Problems I like</SubHeading>
            <p className="-mt-2 mb-8 max-w-2xl text-lg text-muted sm:text-xl">{about.problemsIntro}</p>
          </Reveal>
          <ul className="grid gap-3 md:grid-cols-3">
            {about.problems.map((p, i) => {
              const Icon = problemIcons[p.icon]
              const project = projects.find((x) => x.id === p.projectId)
              return (
                <li key={p.title}>
                  <Reveal delay={i * 0.08} className="h-full">
                    <a
                      href={`#${p.projectId}`}
                      className="group glass glow-border flex h-full flex-col rounded-2xl border p-6 duration-300 hover:-translate-y-0.5"
                    >
                      <div className="mb-6 flex items-center justify-between gap-3">
                        <span className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent">
                          <Icon className="size-[18px]" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-[10.5px] tracking-wider text-subtle uppercase">{p.tag}</span>
                      </div>
                      <h4 className="text-lg font-medium tracking-tight">{p.title}</h4>
                      <p className="mt-2 mb-6 text-[15px] leading-relaxed text-muted">{p.text}</p>
                      <span className="mt-auto inline-flex items-center gap-2 border-t border-line pt-4 text-sm text-fg/80 transition-colors group-hover:text-accent">
                        <span className="font-mono text-[11px] text-accent">{project?.index}</span>
                        {project?.name}
                        <ArrowRight
                          className="ml-auto size-4 -translate-x-1 opacity-60 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </span>
                    </a>
                  </Reveal>
                </li>
              )
            })}
          </ul>
        </div>

        {/* How I work: a real sequence, so numbered */}
        <div className="mt-20 md:mt-24">
          <Reveal>
            <SubHeading>How I work</SubHeading>
          </Reveal>
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            <span aria-hidden="true" className="absolute top-[18px] right-[calc(33.333%-34px)] left-[18px] hidden h-px bg-line-strong md:block" />
            {about.approach.map((step, i) => (
              <li key={step.title} className="relative">
                <Reveal delay={i * 0.1} className="flex gap-4 md:block">
                  <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-bg font-mono text-xs text-accent">
                    0{i + 1}
                  </span>
                  <div className="md:mt-5">
                    <h4 className="text-lg font-medium tracking-tight">{step.title}</h4>
                    <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
