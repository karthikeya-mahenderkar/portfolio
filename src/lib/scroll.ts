import Lenis from 'lenis'

/**
 * Single smooth-scroll controller for the app.
 * Falls back to native scrolling when Lenis is not running (reduced motion / SSR).
 */
let lenis: Lenis | null = null
const HEADER_OFFSET = -80

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return () => {}
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    // Lenis honours CSS scroll-padding-top / scroll-margin, so no extra offset here.
    anchors: true,
    stopInertiaOnNavigate: true,
  })
  return () => {
    lenis?.destroy()
    lenis = null
  }
}

/** Scroll to an element id, a selector, or a pixel position. */
export function scrollToTarget(target: string | number) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target.startsWith('#') ? target : `#${target}`) : null
  if (lenis) {
    lenis.scrollTo(el ?? (typeof target === 'number' ? target : 0))
    return
  }
  const top = el ? el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET : typeof target === 'number' ? target : 0
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Lock page scroll (menus, dialogs). Works with and without Lenis. */
export function setScrollLocked(locked: boolean) {
  const root = document.documentElement
  if (locked) {
    lenis?.stop()
    root.style.overflowY = 'hidden'
  } else {
    lenis?.start()
    root.style.overflowY = ''
  }
}
