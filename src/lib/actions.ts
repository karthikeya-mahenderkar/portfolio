import { toast } from 'sonner'
import { profile } from '@/data/profile'

/** Shared user actions — used by the command palette, contact section, etc. */
export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email)
    toast.success('Email copied', { description: profile.email })
    return true
  } catch {
    toast.error('Couldn’t access the clipboard', { description: profile.email })
    return false
  }
}

export function downloadResume() {
  const a = document.createElement('a')
  a.href = profile.resumeUrl
  a.download = profile.resumeFileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  toast.success('Resume download started')
}

export const OPEN_PALETTE_EVENT = 'open-command-palette'
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
