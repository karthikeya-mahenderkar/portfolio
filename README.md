# Karthikeya Mahenderkar — Portfolio

**Live:** https://karthikeya-mahenderkar.vercel.app

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
Hosted on Vercel. Redeploy from this folder with `npx vercel deploy --prod`
(or connect the GitHub repo in the Vercel dashboard for automatic deploys on push).
If the domain changes, update the absolute URLs in `index.html`, `public/robots.txt` and `public/sitemap.xml`.
