import { useEffect, useRef } from 'react'

type Node = { x: number; y: number; vx: number; vy: number; r: number }
type Packet = { from: number; to: number; t: number; speed: number }

const LINK_DIST = 170

/**
 * A quiet gossip-mesh: drifting nodes, links between neighbours and packets
 * hopping node → node (a nod to the UPI Offline Mesh project).
 * Pauses offscreen / in background tabs; one static frame for reduced motion.
 */
export function MeshCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let nodes: Node[] = []
    let packets: Packet[] = []
    let raf = 0
    let visible = true
    const pointer = { x: -9999, y: -9999 }
    const colors = { fg: '241,237,228', accent: '255,122,61' }

    const readColors = () => {
      const s = getComputedStyle(document.documentElement)
      const toRgb = (hex: string) => {
        const v = hex.trim().replace('#', '')
        const n = parseInt(v.length === 3 ? v.replace(/./g, (c) => c + c) : v, 16)
        return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
      }
      colors.fg = toRgb(s.getPropertyValue('--fg') || '#f1ede4')
      colors.accent = toRgb(s.getPropertyValue('--accent') || '#ff7a3d')
    }

    const neighbours = (i: number) => {
      const out: number[] = []
      const a = nodes[i]
      for (let j = 0; j < nodes.length; j++) {
        if (j !== i && Math.hypot(a.x - nodes[j].x, a.y - nodes[j].y) < LINK_DIST) out.push(j)
      }
      return out
    }

    const spawnPacket = (from?: number) => {
      const start = from ?? Math.floor(Math.random() * nodes.length)
      const n = neighbours(start)
      if (!n.length) return
      packets.push({ from: start, to: n[Math.floor(Math.random() * n.length)], t: 0, speed: 0.006 + Math.random() * 0.008 })
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(56, Math.max(18, (w * h) / 22000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.8,
      }))
      packets = []
      for (let i = 0; i < Math.ceil(count / 6); i++) spawnPacket()
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(${colors.fg},${(1 - d / LINK_DIST) * 0.16})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const near = Math.max(0, 1 - Math.hypot(n.x - pointer.x, n.y - pointer.y) / 160)
        ctx.fillStyle = near > 0 ? `rgba(${colors.accent},${0.35 + near * 0.6})` : `rgba(${colors.fg},0.45)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + near * 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const p of packets) {
        const a = nodes[p.from]
        const b = nodes[p.to]
        if (!a || !b) continue
        const x = a.x + (b.x - a.x) * p.t
        const y = a.y + (b.y - a.y) * p.t
        ctx.fillStyle = `rgba(${colors.accent},0.18)`
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(${colors.accent},0.95)`
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }
      const next: Packet[] = []
      for (const p of packets) {
        p.t += p.speed
        if (p.t >= 1) {
          // hop onward — gossip propagation
          const n = neighbours(p.to).filter((j) => j !== p.from)
          if (n.length && Math.random() > 0.15) next.push({ from: p.to, to: n[Math.floor(Math.random() * n.length)], t: 0, speed: p.speed })
        } else next.push(p)
      }
      packets = next
      if (packets.length < Math.ceil(nodes.length / 6)) spawnPacket()
    }

    const loop = () => {
      if (visible && !document.hidden) {
        step()
        draw()
      }
      raf = requestAnimationFrame(loop)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onLeave = () => {
      pointer.x = pointer.y = -9999
    }

    readColors()
    resize()
    draw()

    const themeObserver = new MutationObserver(() => {
      readColors()
      if (reduce) draw()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(canvas)

    let resizeTimer = 0
    let lastW = window.innerWidth
    const onResize = () => {
      // ignore height-only changes (mobile URL bar show/hide)
      if (window.innerWidth === lastW) return
      lastW = window.innerWidth
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resize()
        draw()
      }, 150)
    }
    window.addEventListener('resize', onResize)

    if (!reduce) {
      window.addEventListener('pointermove', onPointer, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      themeObserver.disconnect()
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className={className} />
}
