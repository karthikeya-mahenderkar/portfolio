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
import { CalendarClock, Play, RotateCcw, Send, ShieldAlert, ShieldCheck, ShieldOff, Zap } from 'lucide-react'
import type { ProjectVisual as VisualKind } from '@/data/profile'
import { cn } from '@/lib/cn'

/*
 * Each demo mirrors the real behaviour of its repository:
 *  - Ticketing: atomic conditional UPDATE for inventory, row lock for validation,
 *    sold-out answered with 400 (GlobalExceptionHandler).
 *  - Stocks: detectEvents()/nextState() semantics, EVENT_MODE CROSSING vs ONCE_PER_DAY,
 *    52-week high ratchets up on a breakout, volume spikes fire at RVOL >= 3.0.
 *  - Mesh: gossip flooding with TTL (MeshSimulatorService), dedup on SHA-256 of the
 *    ciphertext before decryption, AES-GCM rejects tampered packets as INVALID.
 */

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

/** Small two-option switch (radio group) used for scenarios and modes. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-8 items-center rounded-full border border-line-strong p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-full rounded-full px-2.5 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            value === o.value ? 'bg-fg text-bg' : 'text-muted enabled:hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
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

type Pt = { x: number; y: number }
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** Right-hand result panel shared by both ticketing scenarios. */
function ResultPanel({ label, count, of, status }: { label: string; count: number; of: string; status: { text: string; bg: string; fg: string } }) {
  return (
    <g transform="translate(240 40)">
      <rect width="132" height="176" rx="12" className="fill-elev stroke-line-strong" />
      <text x="16" y="28" className="fill-subtle font-mono text-[9.5px]">{label}</text>
      <text x="16" y="88" className={cn('text-[52px] font-medium', count > 1 ? 'fill-red-500' : 'fill-fg')}>
        {count}
      </text>
      <text x="56" y="88" className="fill-subtle font-mono text-[11px]">{of}</text>
      <line x1="16" x2="116" y1="112" y2="112" strokeDasharray="3 4" className="stroke-line-strong" />
      <text x="16" y="134" className="fill-subtle font-mono text-[9.5px]">STATE</text>
      <g transform="translate(14 144)">
        <rect width="104" height="20" rx="10" className={status.bg} />
        <text x="52" y="13.5" textAnchor="middle" className={cn('font-mono text-[8.5px] font-semibold', status.fg)}>
          {status.text}
        </text>
      </g>
    </g>
  )
}

function LockBadge({ at }: { at: Pt }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <g transform={`translate(${at.x - 7} ${at.y})`}>
        <rect width="14" height="11" y="6" rx="2" className="fill-accent" />
        <path d="M3.5 6V4a3.5 3.5 0 0 1 7 0v2" fill="none" strokeWidth="1.8" className="stroke-accent" />
      </g>
    </motion.g>
  )
}

/* ─────────────── 01 · Ticketing: last-seat race and double scan ─────────────── */

const SEAT = 16
const GAP = 22
const GRID = { x: 30, y: 52 }
const TARGET_INDEX = 21
const SEAT_TARGET = {
  x: GRID.x + (TARGET_INDEX % 8) * GAP + SEAT / 2,
  y: GRID.y + Math.floor(TARGET_INDEX / 8) * GAP + SEAT / 2,
}
const SEAT_IDS = Array.from({ length: 40 }, (_, i) => i)
const ACTOR_1 = { x: 62, y: 214 }
const ACTOR_2 = { x: 168, y: 214 }
const TICKET_TARGET = { x: 115, y: 108 }
const QR_CELLS = (() => {
  const r = rng(42)
  return Array.from({ length: 49 }, (_, i) => {
    const c = i % 7
    const row = Math.floor(i / 7)
    const finder = (row < 2 && (c < 2 || c > 4)) || (row > 4 && c < 2)
    return !finder && r() > 0.5
  })
})()

type Scenario = 'seat' | 'scan'

function TicketingDemo() {
  const [scenario, setScenario] = useState<Scenario>('seat')
  const [protect, setProtect] = useState(true)
  const [protectedRun, setProtectedRun] = useState(true) // protection setting of the current / last run
  const [step, setStep] = useState(0) // 0 idle · 1 racing · 2 contention · 3 commit · 4 done
  const [count, setCount] = useState(0)
  const { at, clear } = useTimeline()
  const log = useLog()
  const running = step > 0 && step < 4

  const run = (withProtection = protect, sc = scenario) => {
    clear()
    log.reset()
    setProtectedRun(withProtection)
    setCount(0)
    setStep(1)
    const s2 = () => setStep(2)
    if (sc === 'seat') {
      if (withProtection) {
        log.push('A + B → POST /tickets   (1 seat left)')
        at(750, () => (s2(), log.push('A: UPDATE … WHERE sold < total → 1 row · B waits', 'muted')))
        at(1550, () => (setStep(3), setCount(1), log.push('A: COMMIT · ticket issued', 'ok')))
        at(2350, () => (setStep(4), log.push('B: re-checks sold < total → 0 rows → 400 Sold out', 'bad')))
      } else {
        log.push('A + B → POST /tickets   (read, then insert)')
        at(750, () => (s2(), log.push('A and B both read sold = 0 of 1', 'muted')))
        at(1450, () => (setStep(3), setCount(2), log.push('both insert · 2 tickets issued', 'bad')))
        at(2050, () => (setStep(4), log.push('OVERSOLD: 2 tickets for 1 seat', 'bad')))
      }
    } else {
      if (withProtection) {
        log.push('S1 + S2 → POST /ticket-validations   (same ticket)')
        at(750, () => (s2(), log.push('S1: SELECT … FOR UPDATE → row locked · S2 waits', 'muted')))
        at(1550, () => (setStep(3), setCount(1), log.push('S1: no earlier VALID scan → VALID ✓', 'ok')))
        at(2350, () => (setStep(4), log.push('S2: sees S1’s scan → INVALID (already admitted)', 'bad')))
      } else {
        log.push('S1 + S2 → POST /ticket-validations   (no row lock)')
        at(750, () => (s2(), log.push('S1 and S2 both see no earlier VALID scan', 'muted')))
        at(1450, () => (setStep(3), setCount(2), log.push('both record VALID', 'bad')))
        at(2050, () => (setStep(4), log.push('ADMITTED TWICE: 1 ticket, 2 entries', 'bad')))
      }
    }
  }

  const reset = () => {
    clear()
    log.reset()
    setStep(0)
    setCount(0)
  }

  const switchScenario = (s: Scenario) => {
    reset()
    setScenario(s)
    setProtect(true) // each scenario starts with its protection on
  }

  const autoplayRef = useAutoplay(() => run(true, 'seat'))

  const bad = !protectedRun && step >= 3
  const target = scenario === 'seat' ? SEAT_TARGET : TICKET_TARGET
  const wait2 = lerp(ACTOR_2, target, 0.55)
  const rejected2 = { x: ACTOR_2.x, y: ACTOR_2.y - 24 }
  const pos1 = step >= 1 ? (protectedRun ? target : { x: target.x - 5, y: target.y + 3 }) : ACTOR_1
  const pos2 = step === 0 ? ACTOR_2 : protectedRun ? (step >= 4 ? rejected2 : wait2) : { x: target.x + 5, y: target.y + 3 }
  const loser2 = protectedRun && step >= 4

  const isSeat = scenario === 'seat'
  const status =
    step === 0
      ? { text: 'READY', bg: 'fill-fg/[0.06]', fg: 'fill-muted' }
      : running
        ? { text: 'PROCESSING…', bg: 'fill-fg/[0.06]', fg: 'fill-fg' }
        : bad
          ? { text: isSeat ? 'OVERSOLD ✗' : 'ADMITTED TWICE ✗', bg: 'fill-red-500/15', fg: 'fill-red-500' }
          : { text: isSeat ? 'CONSISTENT ✓' : 'ADMITTED ONCE ✓', bg: 'fill-accent-soft', fg: 'fill-accent' }

  const badge = isSeat ? (protect ? 'ATOMIC ON' : 'ATOMIC OFF') : protect ? 'LOCK ON' : 'LOCK OFF'
  const actors = isSeat ? (['A', 'B'] as const) : (['S1', 'S2'] as const)

  const svg = (
    <svg
      viewBox="0 0 400 260"
      className="size-full"
      role="img"
      aria-label={
        isSeat
          ? 'Interactive demo: two buyers race for the last seat; an atomic conditional update decides who gets it'
          : 'Interactive demo: two staff scan the same ticket at once; a row lock makes sure it is admitted only once'
      }
    >
      <text x={GRID.x} y="34" className="fill-subtle font-mono text-[10.5px]">{isSeat ? 'EVENT · LAST SEAT' : 'GATE · SAME TICKET'}</text>
      <g transform={`translate(${GRID.x + 128} 23)`}>
        <rect width="72" height="16" rx="8" className={protect ? 'fill-accent-soft' : 'fill-red-500/15'} />
        <text x="36" y="11" textAnchor="middle" className={cn('font-mono text-[8.5px] font-semibold', protect ? 'fill-accent' : 'fill-red-500')}>
          {badge}
        </text>
      </g>

      {isSeat ? (
        SEAT_IDS.map((i) => {
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
              className={isTarget ? (bad ? 'fill-red-500' : protectedRun && step >= 3 ? 'fill-accent' : 'fill-transparent stroke-accent') : 'fill-fg/20'}
              animate={isTarget && step === 0 ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
              transition={isTarget && step === 0 ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
            />
          )
        })
      ) : (
        <g>
          <rect x="45" y="50" width="140" height="116" rx="10" strokeWidth="1.5" className={cn('fill-elev', bad ? 'stroke-red-500' : protectedRun && step >= 3 ? 'stroke-accent' : 'stroke-line-strong')} />
          <text x="57" y="66" className="fill-subtle font-mono text-[8px]">TICKET · GA-0421</text>
          <g transform="translate(87 76)">
            {QR_CELLS.map((on, i) => (on ? <rect key={i} x={(i % 7) * 8} y={Math.floor(i / 7) * 8} width="7" height="7" rx="1" className="fill-fg/75" /> : null))}
            {[
              [0, 0],
              [40, 0],
              [0, 40],
            ].map(([x, y]) => (
              <rect key={`${x}${y}`} x={x} y={y} width="15" height="15" rx="3" className="fill-elev stroke-fg/80" strokeWidth="3" />
            ))}
          </g>
        </g>
      )}

      <AnimatePresence>
        {protectedRun && (step === 2 || step === 3) && <LockBadge key="lock" at={{ x: target.x, y: target.y - (isSeat ? 32 : 76) }} />}
        {bad && (
          <motion.g key="x2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x={target.x + (isSeat ? 8 : 52)} y={target.y - (isSeat ? 26 : 70)} width="24" height="15" rx="4" className="fill-red-500" />
            <text x={target.x + (isSeat ? 20 : 64)} y={target.y - (isSeat ? 15.5 : 59.5)} textAnchor="middle" className="fill-white font-mono text-[9px] font-bold">
              ×2
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {[ACTOR_1, ACTOR_2].map((home, i) => (
        <g key={i}>
          <circle cx={home.x} cy={home.y} r="13" className="fill-elev stroke-line-strong" strokeWidth="1.5" />
          <text x={home.x} y={home.y + 4} textAnchor="middle" className="fill-fg font-mono text-[10px] font-semibold">
            {actors[i]}
          </text>
        </g>
      ))}
      <motion.circle r="5" className="fill-accent" initial={false} animate={{ cx: pos1.x, cy: pos1.y, opacity: step === 0 ? 0 : 1 }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
      <motion.circle
        r="5"
        className={loser2 || bad ? 'fill-red-500' : 'fill-muted'}
        initial={false}
        animate={{ cx: pos2.x, cy: pos2.y, opacity: step === 0 ? 0 : 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      {loser2 && (
        <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={ACTOR_2.x + 11} y={ACTOR_2.y - 20} className="fill-red-500 font-mono text-[9.5px] font-semibold">
          {isSeat ? '400' : 'INVALID'}
        </motion.text>
      )}
      {protectedRun && step === 2 && (
        <motion.text initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} x={wait2.x + 10} y={wait2.y + 4} className="fill-muted font-mono text-[9px]">
          WAIT
        </motion.text>
      )}

      <ResultPanel label={isSeat ? 'TICKETS ISSUED' : 'ADMISSIONS'} count={count} of={isSeat ? '/ 1 seat' : '/ 1 ticket'} status={status} />
    </svg>
  )

  return (
    <DemoShell
      autoplayRef={autoplayRef}
      svg={svg}
      controls={
        <>
          <Segmented
            label="Scenario"
            value={scenario}
            onChange={switchScenario}
            disabled={running}
            options={[
              { value: 'seat', label: 'Last seat' },
              { value: 'scan', label: 'Double scan' },
            ]}
          />
          <DemoButton variant="primary" onClick={() => run()} disabled={running}>
            <Play /> {isSeat ? 'Race buyers' : 'Scan together'}
          </DemoButton>
          <DemoButton onClick={() => setProtect((p) => !p)} disabled={running} pressed={protect}>
            {protect ? <ShieldCheck /> : <ShieldOff />} {isSeat ? 'Atomic update' : 'Row lock'} {protect ? 'on' : 'off'}
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle={isSeat ? 'Race the buyers, then turn the atomic update off' : 'Scan together, then turn the row lock off'} />}
    />
  )
}

/* ─────────────── 02 · Stocks: detection engine on a live price ─────────────── */

const N = 40
const HIGH_START = 150
const P_MIN = 90
const P_MAX = 175
const RVOL_THRESHOLD = 3.0
const PX = (i: number) => 24 + (i / N) * 340
const PY = (p: number) => 196 - ((p - P_MIN) / (P_MAX - P_MIN)) * 150
const fromY = (y: number) => P_MIN + ((196 - y) / 150) * (P_MAX - P_MIN)

const HISTORY = (() => {
  const r = rng(11)
  let v = 118
  return Array.from({ length: N }, (_, i) => {
    v += (r() - 0.45) * 6
    v = Math.min(HIGH_START - 4 - (i < 30 ? 6 : 0), Math.max(100, v))
    return v
  })
})()
const HISTORY_VOLS = (() => {
  const r = rng(5)
  return Array.from({ length: N }, () => 0.15 + r() * 0.3)
})()
const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false })

type EventMode = 'CROSSING' | 'ONCE_PER_DAY'
type Alert = 'none' | 'breakout' | 'suppressed' | 'volume'

function StocksDemo() {
  const [price, setPrice] = useState(HISTORY[N - 1])
  const [high, setHigh] = useState(HIGH_START)
  const [mode, setModeState] = useState<EventMode>('CROSSING') // the worker's default EVENT_MODE
  const [alert, setAlert] = useState<Alert>('none')
  const [alertKey, setAlertKey] = useState(0)
  const [spike, setSpike] = useState<number | null>(null)
  // detection state, mirroring DetectionState in the repo
  const lastPrice = useRef(HISTORY[N - 1])
  const currentHigh = useRef(HIGH_START)
  const highTriggered = useRef(false)
  const modeRef = useRef<EventMode>('CROSSING')
  const dragging = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const log = useLog()
  const { at, clear } = useTimeline()

  const showAlert = (a: Alert) => {
    setAlert(a)
    setAlertKey((k) => k + 1)
  }

  /** One quote through detectEvents() + nextState(). */
  const tick = (p: number) => {
    const next = Math.round(Math.min(P_MAX - 3, Math.max(P_MIN + 5, p)) * 10) / 10
    const last = lastPrice.current
    const h = currentHigh.current
    const brokeHigh = last < h && next >= h
    if (brokeHigh) {
      if (modeRef.current === 'CROSSING' || !highTriggered.current) {
        highTriggered.current = true
        currentHigh.current = Math.max(h, next) // nextState ratchets the 52-week high
        setHigh(currentHigh.current)
        showAlert('breakout')
        log.push(`${clock()} SSE ▸ HIGH breakout @ ${next.toFixed(1)} (52W high was ${h.toFixed(1)})`, 'ok')
      } else {
        showAlert('suppressed')
        log.push(`${clock()} crossed ${h.toFixed(1)} again → no event (ONCE_PER_DAY)`, 'muted')
      }
    }
    lastPrice.current = next
    setPrice(next)
  }

  const volumeSpike = () => {
    const ratio = Math.round((RVOL_THRESHOLD + 0.1 + Math.random() * 1.2) * 10) / 10
    setSpike(ratio)
    showAlert('volume')
    log.push(`${clock()} SSE ▸ VOLUME_SPIKE ${ratio.toFixed(1)}× avg (threshold ${RVOL_THRESHOLD.toFixed(1)}×)`, 'ok')
  }

  const setMode = (m: EventMode) => {
    setModeState(m)
    modeRef.current = m
    log.push(`EVENT_MODE = ${m}`, 'muted')
  }

  const nextDay = () => {
    highTriggered.current = false
    setSpike(null)
    setAlert('none')
    log.push('new trading day → once-per-day triggers re-armed', 'muted')
  }

  const reset = () => {
    clear()
    lastPrice.current = HISTORY[N - 1]
    currentHigh.current = HIGH_START
    highTriggered.current = false
    dragging.current = false
    setPrice(HISTORY[N - 1])
    setHigh(HIGH_START)
    setSpike(null)
    setAlert('none')
    log.reset()
  }

  // First view: glide the price up through the 52-week high so a breakout fires.
  const autoplayRef = useAutoplay(() => {
    const start = HISTORY[N - 1]
    const end = 158
    const steps = 14
    for (let s = 1; s <= steps; s++) at(s * 70, () => tick(start + ((end - start) * s) / steps))
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
    if (y != null) tick(fromY(y))
  }
  const onUp = () => {
    dragging.current = false
  }

  const pts = [...HISTORY, price]
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${PX(i).toFixed(1)} ${PY(p).toFixed(1)}`).join(' ')
  const area = `${line} L${PX(N)} 200 L${PX(0)} 200 Z`
  const above = price >= high
  const liveVol = spike ? Math.min(0.98, spike / 4.4) : 0.32
  const vols = [...HISTORY_VOLS, liveVol]
  const alertLabel = alert === 'breakout' ? 'BREAKOUT ↑' : alert === 'suppressed' ? 'NO EVENT' : alert === 'volume' ? `VOL ${spike?.toFixed(1)}×` : null
  const raised = high > HIGH_START
  const pillBelow = PY(price) < 84 // near the top: show the alert under the dot so it never covers the price

  const svg = (
    <svg ref={svgRef} viewBox="0 0 400 260" className="size-full select-none" role="img" aria-label="Interactive demo: drag the live price above the 52-week high to fire a breakout alert">
      <defs>
        <linearGradient id="stock-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="24" y="26" className="fill-subtle font-mono text-[10.5px]">DEMO · INTRADAY · {mode === 'CROSSING' ? 'CROSSING' : 'ONCE/DAY'}</text>
      <text x="376" y="26" textAnchor="end" className={cn('font-mono text-[12px] font-semibold', above ? 'fill-accent' : 'fill-fg')}>
        {price.toFixed(1)}
      </text>
      <text x="24" y="257" className="fill-subtle font-mono text-[8.5px]">↕ drag the dot or use the slider</text>
      {[66, 106, 146].map((y) => (
        <line key={y} x1="24" x2="376" y1={y} y2={y} className="stroke-line" />
      ))}
      {raised && <line x1="24" x2="376" y1={PY(HIGH_START)} y2={PY(HIGH_START)} strokeDasharray="2 5" className="stroke-cool/30" />}
      <motion.line x1="24" x2="376" initial={false} animate={{ y1: PY(high), y2: PY(high) }} transition={{ duration: 0.5, ease: 'easeOut' }} strokeDasharray="4 4" className="stroke-cool/80" />
      <motion.text x="28" initial={false} animate={{ y: PY(high) - 6 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="fill-cool font-mono text-[10px]">
        52W HIGH · {high.toFixed(1)}
      </motion.text>

      <path d={area} fill="url(#stock-area)" />
      <path d={line} fill="none" strokeWidth="1.8" strokeLinejoin="round" className="stroke-accent" />

      <g transform="translate(0 206)">
        {vols.map((h, i) => (
          <motion.rect key={i} x={PX(i) - 2.5} width="5" rx="1" initial={false} animate={{ height: h * 40, y: 40 - h * 40 }} transition={{ duration: 0.35 }} className={h > 0.65 ? 'fill-accent' : 'fill-fg/15'} />
        ))}
      </g>

      <g transform={`translate(${PX(N)} ${PY(price)})`}>
        <AnimatePresence>
          {alertLabel && (
            <motion.g key={alertKey} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: pillBelow ? 46 : 0 }} exit={{ opacity: 0 }}>
              <rect x="-98" y="-34" width="82" height="22" rx="6" className={alert === 'suppressed' ? 'fill-elev stroke-line-strong' : 'fill-accent'} />
              <text x="-57" y="-19.5" textAnchor="middle" className={cn('font-mono text-[10px] font-semibold', alert === 'suppressed' ? 'fill-muted' : 'fill-accent-fg')}>
                {alertLabel}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
        <circle r="14" className="pointer-events-none fill-accent/15" />
        <circle r="9" className="cursor-grab touch-none fill-accent stroke-bg active:cursor-grabbing" strokeWidth="3" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      </g>
    </svg>
  )

  return (
    <DemoShell
      autoplayRef={autoplayRef}
      svg={svg}
      controls={
        <>
          <Segmented
            label="Event mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'CROSSING', label: 'Crossing' },
              { value: 'ONCE_PER_DAY', label: 'Once/day' },
            ]}
          />
          <label className="flex h-8 items-center gap-2 rounded-full border border-line-strong px-3 text-xs text-fg/85">
            <span className="font-medium">Price</span>
            <input
              type="range"
              min={P_MIN + 5}
              max={P_MAX - 3}
              step={0.5}
              value={price}
              onChange={(e) => tick(Number(e.target.value))}
              aria-label="Live price"
              className="w-16 accent-[var(--accent)] sm:w-20"
            />
          </label>
          <DemoButton onClick={volumeSpike}>
            <Zap /> Volume spike
          </DemoButton>
          <DemoButton onClick={nextDay} label="Next trading day">
            <CalendarClock /> Next day
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle="Drag above the 52W high, dip below, then break the new high" />}
    />
  )
}

/* ─────────────── 03 · Mesh: gossip flooding to bridges, dedup, tamper ─────────────── */

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
const BRIDGE_NAME: Record<number, string> = { 6: 'bridge A', 7: 'bridge B' }
const SERVER = { x: 366, y: 136 }
const ADJ: number[][] = NODES.map((_, i) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])))
const TTL = 5
const HOP = 0.55

/** Gossip flood from `from`: every holder forwards to neighbours while TTL remains. Bridges upload instead of relaying. */
function flood(from: number) {
  const level = new Map<number, number>([[from, 0]])
  const parent = new Map<number, number>()
  const queue = [from]
  while (queue.length) {
    const n = queue.shift()!
    const l = level.get(n)!
    if (l >= TTL || (BRIDGES.includes(n) && n !== from)) continue
    for (const m of ADJ[n]) {
      if (!level.has(m)) {
        level.set(m, l + 1)
        parent.set(m, n)
        queue.push(m)
      }
    }
  }
  return { level, parent }
}

type Copy = { key: number; from: Pt; to: Pt; delay: number; tampered: boolean; upload?: { id: number; bridge: number } }

function MeshDemo() {
  const [copies, setCopies] = useState<Copy[]>([])
  const [holding, setHolding] = useState<Set<number>>(new Set())
  const [settled, setSettled] = useState(0)
  const [outcome, setOutcome] = useState<'idle' | 'settled' | 'invalid'>('idle')
  const [source, setSource] = useState<number | null>(null)
  const seenHashes = useRef(new Set<string>())
  const nextId = useRef(1)
  const nextKey = useRef(1)
  const log = useLog()
  const { at, clear } = useTimeline()

  const send = (from = 0, tampered = false) => {
    const id = nextId.current++
    const { level, parent } = flood(from)
    setSource(from)
    setHolding(new Set([from]))
    log.push(`pkt#${id}: encrypted on device ${from + 1} · TTL ${TTL} · gossiping`)
    if (tampered) log.push(`pkt#${id}: a relay flips 1 byte in transit`, 'bad')

    const fresh: Copy[] = []
    let maxLevel = 0
    level.forEach((l, node) => {
      if (node === from) return
      maxLevel = Math.max(maxLevel, l)
      const p = parent.get(node)!
      fresh.push({ key: nextKey.current++, from: NODES[p], to: NODES[node], delay: (l - 1) * HOP, tampered })
      at(l * HOP * 1000, () => setHolding((h) => new Set(h).add(node)))
    })
    const reachedBridges = BRIDGES.filter((b) => level.has(b)).sort((a, b) => level.get(a)! - level.get(b)!)
    reachedBridges.forEach((b, i) => {
      fresh.push({
        key: nextKey.current++,
        from: NODES[b],
        to: SERVER,
        delay: level.get(b)! * HOP + i * 0.35,
        tampered,
        upload: { id, bridge: b },
      })
    })
    at(maxLevel * HOP * 1000, () =>
      log.push(`gossip: ${level.size - 1} devices hold a copy · ${reachedBridges.length} bridges upload`, 'muted'),
    )
    setCopies((c) => [...c, ...fresh])
  }

  /** Backend ingestion: dedup on the ciphertext hash first, then decrypt (GCM), then settle. */
  const ingest = (copy: Copy) => {
    setCopies((c) => c.filter((x) => x.key !== copy.key))
    if (!copy.upload) return
    const { id, bridge } = copy.upload
    const hash = `${id}${copy.tampered ? ':tampered' : ''}` // identical copies share a ciphertext hash
    const name = BRIDGE_NAME[bridge]
    if (seenHashes.current.has(hash)) {
      log.push(`${name} → same ciphertext hash → DUPLICATE_DROPPED`, 'muted')
      return
    }
    seenHashes.current.add(hash)
    if (copy.tampered) {
      setOutcome('invalid')
      log.push(`${name} → GCM tag check failed → INVALID`, 'bad')
    } else {
      setSettled((s) => s + 1)
      setOutcome('settled')
      log.push(`${name} → pkt#${id} decrypted, verified · settled ✓`, 'ok')
    }
  }

  const reset = () => {
    clear()
    setCopies([])
    setHolding(new Set())
    setSettled(0)
    setOutcome('idle')
    setSource(null)
    seenHashes.current.clear()
    nextId.current = 1
    log.reset()
  }

  const autoplayRef = useAutoplay(() => send(0), 800)
  const pill =
    outcome === 'invalid'
      ? { text: 'TAMPERED → INVALID', bg: 'fill-red-500/15', fg: 'fill-red-500' }
      : outcome === 'settled'
        ? { text: 'SETTLED EXACTLY ONCE', bg: 'fill-accent-soft', fg: 'fill-accent' }
        : { text: 'TAP A NODE TO PAY', bg: 'fill-fg/[0.05]', fg: 'fill-muted' }

  const onNodeKey = (i: number) => (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      send(i)
    }
  }

  const svg = (
    <svg viewBox="0 0 400 260" className="size-full select-none" role="group" aria-label="Interactive demo: offline gossip mesh. Choose a device to send an encrypted payment; copies flood to bridges and the backend settles it once.">
      <text x="24" y="28" className="fill-subtle font-mono text-[10.5px]">OFFLINE MESH · GOSSIP · TTL {TTL}</text>
      {EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} className="stroke-line-strong" />
      ))}
      {BRIDGES.map((b) => (
        <line key={b} x1={NODES[b].x} y1={NODES[b].y} x2={SERVER.x - 14} y2={SERVER.y} strokeDasharray="3 3" className="stroke-cool/70" />
      ))}

      {NODES.map((n, i) => {
        const held = holding.has(i)
        if (BRIDGES.includes(i)) {
          return (
            <g key={i} transform={`translate(${n.x} ${n.y})`}>
              <circle r="9" strokeWidth="1.5" className={cn('fill-elev transition-colors', held ? 'stroke-accent' : 'stroke-cool')} />
              <text y="24" textAnchor="middle" className="fill-cool font-mono text-[9px]">{n.label}</text>
            </g>
          )
        }
        return (
          <g key={i} transform={`translate(${n.x} ${n.y})`} role="button" tabIndex={0} aria-label={`Send payment from device ${i + 1}`} onClick={() => send(i)} onKeyDown={onNodeKey(i)} className="group cursor-pointer outline-none">
            <circle r="18" className="fill-transparent" />
            <circle r="8" strokeWidth="1.5" className={cn('fill-elev transition-colors group-hover:stroke-accent group-focus-visible:stroke-accent', held || source === i ? 'stroke-accent' : 'stroke-line-strong')} />
            <circle r="2.5" className={cn('transition-colors group-hover:fill-accent', held || source === i ? 'fill-accent' : 'fill-fg/35')} />
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

      {copies.map((c) => (
        <motion.g
          key={c.key}
          className="pointer-events-none"
          initial={{ x: c.from.x, y: c.from.y, opacity: 0 }}
          animate={{ x: c.to.x, y: c.to.y, opacity: 1 }}
          transition={{ duration: c.upload ? 0.45 : HOP, delay: c.delay, ease: 'easeInOut', opacity: { duration: 0.1, delay: c.delay } }}
          onAnimationComplete={() => ingest(c)}
        >
          <circle r={c.upload ? 10 : 8} className={c.tampered ? 'fill-red-500/20' : 'fill-accent/15'} />
          <rect x="-4.5" y="-3.5" width="9" height="7" rx="1.5" className={c.tampered ? 'fill-red-500' : 'fill-accent'} />
          <path d="M-2.5 -3.5 v-2 a2.5 2.5 0 0 1 5 0 v2" fill="none" strokeWidth="1.3" className={c.tampered ? 'stroke-red-500' : 'stroke-accent'} />
        </motion.g>
      ))}

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
          <DemoButton onClick={() => send(0, true)}>
            <ShieldAlert /> Tamper in transit
          </DemoButton>
          <DemoButton onClick={reset} label="Reset demo">
            <RotateCcw />
          </DemoButton>
        </>
      }
      log={<DemoLog lines={log.lines} idle="Send a payment, then try tampering with one in transit" />}
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
