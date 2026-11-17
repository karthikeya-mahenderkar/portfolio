import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'

type RevealProps = HTMLMotionProps<'div'> & { delay?: number; y?: number; x?: number }

/** Fades content into view once, optionally sliding along x/y. Plain fade for reduced motion. */
export function Reveal({ delay = 0, y = 24, x = 0, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y, x: reduce ? 0 : x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
