# Karthikeya Mahenderkar — Portfolio

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Lucide

## Run
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build → dist/
npm run preview   # serve the production build
```

## Editing content
All content lives in **`src/data/profile.ts`** — no copy is hard-coded in components.

Placeholders (not on the resume, hidden until filled in):
- `profile.links.leetcode`
- `projects[*].links.github` / `projects[*].links.live`
- `profile.showPhone` — phone is on the resume but hidden on the public site by default

To update the resume, replace `public/Karthikeya-Mahenderkar-Resume.pdf` (keep the filename or update `profile.resumeUrl`).

## Structure
```
src/
  components/   reusable UI (Navbar, Reveal, Badge, MeshCanvas, ProjectVisual…)
  sections/     page sections (Hero, About, Skills, Projects, Education, Contact, Footer)
  data/         profile.ts — single source of truth
  hooks/        useTheme, useActiveSection, useScrolled
  styles/       design tokens + Tailwind theme
public/         resume PDF, favicon, OG image
```

## Deploy
Static site — deploy `dist/` to Vercel, Netlify, Cloudflare Pages or GitHub Pages.
After deploying, set absolute URLs for `og:image` / `twitter:image` in `index.html` (e.g. `https://your-domain/og-image.png`) so link previews work everywhere.
