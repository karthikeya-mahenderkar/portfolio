import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Reveal } from './Reveal'
import { ScrambleText } from './ScrambleText'
import { DrawLine } from './motion'

type Props = { index: string; eyebrow: string; title: ReactNode; description?: ReactNode; id?: string }

const EASE = [0.22, 1, 0.36, 1] as const

/** Flatten a title into reveal units: words for plain text, whole elements for styled spans. */
function toUnits(node: ReactNode): ReactNode[] {
  const out: ReactNode[] = []
  Children.forEach(node, (child) => {
    if (typeof child === 'string') {
      child.split(/\s+/).filter(Boolean).forEach((w) => out.push(w))
    } else if (isValidElement(child) && child.type === Fragment) {
      out.push(...toUnits((child as ReactElement<{ children?: ReactNode }>).props.children))
    } else if (child != null && child !== false) {
      out.push(child)
    }
  })
  return out
}

/** Each word slides up from behind a mask, staggered: a line-by-line cinematic reveal. */
function MaskedTitle({ children }: { children: ReactNode }) {
  const units = toUnits(children)
  return (
    <motion.span
      className="block"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
    >
      {units.map((u, i) => (
        <Fragment key={i}>
          <span className="-mb-[0.12em] inline-block overflow-hidden pr-[0.06em] pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hidden: { y: '110%', rotate: 4 },
                show: { y: '0%', rotate: 0, transition: { duration: 0.85, ease: EASE } },
              }}
            >
              {u}
            </motion.span>
          </span>
          {i < units.length - 1 && ' '}
        </Fragment>
      ))}
    </motion.span>
  )
}

export function SectionHeading({ index, eyebrow, title, description, id }: Props) {
  return (
    <div className="mb-14 grid gap-6 md:mb-20 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <Reveal y={12}>
          <p className="mb-5 flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-subtle uppercase">
            <span className="text-accent">{index}</span>
            <DrawLine className="w-8" />
            <ScrambleText text={eyebrow} />
          </p>
        </Reveal>
        <h2 id={id} className="text-balance text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl md:text-6xl">
          <MaskedTitle>{title}</MaskedTitle>
        </h2>
      </div>
      {description && (
        <Reveal delay={0.25} className="md:col-span-5 md:justify-self-end">
          <p className="max-w-md text-base leading-relaxed text-muted">{description}</p>
        </Reveal>
      )}
    </div>
  )
}
