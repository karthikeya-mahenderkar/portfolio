import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cn } from '@/lib/cn'

const EASE = [0.22, 1, 0.36, 1] as const

/** A hairline that draws itself left → right when it enters the viewport. */
export function DrawLine({ className, delay = 0.1 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={cn('block h-px origin-left bg-line-strong', className)}
    />
  )
}

/**
 * Counts up to the number inside `value` (e.g. "7.05", "96.20%", "GPA 10.0"),
 * preserving any prefix/suffix and the original decimal places.
 */
export function CountUp({ value, duration = 1.4, className }: { value: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const match = value.match(/^(.*?)(\d+(?:\.\d+)?)(.*)$/)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!match || !inView || reduce) return
    const [, prefix, num, suffix] = match
    const target = parseFloat(num)
    const decimals = num.includes('.') ? num.split('.')[1].length : 0
    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}

/** Gently pulls its child toward the cursor (mouse only), then springs back. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.5 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.5 })

  const onMove = (e: ReactPointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} style={{ x, y }} className={cn('inline-flex', className)}>
      {children}
    </motion.span>
  )
}

/** Letters rise in one after another; screen readers get the plain word. */
export function SplitText({ text, delay = 0, stagger = 0.035, className }: { text: string; delay?: number; stagger?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <span className={cn('block', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        {[...text].map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block will-change-transform"
            initial={reduce ? { opacity: 0 } : { y: '105%', rotate: 6, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: '0%', rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + i * stagger, ease: EASE }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        ))}
      </span>
    </span>
  )
}
