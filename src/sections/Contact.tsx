import { useState, type FormEvent, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, Copy, Mail, Send } from 'lucide-react'
import { profile } from '@/data/profile'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { GithubIcon, LeetcodeIcon, LinkedinIcon } from '@/components/BrandIcons'
import { cn } from '@/lib/cn'
import { copyEmail } from '@/lib/actions'
import { Magnetic } from '@/components/motion'
import { toast } from 'sonner'

const lookingFor = [
  'Software engineering roles: backend & full-stack',
  `Graduating in ${profile.graduation} from IIT Hyderabad`,
  'Teams working on APIs, data-intensive or distributed systems',
]

type Fields = { name: string; email: string; message: string }
type Errors = Partial<Record<keyof Fields, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(f: Fields): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.'
  if (f.message.trim().length < 10) e.message = 'Message should be at least 10 characters.'
  else if (f.message.length > 2000) e.message = 'Please keep it under 2000 characters.'
  return e
}

function Field({
  id,
  label,
  error,
  textarea,
  ...rest
}: {
  id: keyof Fields
  label: string
  error?: string
  textarea?: boolean
} & InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const cls = cn(
    'w-full rounded-xl border bg-bg px-4 text-[15px] text-fg placeholder:text-subtle transition-colors outline-none focus:border-accent focus-visible:outline-none',
    error ? 'border-red-500/70' : 'border-line-strong',
    textarea ? 'min-h-36 resize-y py-3' : 'h-12',
  )
  const describedBy = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[11px] tracking-wider text-subtle uppercase">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} name={id} aria-invalid={!!error} aria-describedby={describedBy} className={cls} {...rest} />
      ) : (
        <input id={id} name={id} aria-invalid={!!error} aria-describedby={describedBy} className={cls} {...rest} />
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Contact() {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  const update = (k: keyof Fields) => (e: { target: { value: string } }) => {
    const next = { ...fields, [k]: e.target.value }
    setFields(next)
    if (errors[k]) setErrors(validate(next))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus()
      return
    }
    const subject = `Portfolio enquiry from ${fields.name.trim()}`
    const body = `${fields.message.trim()}\n\n— ${fields.name.trim()}\n${fields.email.trim()}`
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSubmitted(true)
    toast('Opening your email app…', { description: 'Your message is pre-filled. Just hit send.' })
  }

  const onCopy = async () => {
    if (await copyEmail()) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  const channels = [
    { label: 'LinkedIn', value: 'in/karthikeya-mahenderkar', href: profile.links.linkedin, Icon: LinkedinIcon },
    profile.links.github && { label: 'GitHub', value: profile.links.github.replace(/^https?:\/\/(www\.)?/, ''), href: profile.links.github, Icon: GithubIcon },
    profile.links.leetcode && { label: 'LeetCode', value: profile.links.leetcode.replace(/^https?:\/\/(www\.)?/, ''), href: profile.links.leetcode, Icon: LeetcodeIcon },
  ].filter(Boolean) as { label: string; value: string; href: string; Icon: typeof LinkedinIcon }[]

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden border-t border-line py-24 md:py-32">
      <div
        aria-hidden="true"
        className="absolute bottom-[-20rem] left-1/2 size-[50rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 65%)' }}
      />
      <div className="container-page relative">
        <SectionHeading
          id="contact-title"
          index="05"
          eyebrow="Contact"
          title={
            <>
              Let’s build something <span className="font-serif text-muted italic">reliable.</span>
            </>
          }
          description="I’m looking for software engineering roles in backend and full-stack development. The fastest way to reach me is email."
        />

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="space-y-3 lg:col-span-5">
            <div className="group glow-border rounded-2xl border border-line bg-elev p-6 transition-colors hover:border-line-strong">
              <div className="mb-6 flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Mail className="size-[18px]" />
                </span>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-fg"
                  aria-live="polite"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-[11px] tracking-wider text-subtle uppercase">Email</p>
              <a href={`mailto:${profile.email}`} className="mt-1 block text-lg font-medium break-all transition-colors hover:text-accent sm:text-xl">
                {profile.email}
              </a>
            </div>

            {channels.map(({ label, value, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group glow-border flex items-center gap-4 rounded-2xl border border-line bg-elev p-5 transition-colors hover:border-line-strong"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors group-hover:text-fg">
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[11px] tracking-wider text-subtle uppercase">{label}</span>
                  <span className="block truncate text-[15px]">{value}</span>
                </span>
                <ArrowUpRight className="size-4 text-subtle transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
              </a>
            ))}

            <div className="rounded-2xl border border-dashed border-line-strong p-5">
              <p className="font-mono text-[11px] tracking-wider text-subtle uppercase">What I’m looking for</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {lookingFor.map((l) => (
                  <li key={l} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            <form noValidate onSubmit={onSubmit} className="h-full rounded-2xl border border-line bg-elev p-6 sm:p-8" aria-describedby="form-note">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Name" placeholder="Your name" autoComplete="name" value={fields.name} onChange={update('name')} error={errors.name} />
                <Field id="email" label="Email" type="email" placeholder="you@company.com" autoComplete="email" value={fields.email} onChange={update('email')} error={errors.email} />
              </div>
              <div className="mt-5">
                <Field id="message" label="Message" textarea placeholder="Tell me about the role or project…" value={fields.message} onChange={update('message')} error={errors.message} />
              </div>
              <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p id="form-note" className="text-xs leading-relaxed text-subtle">
                  {submitted ? (
                    <span className="text-fg/80">Your email app should open with the message ready to send. If it didn’t, email me directly.</span>
                  ) : (
                    'Opens your email app with this message pre-filled. Nothing is stored or sent from this site.'
                  )}
                </p>
                <Magnetic className="shrink-0">
                  <button
                    type="submit"
                    className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
                  >
                    Compose email
                    <Send className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </Magnetic>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
