import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { CalendarClock, Copy as CopyIcon, Lock, LockOpen, Play, RotateCcw, Send, Zap } from 'lucide-react'
import type { ProjectVisual as VisualKind } from '@/data/profile'
import { cn } from '@/lib/cn'

/* ───────────────────────── shared demo plumbing ───────────────────────── */

/** Deterministic pseudo-random so visuals are identical on every render. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Schedules steps and cancels them all on reset / unmount. */
function useTimeline() {
  const timers = useRef<number[]>([])
  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])
  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => clear, [clear])
  return { at, clear }
}

type Tone = 'ok' | 'bad' | 'muted' | undefined
type LogLine = { id: number; text: string; tone: Tone }
const MAX_LINES = 4

function useLog() {
  const [lines, setLines] = useState<LogLine[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone?: Tone) => {
    setLines((l) => [...l, { id: ++seq.current, text, tone }].slice(-MAX_LINES))
  }, [])
  const reset = useCallback(() => setLines([]), [])
  return useMemo(() => ({ lines, push, reset }), [lines, push, reset])
}

/** Runs `fn` once, the first time the element scrolls into view. */
function useAutoplay(fn: () => void, delay = 700) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })
  useEffect(() => {
    if (!inView) return
    const t = window.setTimeout(() => fnRef.current(), delay)
    return () => window.clearTimeout(t)
  }, [inView, delay])
  return ref
}

type DemoButtonProps = {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  label?: string
  pressed?: boolean
}

function DemoButton({ children, onClick, variant = 'secondary', disabled, label, pressed }: DemoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5',
        variant === 'primary'
          ? 'bg-fg text-bg enabled:hover:bg-accent enabled:hover:text-accent-fg'
          : 'border border-line-strong text-fg/85 enabled:hover:border-fg/40 enabled:hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

function DemoLog({ lines, idle }: { lines: LogLine[]; idle: string }) {
  return (
    <ol aria-live="polite" className="min-h-[4.75rem] space-y-1 font-mono text-[11px] leading-snug">
      {lines.length === 0 && <li className="text-subtle">&gt; {idle}</li>}
      <AnimatePresence initial={false}>
        {lines.map((l) => (
          <motion.li
            key={l.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'break-words sm:truncate',
              l.tone === 'ok' && 'text-accent',
              l.tone === 'bad' && 'text-red-500',
              l.tone === 'muted' && 'text-subtle',
              !l.tone && 'text-fg/80',
            )}
          >
            <span className="text-subtle">&gt; </span>
            {l.text}
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  )
}

function DemoShell({ svg, controls, log, autoplayRef }: { svg: ReactNode; controls: ReactNode; log: ReactNode; autoplayRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={autoplayRef}>
      <div className="relative aspect-[400/260]">{svg}</div>
      <div className="space-y-3 border-t border-line bg-bg/40 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">{controls}</div>
        {log}
      </div>
    </div>
  )
}

/* ─────────────── 01 · Ticketing: race two buyers for the last seat ─────────────── */

const SEAT = 16
const GAP = 22
const GRID = { x: 30, y: 52 }
const TARGET_INDEX = 21
const TARGET = {
  x: GRID.x + (TARGET_INDEX % 8) * GAP + SEAT / 2,
  y: GRID.y + Math.floor(TARGET_INDEX / 8) * GAP + SEAT / 2,
}
const BUYER_A = { x: 62, y: 214 }
const BUYER_B = { x: 168, y: 214 }
const WAIT_B = { x: BUYER_B.x + (TARGET.x - BUYER_B.x) * 0.55, y: BUYER_B.y + (TARGET.y - BUYER_B.y) * 0.55 }
const SEAT_IDS = Array.from({ length: 40 }, (_, i) => i)

function TicketingDemo() {
  const [locking, setLocking] = useState(true)
  const [mode, setMode] = useState(true) // locking mode of the current / last run
  const [step, setStep] = useState(0) // 0 idle · 1 racing · 2 contention · 3 commit · 4 done
  const [tickets, setTickets] = useState(0)
  const { at, clear } = useTimeline()
  const log = useLog()
  const running = step > 0 && step < 4

  const run = (withLock = locking) => {
    clear()
    log.reset()
    setMode(withLock)
    setTickets(0)
    setStep(1)
    if (withLock) {
      log.push('A + B → POST /tickets   (1 seat left)')
      at(750, () => {
        setStep(2)
        log.push('A: SELECT … FOR UPDATE → row locked · B waits', 'muted')
      })
      at(1550, () => {
        setStep(3)
        setTickets(1)
        log.push('A: stock 1 → 0 · COMMIT · ticket issued', 'ok')
      })
      at(2350, () => {
        setStep(4)
        log.push('B: lock released, stock = 0 → 409 Sold out', 'bad')
      })
    } else {
      log.push('A + B → POST /tickets   (locking OFF)')
      at(750, () => {
        setStep(2)
        log.push('A and B both read stock = 1', 'muted')
      })
      at(1450, () => {
        setStep(3)
        setTickets(2)
        log.push('both write stock = 0 · 2 tickets issued', 'bad')
      })
      at(2050, () => {
        setStep(4)
        log.push('OVERSOLD: 2 tickets for 1 seat', 'bad')
      })
    }
  }

  const reset = () => {
    clear()
    log.reset()
    setStep(0)
    setTickets(0)
  }

  const autoplayRef = useAutoplay(() => run(true))

  const oversold = !mode && step >= 3
  const sold = mode && step >= 3
  const posA = step >= 1 ? (mode ? TARGET : { x: TARGET.x - 5, y: TARGET.y + 3 }) : BUYER_A
  const REJECTED_B = { x: BUYER_B.x, y: BUYER_B.y - 24 }
  const posB = step === 0 ? BUYER_B : mode ? (step >= 4 ? REJECTED_B : WAIT_B) : { x: TARGET.x + 5, y: TARGET.y + 3 }
  const bRejected = mode && step >= 4

  const status =
    step === 0
      ? { text: 'READY', bg: 'fill-fg/[0.06]', fg: 'fill-muted' }
      : running
        ? { text: 'PROCESSING…', bg: 'fill-fg/[0.06]', fg: 'fill-fg' }
        : oversold
          ? { text: 'OVERSOLD ✗', bg: 'fill-red-500/15', fg: 'fill-red-500' }
          : { text: 'CONSISTENT ✓', bg: 'fill-accent-soft', fg: 'fill-accent' }

  const svg = (
    <svg viewBox="0 0 400 260" className="size-full" role="img" aria-label="Interactive demo: two buyers race for the last seat; pessimistic locking decides who gets it">
      <text x={GRID.x} y="34" className="fill-subtle font-mono text-[10.5px]">EVENT · LAST SEAT</text>
      <g transform={`translate(${GRID.x + 114} 23)`}>
        <rect width="62" height="16" rx="8" className={locking ? 'fill-accent-soft' : 'fill-red-500/15'} />
        <text x="31" y="11" textAnchor="middle" className={cn('font-mono text-[8.5px] font-semibold', locking ? 'fill-accent' : 'fill-red-500')}>
          {locking ? 'LOCK ON' : 'LOCK OFF'}
        </text>
      </g>

      {SEAT_IDS.map((i) => {
        const isTarget = i === TARGET_INDEX
        return (
          <motion.rect
            key={i}
            x={GRID.x + (i % 8) * GAP}
            y={GRID.y + Math.floor(i / 8) * GAP}
            width={SEAT}
            height={SEAT}
            rx="4"
            strokeWidth="1.5"
            className={isTarget ? (oversold ? 'fill-red-500' : sold ? 'fill-accent' : 'fill-transparent stroke-accent') : 'fill-fg/20'}
            animate={isTarget && step === 0 ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
            transition={isTarget && step === 0 ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
          />
        )
      })}

      <AnimatePresence>
        {mode && (step === 2 || step === 3) && (
          <motion.g key="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <g transform={`translate(${TARGET.x - 7} ${TARGET.y - 32})`}>
              <rect width="14" height="11" y="6" rx="2" className="fill-accent" />
              <path d="M3.5 6V4a3.5 3.5 0 0 1 7 0v2" fill="none" strokeWidth="1.8" className="stroke-accent" />
            </g>
          </motion.g>
        )}
        {oversold && (
          <motion.g key="x2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x={TARGET.x + 8} y={TARGET.y - 26} width="24" height="15" rx="4" className="fill-red-500" />
            <text x={TARGET.x + 20} y={TARGET.y - 15.5} textAnchor="middle" className="fill-white font-mono text-[9px] font-bold">×2</text>
          </motion.g>
        )}
      </AnimatePresence>

      {[
        { id: 'A', home: BUYER_A },
        { id: 'B', home: BUYER_B },
      ].map(({ id, home }) => (
        <g key={id}>
          <circle cx={home.x} cy={home.y} r="13" className="fill-elev stroke-line-strong" strokeWidth="1.5" />
          <text x={home.x} y={home.y + 4} textAnchor="middle" className="fill-fg font-mono text-[11px] font-semibold">{id}</text>
        </g>
      ))}
      <motion.circle
        r="5"
        className="fill-accent"
        initial={false}
        animate={{ cx: posA.x, cy: posA.y, opacity: step === 0 ? 0 : 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      <motion.circle
        r="5"
        className={bRejected || oversold ? 'fill-red-500' : 'fill-muted'}
        initial={false}
        animate={{ cx: posB.x, cy: posB.y, opacity: step === 0 ? 0 : 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      {bRejected && (
        <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={BUYER_B.x + 12} y={BUYER_B.y - 20} className="fill-red-500 font-mono text-[10px] font-semibold">
          409
        </motion.text>
      )}
      {mode && step === 2 && (
        <motion.text
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
          x={WAIT_B.x + 10}
          y={WAIT_B.y + 4}
          className="fill-muted font-mono text-[9px]"
        >
          WAIT
        </motion.text>
      )}

      <g transform="translate(240 40)">
        <rect width="132" height="176" rx="12" className="fill-elev stroke-line-strong" />
        <text x="16" y="28" className="fill-subtle font-mono text-[9.5px]">TICKETS ISSUED</text>
        <text x="16" y="88" className={cn('text-[52px] font-medium', tickets > 1 ? 'fill-red-500' : 'fill-fg')}>
          {tickets}
        </text>
        <text x="56" y="88" className="fill-subtle font-mono text-[11px]">/ 1 seat</text>
        <line x1="16" x2="116" y1="112" y2="112" strokeDasharray="3 4" className="stroke-line-strong" />
        <text x="16" y="134" className="fill-subtle font-mono text-[9.5px]">STATE</text>
        <g transform="translate(16 144)">
          <rect width="100" height="20" rx="10" className={status.bg} />
          <text x="50" y="13.5" textAnchor="middle" className={cn('font-mono text-[9px] font-semibold', status.fg)}>
            {status.text}
          </text>
        </g>
      </g>
    </svg>
  )

  return (
    <DemoShell
      autoplayRef={autoplayRef}
      svg={svg}
      controls={
        <>
          <DemoButton variant="primary" onClick={() => run()} disabled={running}>
            <Play /> Race both buyers
          </DemoButton>
          <DemoButton onClick={() => setLocking((l) => !l)} disabled={running} pressed={locking}>
            {locking ? <Lock /> : <LockOpen />} Locking {locking ? 'on' : 'off'}
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle="Race both buyers, then turn locking off and try again" />}
    />
  )
}

/* ─────────────── 02 · Stocks: drag price through the 52-week high ─────────────── */

const N = 40
const HIGH = 150
const P_MIN = 90
const P_MAX = 175
const PX = (i: number) => 24 + (i / N) * 340
const PY = (p: number) => 196 - ((p - P_MIN) / (P_MAX - P_MIN)) * 150
const fromY = (y: number) => P_MIN + ((196 - y) / 150) * (P_MAX - P_MIN)

const HISTORY = (() => {
  const r = rng(11)
  let v = 118
  return Array.from({ length: N }, (_, i) => {
    v += (r() - 0.45) * 6
    v = Math.min(HIGH - 4 - (i < 30 ? 6 : 0), Math.max(100, v))
    return v
  })
})()
const HISTORY_VOLS = (() => {
  const r = rng(5)
  return Array.from({ length: N }, () => 0.15 + r() * 0.3)
})()
const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false })

type Alert = 'none' | 'breakout' | 'suppressed' | 'volume'

function StocksDemo() {
  const [price, setPrice] = useState(HISTORY[N - 1])
  const [spike, setSpike] = useState(false)
  const [alert, setAlert] = useState<Alert>('none')
  const firedToday = useRef({ breakout: false, volume: false })
  const wasAbove = useRef(false)
  const dragging = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const log = useLog()
  const { at, clear } = useTimeline()

  const updatePrice = (p: number) => {
    const next = Math.round(Math.min(P_MAX - 3, Math.max(P_MIN + 5, p)) * 10) / 10
    setPrice(next)
    const above = next > HIGH
    if (above && !wasAbove.current) {
      if (!firedToday.current.breakout) {
        firedToday.current.breakout = true
        setAlert('breakout')
        log.push(`${clock()} SSE ▸ BREAKOUT 52W-HIGH @ ${next.toFixed(1)}`, 'ok')
      } else {
        setAlert('suppressed')
        log.push(`${clock()} crossed again → suppressed (once-per-day)`, 'muted')
      }
    }
    wasAbove.current = above
  }

  const injectSpike = () => {
    setSpike(true)
    if (!firedToday.current.volume) {
      firedToday.current.volume = true
      setAlert('volume')
      log.push(`${clock()} SSE ▸ ABNORMAL VOLUME ×3.4 avg`, 'ok')
    } else {
      log.push(`${clock()} volume spike → suppressed (once-per-day)`, 'muted')
    }
  }

  const nextDay = () => {
    firedToday.current = { breakout: false, volume: false }
    setSpike(false)
    setAlert('none')
    log.push('new trading day → triggers re-armed', 'muted')
  }

  const reset = () => {
    clear()
    firedToday.current = { breakout: false, volume: false }
    wasAbove.current = false
    dragging.current = false
    setPrice(HISTORY[N - 1])
    setSpike(false)
    setAlert('none')
    log.reset()
  }

  // First view: glide the price up through the 52W high so visitors see an alert fire.
  const autoplayRef = useAutoplay(() => {
    const start = HISTORY[N - 1]
    const end = 158
    const steps = 14
    for (let s = 1; s <= steps; s++) at(s * 70, () => updatePrice(start + ((end - start) * s) / steps))
  }, 900)

  const toSvgY = (e: ReactPointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).y
  }
  const onDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (!dragging.current) return
    const y = toSvgY(e)
    if (y != null) updatePrice(fromY(y))
  }
  const onUp = () => {
    dragging.current = false
  }

  const pts = [...HISTORY, price]
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${PX(i).toFixed(1)} ${PY(p).toFixed(1)}`).join(' ')
  const area = `${line} L${PX(N)} 200 L${PX(0)} 200 Z`
  const above = price > HIGH
  const vols = [...HISTORY_VOLS, spike ? 0.95 : 0.32]
  const alertLabel = alert === 'breakout' ? 'BREAKOUT ↑' : alert === 'suppressed' ? 'SUPPRESSED' : alert === 'volume' ? 'VOL SPIKE' : null

  const svg = (
    <svg
      ref={svgRef}
      viewBox="0 0 400 260"
      className="size-full select-none"
      role="img"
      aria-label="Interactive demo: drag the live price above the 52-week high to fire a breakout alert"
    >
      <defs>
        <linearGradient id="stock-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="24" y="26" className="fill-subtle font-mono text-[10.5px]">DEMO · INTRADAY</text>
      <text x="376" y="26" textAnchor="end" className={cn('font-mono text-[12px] font-semibold', above ? 'fill-accent' : 'fill-fg')}>
        {price.toFixed(1)}
      </text>
      {[66, 106, 146].map((y) => (
        <line key={y} x1="24" x2="376" y1={y} y2={y} className="stroke-line" />
      ))}
      <line x1="24" x2="376" y1={PY(HIGH)} y2={PY(HIGH)} strokeDasharray="4 4" className="stroke-cool/70" />
      <text x="28" y={PY(HIGH) - 6} className="fill-cool font-mono text-[10px]">52W HIGH · {HIGH}</text>

      <path d={area} fill="url(#stock-area)" />
      <path d={line} fill="none" strokeWidth="1.8" strokeLinejoin="round" className="stroke-accent" />

      <g transform="translate(0 206)">
        {vols.map((h, i) => (
          <motion.rect
            key={i}
            x={PX(i) - 2.5}
            width="5"
            rx="1"
            initial={false}
            animate={{ height: h * 40, y: 40 - h * 40 }}
            transition={{ duration: 0.35 }}
            className={h > 0.85 ? 'fill-accent' : 'fill-fg/15'}
          />
        ))}
      </g>

      <g transform={`translate(${PX(N)} ${PY(price)})`}>
        <AnimatePresence>
          {alertLabel && (
            <motion.g key={alert} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <rect x="-98" y="-34" width="82" height="22" rx="6" className={alert === 'suppressed' ? 'fill-elev stroke-line-strong' : 'fill-accent'} />
              <text x="-57" y="-19.5" textAnchor="middle" className={cn('font-mono text-[10px] font-semibold', alert === 'suppressed' ? 'fill-muted' : 'fill-accent-fg')}>
                {alertLabel}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
        <circle r="14" className="pointer-events-none fill-accent/15" />
        <circle
          r="9"
          className="cursor-grab touch-none fill-accent stroke-bg active:cursor-grabbing"
          strokeWidth="3"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </g>
      <text x="24" y="42" className="fill-subtle font-mono text-[9px]">↕ drag the dot or use the slider</text>
    </svg>
  )

  return (
    <DemoShell
      autoplayRef={autoplayRef}
      svg={svg}
      controls={
        <>
          <label className="flex h-8 items-center gap-2 rounded-full border border-line-strong px-3 text-xs text-fg/85">
            <span className="font-medium">Price</span>
            <input
              type="range"
              min={P_MIN + 5}
              max={P_MAX - 3}
              step={0.5}
              value={price}
              onChange={(e) => updatePrice(Number(e.target.value))}
              aria-label="Live price"
              className="w-20 accent-[var(--accent)] sm:w-24"
            />
          </label>
          <DemoButton onClick={injectSpike}>
            <Zap /> Volume spike
          </DemoButton>
          <DemoButton onClick={nextDay}>
            <CalendarClock /> Next day
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle="Drag the price above the 52W high, then cross it again" />}
    />
  )
}

/* ─────────────── 03 · Mesh: tap a node to send an encrypted payment ─────────────── */

const NODES: { x: number; y: number; label?: string }[] = [
  { x: 42, y: 140 },
  { x: 102, y: 70 },
  { x: 110, y: 200 },
  { x: 175, y: 132 },
  { x: 235, y: 62 },
  { x: 240, y: 200 },
  { x: 304, y: 96, label: 'BRIDGE A' },
  { x: 304, y: 176, label: 'BRIDGE B' },
]
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [2, 5], [4, 6], [3, 6], [5, 7], [3, 7],
]
const BRIDGES = [6, 7]
const SERVER = { x: 366, y: 136 }
const ADJ: number[][] = NODES.map((_, i) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])))

/** Shortest hop path from `from` to the nearest of `targets` (gossip routing stand-in). */
function bfs(from: number, targets: number[]): number[] {
  const prev = new Map<number, number>([[from, -1]])
  const queue = [from]
  while (queue.length) {
    const n = queue.shift()!
    if (targets.includes(n)) {
      const path = [n]
      let p = prev.get(n)!
      while (p !== -1) {
        path.unshift(p)
        p = prev.get(p)!
      }
      return path
    }
    for (const m of ADJ[n]) {
      if (!prev.has(m)) {
        prev.set(m, n)
        queue.push(m)
      }
    }
  }
  return [from]
}

type Packet = { key: number; id: number; path: number[]; delay: number }
const HOP = 0.42

function MeshDemo() {
  const [packets, setPackets] = useState<Packet[]>([])
  const [settled, setSettled] = useState(0)
  const [last, setLast] = useState<'idle' | 'settled' | 'duplicate'>('idle')
  const [active, setActive] = useState<number | null>(null)
  const seen = useRef(new Set<number>())
  const nextId = useRef(1)
  const nextKey = useRef(1)
  const log = useLog()

  const send = (from = 0) => {
    const id = nextId.current++
    const path = bfs(from, BRIDGES)
    setActive(from)
    log.push(`pkt#${id}: encrypt RSA-OAEP + AES-GCM · ${path.length - 1} hops · TTL 5`)
    setPackets((p) => [...p, { key: nextKey.current++, id, path, delay: 0 }])
  }

  const duplicate = () => {
    const id = nextId.current++
    setActive(0)
    log.push(`pkt#${id}: same packet uploaded via bridge A and B`)
    setPackets((p) => [
      ...p,
      { key: nextKey.current++, id, path: bfs(0, [6]), delay: 0 },
      { key: nextKey.current++, id, path: bfs(0, [7]), delay: 0.3 },
    ])
  }

  const arrive = (pkt: Packet) => {
    setPackets((p) => p.filter((x) => x.key !== pkt.key))
    if (seen.current.has(pkt.id)) {
      setLast('duplicate')
      log.push(`pkt#${pkt.id}: duplicate → putIfAbsent rejected`, 'bad')
    } else {
      seen.current.add(pkt.id)
      setSettled((s) => s + 1)
      setLast('settled')
      log.push(`pkt#${pkt.id}: verified · debit/credit committed ✓`, 'ok')
    }
  }

  const reset = () => {
    setPackets([])
    setSettled(0)
    setLast('idle')
    setActive(null)
    seen.current.clear()
    nextId.current = 1
    log.reset()
  }

  const autoplayRef = useAutoplay(() => send(0), 800)

  const pill =
    last === 'duplicate'
      ? { text: 'DUPLICATE REJECTED', bg: 'fill-red-500/15', fg: 'fill-red-500' }
      : last === 'settled'
        ? { text: 'SETTLED EXACTLY ONCE', bg: 'fill-accent-soft', fg: 'fill-accent' }
        : { text: 'TAP A NODE TO PAY', bg: 'fill-fg/[0.05]', fg: 'fill-muted' }

  const onNodeKey = (i: number) => (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      send(i)
    }
  }

  const svg = (
    <svg
      viewBox="0 0 400 260"
      className="size-full select-none"
      role="group"
      aria-label="Interactive demo: offline gossip mesh. Choose a device to send an encrypted payment to the settlement ledger."
    >
      <text x="24" y="28" className="fill-subtle font-mono text-[10.5px]">OFFLINE MESH · TAP A NODE</text>
      {EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} className="stroke-line-strong" />
      ))}
      {BRIDGES.map((b) => (
        <line key={b} x1={NODES[b].x} y1={NODES[b].y} x2={SERVER.x - 14} y2={SERVER.y} strokeDasharray="3 3" className="stroke-cool/70" />
      ))}

      {NODES.map((n, i) => {
        const isBridge = BRIDGES.includes(i)
        if (isBridge) {
          return (
            <g key={i} transform={`translate(${n.x} ${n.y})`}>
              <circle r="9" strokeWidth="1.5" className="fill-elev stroke-cool" />
              <text y="24" textAnchor="middle" className="fill-cool font-mono text-[9px]">
                {n.label}
              </text>
            </g>
          )
        }
        return (
          <g
            key={i}
            transform={`translate(${n.x} ${n.y})`}
            role="button"
            tabIndex={0}
            aria-label={`Send payment from device ${i + 1}`}
            onClick={() => send(i)}
            onKeyDown={onNodeKey(i)}
            className="group cursor-pointer outline-none"
          >
            <circle r="18" className="fill-transparent" />
            <circle
              r="8"
              strokeWidth="1.5"
              className={cn(
                'fill-elev transition-colors group-hover:stroke-accent group-focus-visible:stroke-accent',
                active === i ? 'stroke-accent' : 'stroke-line-strong',
              )}
            />
            <circle r="2.5" className={cn('transition-colors group-hover:fill-accent', active === i ? 'fill-accent' : 'fill-fg/35')} />
          </g>
        )
      })}

      <g transform={`translate(${SERVER.x - 14} ${SERVER.y - 24})`}>
        <rect width="28" height="48" rx="5" className="fill-elev stroke-cool/80" />
        {[11, 21, 31].map((y) => (
          <line key={y} x1="7" x2="21" y1={y} y2={y} className="stroke-cool/60" />
        ))}
      </g>
      <text x={SERVER.x} y={SERVER.y + 40} textAnchor="middle" className="fill-cool font-mono text-[9px]">LEDGER</text>
      <text x={SERVER.x} y={SERVER.y - 32} textAnchor="middle" className="fill-fg font-mono text-[11px] font-semibold">×{settled}</text>

      {packets.map((pkt) => {
        const xs = [...pkt.path.map((n) => NODES[n].x), SERVER.x]
        const ys = [...pkt.path.map((n) => NODES[n].y), SERVER.y]
        return (
          <motion.g
            key={pkt.key}
            className="pointer-events-none"
            initial={{ x: xs[0], y: ys[0] }}
            animate={{ x: xs, y: ys }}
            transition={{ duration: Math.max(0.5, (xs.length - 1) * HOP), delay: pkt.delay, ease: 'linear' }}
            onAnimationComplete={() => arrive(pkt)}
          >
            <circle r="11" className="fill-accent/15" />
            <rect x="-5" y="-4" width="10" height="8" rx="1.5" className="fill-accent" />
            <path d="M-3 -4 v-2.5 a3 3 0 0 1 6 0 v2.5" fill="none" strokeWidth="1.4" className="stroke-accent" />
          </motion.g>
        )
      })}

      <g transform="translate(24 226)">
        <rect width="156" height="22" rx="6" className="fill-fg/[0.04] stroke-line" />
        <text x="9" y="14.5" className="fill-muted font-mono text-[10px]">RSA-2048 + AES-256-GCM</text>
      </g>
      <g transform="translate(232 226)">
        <rect width="144" height="22" rx="6" className={pill.bg} />
        <text x="72" y="14.5" textAnchor="middle" className={cn('font-mono text-[9.5px] font-semibold', pill.fg)}>
          {pill.text}
        </text>
      </g>
    </svg>
  )

  return (
    <DemoShell
      autoplayRef={autoplayRef}
      svg={svg}
      controls={
        <>
          <DemoButton variant="primary" onClick={() => send(0)}>
            <Send /> Send payment
          </DemoButton>
          <DemoButton onClick={duplicate}>
            <CopyIcon /> Duplicate upload
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle="Send a payment, then try a duplicate upload" />}
    />
  )
}

const visuals: Record<VisualKind, ComponentType> = {
  ticketing: TicketingDemo,
  stocks: StocksDemo,
  mesh: MeshDemo,
}

export function ProjectVisual({ kind }: { kind: VisualKind }) {
  const Visual = visuals[kind]
  return <Visual />
}
