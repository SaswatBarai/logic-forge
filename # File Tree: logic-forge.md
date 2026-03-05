# File Tree: logic-forge
```

├── 📁 apps
│   ├── 📁 anti-cheat
│   │   ├── 📁 src
│   │   │   ├── 📁 config
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 handlers
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 models
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 routes
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 scoring
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 storage
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 websocket
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   └── 📄 index.ts
│   │   ├── 📁 tests
│   │   │   └── ⚙️ .gitkeep
│   │   ├── 🐳 Dockerfile
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 code-runner
│   │   ├── 📁 api
│   │   │   ├── ⚙️ .gitkeep
│   │   │   └── 🐹 execute.go
│   │   ├── 📁 cmd
│   │   │   └── 📁 server
│   │   │       ├── ⚙️ .gitkeep
│   │   │       └── 🐹 main.go
│   │   ├── 📁 executor
│   │   │   ├── ⚙️ .gitkeep
│   │   │   └── 🐹 pipeline.go
│   │   ├── 📁 internal
│   │   │   └── ⚙️ .gitkeep
│   │   ├── 📁 languages
│   │   │   ├── 📁 limits
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 🐹 cpp.go
│   │   │   ├── 🐹 java.go
│   │   │   ├── 🐹 python.go
│   │   │   └── 🐹 strategy.go
│   │   ├── 📁 sandbox
│   │   │   ├── ⚙️ .gitkeep
│   │   │   └── 🐹 runner.go
│   │   ├── 🐳 Dockerfile
│   │   ├── 📄 Makefile
│   │   ├── 📄 go.mod
│   │   └── 📄 go.sum
│   ├── 📁 game-api
│   │   ├── 📁 src
│   │   │   ├── 📁 config
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 handlers
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 middleware
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 models
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 routes
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   └── 📄 session.routes.ts
│   │   │   ├── 📁 services
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 matchmaker.service.ts
│   │   │   │   ├── 📄 round.service.ts
│   │   │   │   └── 📄 session.service.ts
│   │   │   ├── 📁 websocket
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 socket.handler.ts
│   │   │   │   └── 📄 socket.manager.ts
│   │   │   ├── 📄 app.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 tests
│   │   │   └── ⚙️ .gitkeep
│   │   ├── 🐳 Dockerfile
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 question-engine
│   │   ├── 📁 data
│   │   │   └── 📁 challenges
│   │   │       ├── ⚙️ bottleneck-breaker.json
│   │   │       ├── ⚙️ missing-link.json
│   │   │       ├── ⚙️ state-tracing.json
│   │   │       └── ⚙️ syntax-error.json
│   │   ├── 📁 src
│   │   │   ├── 📁 config
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 data
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 handlers
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 challenge.handler.ts
│   │   │   │   └── 📄 seed.handler.ts
│   │   │   ├── 📁 middleware
│   │   │   │   └── 📄 error.middleware.ts
│   │   │   ├── 📁 models
│   │   │   │   └── ⚙️ .gitkeep
│   │   │   ├── 📁 randomizer
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 semantic.randomizer.ts
│   │   │   │   └── 📄 token-maps.ts
│   │   │   ├── 📁 routes
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 challenge.routes.ts
│   │   │   │   ├── 📄 health.routes.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 services
│   │   │   │   ├── ⚙️ .gitkeep
│   │   │   │   ├── 📄 challenge.service.ts
│   │   │   │   └── 📄 seed.service.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 tests
│   │   │   └── ⚙️ .gitkeep
│   │   ├── 🐳 Dockerfile
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   └── 📁 web
│       ├── 📁 app
│       │   ├── 📁 (auth)
│       │   │   ├── 📁 forgot-password
│       │   │   │   └── ⚙️ .gitkeep
│       │   │   ├── 📁 login
│       │   │   │   └── 📄 page.tsx
│       │   │   └── 📁 register
│       │   │       └── 📄 page.tsx
│       │   ├── 📁 (game)
│       │   │   ├── 📁 arcade
│       │   │   │   └── 📄 page.tsx
│       │   │   ├── 📁 lobby
│       │   │   │   ├── ⚙️ .gitkeep
│       │   │   │   └── 📄 page.tsx
│       │   │   ├── 📁 results
│       │   │   │   ├── ⚙️ .gitkeep
│       │   │   │   ├── 📄 page.tsx
│       │   │   │   └── 📄 results-screen.tsx
│       │   │   ├── 📁 session
│       │   │   │   └── ⚙️ .gitkeep
│       │   │   └── 📁 story
│       │   │       └── 📄 page.tsx
│       │   ├── 📁 api
│       │   │   ├── 📁 auth
│       │   │   │   ├── 📁 [...nextauth]
│       │   │   │   │   └── 📄 route.ts
│       │   │   │   └── 📁 login
│       │   │   │       └── 📄 route.ts
│       │   │   ├── 📁 profile
│       │   │   │   └── 📄 route.ts
│       │   │   └── 📁 story
│       │   │       └── 📁 chat
│       │   │           └── 📄 route.ts
│       │   ├── 📁 arena
│       │   ├── 📁 dashboard
│       │   │   ├── ⚙️ .gitkeep
│       │   │   └── 📄 page.tsx
│       │   ├── 📁 settings
│       │   │   └── 📄 page.tsx
│       │   ├── 🎨 globals.css
│       │   ├── 📄 layout.tsx
│       │   ├── 📄 not-found.tsx
│       │   └── 📄 page.tsx
│       ├── 📁 components
│       │   ├── 📁 canvas
│       │   │   └── ⚙️ .gitkeep
│       │   ├── 📁 dashboard
│       │   │   └── ⚙️ .gitkeep
│       │   ├── 📁 game
│       │   │   ├── ⚙️ .gitkeep
│       │   │   ├── 📄 arena.tsx
│       │   │   ├── 📄 code-editor.tsx
│       │   │   ├── 📄 lobby.tsx
│       │   │   ├── 📄 mcq-selector.tsx
│       │   │   ├── 📄 prompt-canvas.tsx
│       │   │   ├── 📄 results-screen.tsx
│       │   │   ├── 📄 round-result-overlay.tsx
│       │   │   └── 📄 timer-bar.tsx
│       │   ├── 📁 story
│       │   │   ├── 📄 story-hud.tsx
│       │   │   ├── 📄 story-narrator.tsx
│       │   │   └── 📄 zone-selector.tsx
│       │   ├── 📁 ui
│       │   │   ├── ⚙️ .gitkeep
│       │   │   ├── 📄 accordion.tsx
│       │   │   ├── 📄 alert-dialog.tsx
│       │   │   ├── 📄 aspect-ratio.tsx
│       │   │   ├── 📄 avatar.tsx
│       │   │   ├── 📄 badge.tsx
│       │   │   ├── 📄 button.tsx
│       │   │   ├── 📄 card.tsx
│       │   │   ├── 📄 checkbox.tsx
│       │   │   ├── 📄 collapsible.tsx
│       │   │   ├── 📄 dialog.tsx
│       │   │   ├── 📄 drawer.tsx
│       │   │   ├── 📄 dropdown-menu.tsx
│       │   │   ├── 📄 index.ts
│       │   │   ├── 📄 input.tsx
│       │   │   ├── 📄 label.tsx
│       │   │   ├── 📄 popover.tsx
│       │   │   ├── 📄 progress.tsx
│       │   │   ├── 📄 resizable.tsx
│       │   │   ├── 📄 scroll-area.tsx
│       │   │   ├── 📄 select.tsx
│       │   │   ├── 📄 separator.tsx
│       │   │   ├── 📄 sheet.tsx
│       │   │   ├── 📄 skeleton.tsx
│       │   │   ├── 📄 slider.tsx
│       │   │   ├── 📄 sonner.tsx
│       │   │   ├── 📄 switch.tsx
│       │   │   ├── 📄 tabs.tsx
│       │   │   ├── 📄 textarea.tsx
│       │   │   ├── 📄 toast.tsx
│       │   │   ├── 📄 toaster.tsx
│       │   │   └── 📄 tooltip.tsx
│       │   ├── 📄 AntiCheatSection.tsx
│       │   ├── 📄 CTASection.tsx
│       │   ├── 📄 CategoriesSection.tsx
│       │   ├── 📄 Footer.tsx
│       │   ├── 📄 Hero3D.tsx
│       │   ├── 📄 HeroSection.tsx
│       │   ├── 📄 HowItWorksSection.tsx
│       │   ├── 📄 MarqueeTicker.tsx
│       │   ├── 📄 MissionsSection.tsx
│       │   ├── 📄 NavLink.tsx
│       │   ├── 📄 Navbar.tsx
│       │   ├── 📄 Provider.tsx
│       │   ├── 📄 ScrollReveal.tsx
│       │   └── 📄 StatsSection.tsx
│       ├── 📁 hooks
│       │   ├── ⚙️ .gitkeep
│       │   ├── 📄 use-game-engine.ts
│       │   ├── 📄 use-mobile.tsx
│       │   └── 📄 use-toast.ts
│       ├── 📁 lib
│       │   ├── ⚙️ .gitkeep
│       │   ├── 📄 story-data.ts
│       │   └── 📄 utils.ts
│       ├── 📁 public
│       │   ├── 📁 music
│       │   │   ├── 📝 README.md
│       │   │   └── 🎵 Street Fighter II OST Ryu Theme.mp3
│       │   └── ⚙️ .gitkeep
│       ├── 📁 store
│       │   ├── 📄 game-store.ts
│       │   └── 📄 story-store.ts
│       ├── 📁 styles
│       │   └── ⚙️ .gitkeep
│       ├── 📁 workers
│       │   └── ⚙️ .gitkeep
│       ├── 🐳 Dockerfile
│       ├── 📄 auth.ts
│       ├── ⚙️ components.json
│       ├── 🎨 global.css
│       ├── 📄 next-env.d.ts
│       ├── 📄 next.config.mjs
│       ├── ⚙️ package.json
│       ├── 📄 postcss.config.mjs
│       └── ⚙️ tsconfig.json
├── 📁 docs
│   ├── 📕 LogicForge_PRD.pdf
│   ├── 📕 LogicForge_TechDoc.pdf
│   └── 📝 MONGO_AUTH_FIX.md
├── 📁 packages
│   ├── 📁 auth
│   │   ├── ⚙️ .gitkeep
│   │   └── ⚙️ package.json
│   ├── 📁 config
│   │   ├── 📁 src
│   │   │   └── 📄 index.ts
│   │   ├── ⚙️ .gitkeep
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 db
│   │   ├── 📁 prisma
│   │   │   ├── 📁 migrations
│   │   │   │   ├── 📁 20260301181212_add_challenge_title_language_category_unique
│   │   │   │   │   └── 📄 migration.sql
│   │   │   │   └── ⚙️ migration_lock.toml
│   │   │   ├── 📁 seeds
│   │   │   │   └── 📁 challenges
│   │   │   │       ├── ⚙️ bottleneck-breaker.json
│   │   │   │       ├── ⚙️ missing-link.json
│   │   │   │       ├── ⚙️ state-tracing.json
│   │   │   │       └── ⚙️ syntax-error.json
│   │   │   ├── 📄 schema.prisma
│   │   │   └── 📄 seed.ts
│   │   ├── 📁 src
│   │   │   ├── 📄 index.ts
│   │   │   └── 📄 mongoose-auth.ts
│   │   ├── ⚙️ .gitkeep
│   │   ├── ⚙️ package.json
│   │   ├── 📄 prisma.config.ts
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 eslint-config
│   │   ├── ⚙️ .gitkeep
│   │   ├── 📄 index.js
│   │   └── ⚙️ package.json
│   ├── 📁 logger
│   │   ├── 📁 src
│   │   │   └── 📄 index.ts
│   │   ├── ⚙️ .gitkeep
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 tsconfig
│   │   ├── ⚙️ .gitkeep
│   │   ├── ⚙️ base.json
│   │   ├── ⚙️ nextjs.json
│   │   ├── ⚙️ node.json
│   │   └── ⚙️ package.json
│   └── 📁 types
│       ├── 📁 src
│       │   ├── 📄 anti-cheat.ts
│       │   ├── 📄 api-responses.ts
│       │   ├── 📄 challenge.ts
│       │   ├── 📄 index.ts
│       │   ├── 📄 session.ts
│       │   ├── 📄 story.ts
│       │   ├── 📄 submission.ts
│       │   └── 📄 websocket.ts
│       ├── ⚙️ .gitkeep
│       ├── ⚙️ package.json
│       └── ⚙️ tsconfig.json
├── ⚙️ .gitignore
├── 📄 LICENSE
├── 📄 Makefile
├── 📝 PHASE_PLANNER.md
├── 📝 README.md
├── 📝 Stroymode.md
├── 📄 build-log.txt
├── ⚙️ docker-compose.prod.yml
├── ⚙️ docker-compose.yml
├── ⚙️ package.json
├── ⚙️ pnpm-lock.yaml
├── ⚙️ pnpm-workspace.yaml
├── 📄 test.txt
└── ⚙️ turbo.json
```

---
*Generated by FileTree Pro Extension*