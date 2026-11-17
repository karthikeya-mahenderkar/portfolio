import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { CommandMenu } from '@/components/CommandMenu'
import { useTheme } from '@/hooks/useTheme'
import { startSmoothScroll } from '@/lib/scroll'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Skills } from '@/sections/Skills'
import { Projects } from '@/sections/Projects'
import { Education } from '@/sections/Education'
import { Contact } from '@/sections/Contact'
import { Footer } from '@/sections/Footer'

export default function App() {
  const { theme, toggle } = useTheme()

  useEffect(() => startSmoothScroll(), [])

  return (
    <MotionConfig reducedMotion="user">
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Education />
        <Contact />
      </main>
      <Footer />
      <CommandMenu theme={theme} onToggleTheme={() => toggle()} />
      <Toaster
        theme={theme}
        position="bottom-center"
        offset={24}
        toastOptions={{
          classNames: {
            toast: '!rounded-xl !border !border-line-strong !bg-elev !text-fg !shadow-card !font-sans',
            description: '!text-muted !font-mono !text-[11px]',
            icon: '!text-accent',
          },
        }}
      />
    </MotionConfig>
  )
}
