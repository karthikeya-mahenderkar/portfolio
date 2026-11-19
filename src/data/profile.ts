/**
 * ─────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR ALL PORTFOLIO CONTENT
 *  Everything here is taken from the resume PDF. Edit freely.
 *
 *  ⚠️ PLACEHOLDERS — fields set to `null` are NOT on the resume.
 *  Anything left `null` is hidden from the site automatically, so
 *  nothing fake is ever shown. Fill these in when you have them:
 *    - profile.links.github
 *    - profile.links.leetcode
 *    - projects[*].links.live (no live demos yet)
 * ─────────────────────────────────────────────────────────────
 */

export const profile = {
  name: 'Karthikeya Mahenderkar',
  firstName: 'Karthikeya',
  lastName: 'Mahenderkar',
  initials: 'KM',
  role: 'Backend & Full-Stack Developer',
  headline: 'I build backends that stay correct under pressure.',
  intro:
    'B.Tech student at IIT Hyderabad building concurrency-safe, real-time systems in Java and Spring Boot, with React and TypeScript on the frontend.',
  graduation: '2027',
  location: 'Hyderabad, India',
  email: 'ms23btech11017@iith.ac.in',
  /** Present on the resume but hidden on the public site for privacy. Set showPhone to true to display it. */
  phone: '+91 7993951404',
  showPhone: false,
  photo: {
    src: '/images/karthikeya-640.webp',
    srcSet: '/images/karthikeya-480.webp 480w, /images/karthikeya-640.webp 640w',
    width: 640,
    height: 800,
    alt: 'Portrait of Karthikeya Mahenderkar, smiling, wearing a black-and-white checked shirt',
  },
  resumeUrl: '/Karthikeya-Mahenderkar-Resume.pdf',
  resumeFileName: 'Karthikeya-Mahenderkar-Resume.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/karthikeya-mahenderkar',
    github: 'https://github.com/karthikeya-mahenderkar' as string | null,
    leetcode: null as string | null, // TODO: optional
  },
}

export const about = {
  paragraphs: [
    'I study Materials Science & Metallurgical Engineering at IIT Hyderabad (class of 2027), and most of my time goes into software engineering, especially backend systems.',
    'I like problems where the obvious solution breaks in production: two buyers grabbing the last ticket at the same moment, a payment packet relayed through phones that can’t be trusted, a price feed that has to turn into live alerts without missing a breakout.',
    'My approach is to model the failure first. I work out where state can race, duplicate, or be tampered with, then design locking, idempotency, and validation around it. After that I build the interface on top.',
  ],
  focus: [
    { label: 'Interests', value: 'Distributed systems, concurrency, API design, applied cryptography' },
    { label: 'Looking for', value: 'Software engineering roles — backend & full-stack' },
    { label: 'Primary stack', value: 'Java · Spring Boot · PostgreSQL · React · TypeScript' },
  ],
}

export type SkillGroup = {
  title: string
  blurb: string
  icon: 'code' | 'server' | 'layout' | 'database' | 'wrench' | 'sparkles'
  /** Listed in the resume Skills section */
  core: string[]
  /** Used in resume projects, not listed in the Skills section */
  applied?: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    title: 'Programming Languages',
    blurb: 'What I write day to day.',
    icon: 'code',
    core: ['Java', 'Python', 'SQL'],
    applied: ['TypeScript'],
  },
  {
    title: 'Backend Development',
    blurb: 'Services, APIs and security.',
    icon: 'server',
    core: ['Spring Boot', 'Spring Data JPA', 'Hibernate', 'REST APIs'],
    applied: ['Keycloak', 'JWT', 'Server-Sent Events', 'Thymeleaf', 'Zod'],
  },
  {
    title: 'Frontend Development',
    blurb: 'Dashboards and interfaces.',
    icon: 'layout',
    core: ['HTML', 'CSS'],
    applied: ['React', 'Next.js', 'Vite'],
  },
  {
    title: 'Databases',
    blurb: 'Persistence, transactions, locking.',
    icon: 'database',
    core: ['SQL', 'DBMS', 'Prisma'],
    applied: ['PostgreSQL', 'SQLite', 'H2'],
  },
  {
    title: 'Developer Tools',
    blurb: 'Build, version and ship.',
    icon: 'wrench',
    core: ['Git', 'GitHub', 'Maven', 'Jupyter Notebook', 'Claude Code', 'GitHub Copilot', 'Gemini CLI'],
    applied: ['Docker', 'Vitest'],
  },
  {
    title: 'Data & Other',
    blurb: 'Analysis and supporting libraries.',
    icon: 'sparkles',
    core: ['NumPy', 'Pandas', 'Matplotlib'],
    applied: ['ZXing', 'Recharts', 'RSA / AES-GCM'],
  },
]

export const softSkills = ['Leadership', 'Team Management', 'Communication', 'Decision-Making', 'Adaptability']

export type ProjectVisual = 'ticketing' | 'stocks' | 'mesh'

export type Project = {
  id: string
  index: string
  name: string
  tagline: string
  summary: string
  problem: string
  contribution: string
  features: string[]
  stack: string[]
  visual: ProjectVisual
  /** The one hard guarantee the project is built around — shown on the preview */
  guarantee: string
  links: { github: string | null; live: string | null }
}

export const projects: Project[] = [
  {
    id: 'event-ticketing',
    index: '01',
    name: 'Event Ticketing Platform',
    tagline: 'Concurrency-safe full-stack ticketing',
    summary:
      'A full-stack event-ticketing platform built on Spring Boot REST APIs with a layered architecture. It covers event discovery, ticket purchase, QR-ticket retrieval and validation for organizers, staff and attendees.',
    problem:
      'When many buyers hit the same event inventory at once, naive implementations sell more tickets than exist. Gate staff also need a fast, reliable way to verify tickets and reject duplicate entries.',
    contribution:
      'Built the Spring Boot backend by following a published, step-by-step architecture guide, implementing each layer myself: REST endpoints, transactional ticket inventory with pessimistic locking, Keycloak/JWT security and QR validation. Ran it with PostgreSQL and Keycloak in Docker, against the provided React frontend.',
    features: [
      'Overselling prevented under concurrent purchases using PostgreSQL pessimistic locking and transactional inventory updates',
      'Role-based access control with Keycloak, JWT authorization and token-claim-based user provisioning (ORGANIZER / STAFF)',
      'QR-based ticket verification with ZXing, supporting QR and manual validation with duplicate-entry prevention',
      'Works with a React + Vite frontend covering organizer, attendee and staff ticket-check flows',
    ],
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Keycloak', 'JWT', 'ZXing', 'Docker', 'React'],
    visual: 'ticketing',
    guarantee: 'No overselling under concurrency',
    links: { github: 'https://github.com/karthikeya-mahenderkar/event-ticketing-platform', live: null },
  },
  {
    id: 'stock-metrics',
    index: '02',
    name: 'Real-Time Stock Metrics Tracker',
    tagline: 'Live market surveillance and analytics',
    summary:
      'A real-time monitor for Indian (NSE) stocks that ingests, stores and visualizes live and historical market data, flagging 52-week breakouts and volume spikes on an interactive analytics dashboard.',
    problem:
      'Spotting 52-week breakouts and abnormal volume spikes by hand is slow and error-prone. The ingestion pipeline also has to stay testable and independent of any single market-data provider.',
    contribution:
      'Built the ingestion pipeline, rule-based detection engine, provider abstraction, streaming APIs and the analytics dashboard.',
    features: [
      'Background ingestion pipeline with a rule-based engine for 52-week high/low breakouts and abnormal-volume spikes',
      'Crossing-based and once-per-day triggers for automated market surveillance',
      'Pluggable market-data layer (Yahoo Finance for live NSE data, a deterministic mock provider for demos) with Zod validation on every external payload',
      'REST APIs, Server-Sent Events and an event bus streaming live events to KPI, sector, historical and intraday views, backed by 42 Vitest unit tests',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Prisma', 'SQLite', 'SSE', 'Zod', 'Recharts', 'Vitest'],
    visual: 'stocks',
    guarantee: 'Live events streamed via SSE',
    links: { github: 'https://github.com/karthikeya-mahenderkar/stocks-metrics-tracker', live: null },
  },
  {
    id: 'upi-offline-mesh',
    index: '03',
    name: 'UPI Offline Mesh',
    tagline: 'Mesh-routed deferred settlement backend',
    summary:
      'A backend for routing payments through untrusted offline intermediaries over a gossip mesh, with deferred, exactly-once settlement once a device reaches the network.',
    problem:
      'Payments relayed through untrusted offline devices must stay confidential and tamper-evident. When several devices upload the same packet at the same time, the payment must settle only once.',
    contribution:
      'Designed the encryption scheme, idempotent settlement layer, mesh simulator and the observability dashboard.',
    features: [
      'Hybrid encryption with RSA-2048/OAEP + AES-256-GCM, per-packet keys/IVs and SHA-256 hashing to detect tampering before settlement',
      'Duplicate settlement eliminated via ConcurrentHashMap.putIfAbsent idempotency, 24-hour TTL eviction, unique constraints and optimistic locking, verified with a 3-thread integration test',
      'TTL-aware gossip mesh simulator (VirtualDevice, MeshSimulatorService) with scheduled propagation and parallel bridge uploads, with no Bluetooth hardware needed',
      'Transactional debit/credit, balance and PIN validation, immutable records, and a Thymeleaf dashboard for topology, cache and ledger state',
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'Hibernate', 'H2', 'Thymeleaf', 'RSA / AES-GCM'],
    visual: 'mesh',
    guarantee: 'Exactly-once settlement',
    links: { github: 'https://github.com/karthikeya-mahenderkar/mesh-pay', live: null },
  },
]

export type EducationItem = {
  institution: string
  credential: string
  score: string
  year: string
  current?: boolean
}

export const education: EducationItem[] = [
  {
    institution: 'Indian Institute of Technology Hyderabad',
    credential: 'B.Tech — Materials Science & Metallurgical Engineering',
    score: 'CGPA 7.05',
    year: '2023 — 2027',
    current: true,
  },
  {
    institution: 'Narayana Junior College',
    credential: 'Class XII — TSBIE',
    score: '96.20%',
    year: '2022',
  },
  {
    institution: 'Jaya High School',
    credential: 'Class X — TSBSE',
    score: 'GPA 10.0',
    year: '2020',
  },
]

export const extracurricular = [
  'Active participant in Carrom and Billiards at the Milan and Diesta events',
  'Volunteered at Prayas events and the 13th Convocation of IIT Hyderabad',
]

export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
] as const
