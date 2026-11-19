import { Fragment, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowRight, Check, Copy } from 'lucide-react'
import type { Project } from '@/data/profile'
import { cn } from '@/lib/cn'

/* ───────────── Architecture: left-to-right flow (stacks on phones) ───────────── */

export function ArchitectureFlow({ steps }: { steps: Project['architecture'] }) {
  return (
    <ol className="flex flex-col items-stretch gap-1.5 md:flex-row md:gap-1" aria-label="Architecture, in request order">
      {steps.map((s, i) => (
        <Fragment key={s.label}>
          <li className="min-w-0 flex-1 rounded-xl border border-line bg-elev px-3.5 py-3 transition-colors hover:border-line-strong">
            <span className="block font-mono text-[10px] tracking-wider text-accent">{String(i + 1).padStart(2, '0')}</span>
            <span className="mt-1 block text-sm leading-tight font-medium text-fg">{s.label}</span>
            <span className="mt-1 block font-mono text-[10.5px] leading-snug text-subtle">{s.detail}</span>
          </li>
          {i < steps.length - 1 && (
            <li aria-hidden="true" className="flex shrink-0 justify-center self-center text-subtle">
              <ArrowDown className="size-3.5 md:hidden" />
              <ArrowRight className="hidden size-3.5 md:block" />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  )
}

/* ───────────── Key code: tiny dependency-free highlighter ───────────── */

const KEYWORDS = new Set([
  // Java / TypeScript
  'public', 'private', 'protected', 'return', 'if', 'else', 'try', 'catch', 'new', 'throw', 'int', 'boolean',
  'void', 'class', 'static', 'final', 'const', 'let', 'function', 'export', 'import', 'true', 'false', 'null',
  // SQL / JPQL inside text blocks
  'UPDATE', 'SET', 'WHERE', 'AND', 'SELECT', 'FROM',
])
const TOKEN = /(\/\/.*$)|("""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@\w+)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(&&|\|\||===|==|>=|<=|<|>)/g

function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const [text, comment, str, annotation, num, word, op] = m
    const cls = comment
      ? 'text-subtle italic'
      : str
        ? 'text-cool'
        : annotation
          ? 'text-accent/80'
          : num
            ? 'text-cool'
            : op
              ? 'text-accent'
              : word && KEYWORDS.has(word)
                ? 'text-accent'
                : word && /^[A-Z]/.test(word)
                  ? 'text-fg'
                  : 'text-fg/80'
    out.push(
      <span key={m.index} className={cls}>
        {text}
      </span>,
    )
    last = m.index + text.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

export function CodeBlock({ code }: { code: Project['code'] }) {
  const [copied, setCopied] = useState(false)
  const lines = code.snippet.split('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — the code stays selectable */
    }
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-sunk">
      <figcaption className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-subtle">{code.file}</span>
        <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-subtle uppercase">{code.language}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-subtle transition-colors hover:text-fg"
        >
          {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <div className="overflow-x-auto">
        <pre className="min-w-max py-3 font-mono text-[12.5px] leading-[1.7] [font-feature-settings:'liga'_0,'calt'_0] [font-variant-ligatures:none]">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span aria-hidden="true" className="w-10 shrink-0 pr-3 text-right text-subtle/60 select-none">
                  {i + 1}
                </span>
                <span className={cn('pr-6', line.trim().startsWith('// …') && 'opacity-70')}>{line ? highlightLine(line) : ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  )
}
