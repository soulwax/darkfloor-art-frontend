# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**darkfloor.art** (npm package: `songbird-player`) - A modern music streaming and discovery platform built with Next.js 15, TypeScript, and TailwindCSS v4. Features include audio playback with equalizer, smart recommendations, visual audio patterns, and a Spotify-like mobile experience.

**Tech Stack:**
- Next.js ^15.5.9 (App Router, Turbopack, standalone mode)
- TypeScript (strict mode, noUncheckedIndexedAccess, checkJs enabled)
- TailwindCSS v4 with CSS variables
- tRPC for type-safe API calls
- Framer Motion for animations
- NextAuth v5 (Discord OAuth)
- Drizzle ORM + PostgreSQL (Neon serverless)
- Electron for desktop builds
- Chalk for enhanced logging

## Common Commands

### Development
```bash
npm run dev              # Start Next.js dev server (uses PORT from .env) + custom logging
npm run dev:next         # Start Next.js only (Turbo mode, uses PORT from .env)
npm run typecheck        # TypeScript validation (strict)
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format:write     # Format with Prettier
```

### Database
```bash
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes directly
npm run db:studio        # Open Drizzle Studio (GUI)
```

### Production (PM2)
```bash
npm run build            # Clean build (.next removed first)
npm run start            # Production server via custom script
npm run pm2:start        # Start prod + dev instances
npm run pm2:dev          # Start dev instance only
npm run pm2:reload       # Zero-downtime reload
npm run pm2:logs         # View production logs
npm run pm2:logs:dev     # View dev logs
npm run deploy           # Build + reload production
```

### Electron Desktop App
```bash
npm run electron:dev           # Dev mode (concurrently Next.js + Electron)
npm run electron:build:win     # Build Windows installer
npm run electron:build:mac     # Build macOS .dmg
npm run electron:build:linux   # Build AppImage + .deb
```

## Architecture

### File Structure

```
src/
├── app/                    # Next.js App Router (pages & layouts)
│   ├── layout.tsx          # Root layout (providers, mobile/desktop headers)
│   ├── page.tsx            # Home page (search, recent tracks)
│   ├── _components/        # App-specific components (not for reuse)
│   ├── api/                # API routes (health check, etc.)
│   ├── library/            # User library page
│   ├── playlists/          # Playlists management
│   ├── license/            # License page
│   └── [userhash]/         # User profile pages (dynamic route)
├── components/             # React components
│   ├── MobileHeader.tsx    # Persistent top header (mobile only)
│   ├── HamburgerMenu.tsx   # Slide-out navigation drawer (mobile)
│   ├── MobilePlayer.tsx    # Full-screen mobile player
│   ├── MiniPlayer.tsx      # Bottom mini player bar
│   ├── PersistentPlayer.tsx # Player routing (desktop vs mobile)
│   ├── Equalizer.tsx       # Web Audio API equalizer (10-band)
│   ├── PatternControls.tsx # Visual pattern configurator (62+ patterns)
│   └── visualizers/        # Audio-reactive canvas visualizations
├── contexts/               # React Context providers
│   ├── AudioPlayerContext.tsx  # Global player state & queue management
│   ├── MenuContext.tsx     # Mobile hamburger menu state
│   └── ToastContext.tsx    # Toast notifications
├── hooks/                  # Custom React hooks
│   ├── useAudioPlayer.ts   # HTML5 Audio API wrapper
│   ├── useMediaQuery.ts    # Responsive breakpoints
│   └── useEqualizer.ts     # Web Audio context initialization
├── server/                 # Server-side code (tRPC, auth, DB)
│   ├── api/
│   │   ├── trpc.ts         # tRPC context & middleware
│   │   ├── root.ts         # tRPC app router
│   │   └── routers/        # tRPC route handlers
│   │       ├── music.ts    # Music search, playlists, recommendations
│   │       ├── equalizer.ts # Equalizer preset persistence
│   │       └── preferences.ts # User preferences
│   ├── auth/               # NextAuth configuration
│   ├── db/                 # Drizzle ORM setup & schema
│   └── services/           # Business logic (recommendations, etc.)
├── trpc/                   # tRPC client setup
│   ├── react.tsx           # React hooks for tRPC
│   └── server.ts           # Server-side tRPC caller
├── lib/                    # Third-party library configurations
├── services/               # External service integrations
├── config/                 # App configuration constants
├── constants/              # Global constants
├── utils/                  # Utility functions
│   ├── api.ts              # API client for external music service
│   ├── haptics.ts          # Mobile haptic feedback helpers
│   └── spring-animations.ts # Framer Motion presets
├── types/                  # TypeScript type definitions
│   └── index.ts            # Track, Album, Artist, SearchResponse
├── styles/
│   └── globals.css         # TailwindCSS + CSS variables (colors, animations)
├── env.js                  # Environment variable validation (Zod)
└── global.d.ts             # Global TypeScript declarations

scripts/                    # Build and deployment scripts
electron/                   # Electron desktop app files
drizzle/                    # Database migrations (auto-generated)

electron/
├── main.cjs               # Electron main process (CommonJS)
├── preload.cjs            # Secure renderer bridge
└── types.d.ts             # Electron API types

drizzle/
└── *.sql                  # Database migrations (auto-generated)
```

### Key Architectural Patterns

#### 1. Mobile-First Responsive Design (Spotify-Style)

**Mobile (<768px):**
- `MobileHeader` - Persistent top header with hamburger menu + search bar
- `HamburgerMenu` - Left-sliding drawer (280px) with navigation items
- `MiniPlayer` - Bottom-stuck player bar (64×64 album art)
- `MobilePlayer` - Full-screen modal with gesture controls (swipe to seek, drag to close)
- Content padding: `pt-16 pb-24` (accounts for header + player)

**Desktop (≥768px):**
- `Header` - Top navigation with logo + user menu
- `MaturePlayer` - Desktop player at bottom
- Content padding: `pb-24`

**Z-Index Hierarchy:**
- Content: 1-29
- MobileHeader, MiniPlayer: 50
- HamburgerMenu (backdrop + drawer): 60-61
- Full MobilePlayer modal: 98-99

#### 2. Audio Player Architecture

**Global State:** `AudioPlayerContext` provides centralized player state across all components.

**Key Features:**
- Queue management (add, reorder, play next, remove)
- Shuffle & repeat modes (none, one, all)
- Playback rate control (1x - 2x)
- Smart queue (auto-add similar tracks)
- History tracking (authenticated users)

**Audio Chain:**
```
Track → getStreamUrlById() → HTMLAudioElement → Web Audio API → Equalizer → Speakers
                                      ↓
                              Visualizer (canvas)
```

**User Interaction Requirement:** Web Audio Context initialization requires a user gesture (click/tap). See `useEqualizer.ts` - the equalizer initializes on first interaction.

#### 3. tRPC API Layer

**Server-side routers:**
- `music` - Search tracks, albums, artists; manage playlists; recommendations
- `equalizer` - Save/load equalizer presets (authenticated)
- `preferences` - User settings & smart queue configuration

**Client-side usage:**
```tsx
import { api } from "@/trpc/react";

// In component:
const { data: tracks } = api.music.searchTracks.useQuery({ query: "jazz" });
const addToHistory = api.music.addToHistory.useMutation();
```

**Type safety:** All request/response types are auto-inferred from server route definitions.

#### 4. Visual Pattern System

**FlowFieldRenderer** (`src/components/visualizers/FlowFieldRenderer.ts`):
- 80+ procedurally-generated audio-reactive patterns
- Configurable parameters (particle count, size, speed, colors)
- Pattern-specific controls via `PatternControls.tsx`
- Frequency band analysis drives visual effects
- 11,000+ lines of highly optimized Canvas2D rendering

**LightweightParticleBackground**:
- Minimal performance footprint
- Used as fallback when main visualizer is disabled
- Simple particle system for ambient visuals

**Pattern Categories:**
- Sacred geometry (Flower of Life, Metatron's Cube, Mandala)
- Occult symbols (Tarot, Pentagram, Sigils, Runes)
- Natural phenomena (Vortex, Phoenix, Dragon)
- Abstract (Fractal, Flow Field, Particles, Waves)

## Mobile UI Implementation Details

### Navigation Flow (Post-Spotify Redesign)

**Old:** Bottom tab navigation (5 tabs) + FAB with quick actions
**New:** Top hamburger menu + persistent search bar

**HamburgerMenu Items:**
- Home (always visible)
- Library (auth-required)
- Playlists (auth-required)
- Profile / Sign In (dynamic based on auth state)
- Settings (auth-required)
- About, License (always visible)
- Sign Out (auth-required)

**State Management:** `MenuContext` provides `isMenuOpen`, `openMenu()`, `closeMenu()`, `toggleMenu()` across components.

### Player Enhancements

**MiniPlayer improvements:**
- Album art: 48×48 → 64×64 (with accent ring)
- Enhanced shadow: `shadow-[0_-16px_48px_rgba(5,10,18,0.8)]`
- Stronger backdrop blur: `backdrop-blur-2xl`
- More padding: `px-5 py-4` (was `px-4 py-3`)

**MobilePlayer improvements:**
- Max artwork width: 320px → 360px (450×450 image)
- Subtle glow effect behind artwork
- Gesture controls: swipe left/right (±30s), drag down to close
- Future-ready sub-menu placeholder (commented out) for Lyrics/Artist/Credits tabs

### Animation & Haptics

**Framer Motion Presets** (`spring-animations.ts`):
- `snappy` - Quick, responsive (buttons)
- `gentle` - Smooth, easing (modals)
- `bouncy` - Playful, elastic
- `smooth` - Fluid, natural

**Haptic Feedback** (`haptics.ts`):
- `hapticLight()` - Subtle interactions (navigation)
- `hapticMedium()` - Important actions (play/pause)
- `hapticSuccess()` - Positive outcomes (shuffle enabled)
- `hapticError()` - Errors (voice search failure)

**Usage:**
```tsx
import { hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";

<motion.button
  onClick={() => {
    hapticMedium();
    togglePlay();
  }}
  whileTap={{ scale: 0.9 }}
  transition={springPresets.snappy}
>
```

## Environment Variables

**Required variables** (defined in `src/env.js`):
```bash
# Authentication (NextAuth v5)
AUTH_SECRET=                    # Generate: openssl rand -base64 32
AUTH_DISCORD_ID=                # Discord OAuth App ID
AUTH_DISCORD_SECRET=            # Discord OAuth Secret
NEXTAUTH_URL=http://localhost:3222

# Database
DATABASE_URL=postgresql://...   # PostgreSQL connection string

# External Music API
API_URL=https://api.example.com # Backend music service (deprecated - use NEXT_PUBLIC_API_URL)
NEXT_PUBLIC_API_URL=            # Backend music service (required)
STREAMING_KEY=                  # API authentication key (required)
```

**Optional:**
```bash
NEXT_PUBLIC_SONGBIRD_API_URL=   # Songbird API for recommendations (optional)
SONGBIRD_API_KEY=               # Songbird API authentication (optional)
ELECTRON_BUILD=true             # Set during Electron builds
DB_SSL_CA=                      # PostgreSQL SSL CA certificate path (PEM format)
```

## Development Conventions

### TypeScript
- Strict mode enabled (`noUncheckedIndexedAccess`, `strict`)
- All types defined in `src/types/index.ts` or co-located `*.types.ts` files
- Avoid `any` - use `unknown` and type narrowing
- Path alias: `@/*` maps to `src/*`

### Styling
- TailwindCSS v4 utility-first classes
- CSS variables for theming (defined in `globals.css`):
  - `--color-text`: Off-white (#f5f1e8)
  - `--color-subtext`: Light gray (#a5afbf)
  - `--color-accent`: Orange (#f4b266)
  - `--color-secondary-accent`: Teal (#58c6b1)
  - `--color-background`: Dark (#0b1118)
- Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (≥1024px)
- Safe area insets: `.safe-top`, `.safe-bottom`, `.safe-left` for notched devices

### Component Patterns
- Client components: Mark with `"use client"` directive
- Server components: Default in App Router
- Conditional mobile/desktop rendering: Use `useIsMobile()` hook
- Animations: Always use Framer Motion with predefined `springPresets`
- Forms: Controlled components with React state
- Modals/Drawers: Use `AnimatePresence` for enter/exit animations

### Audio Handling
- **HTML5 Audio API:** Primary playback (`<audio>` element)
- **Web Audio API:** Equalizer & advanced effects only
- **Initialization:** Audio context requires user gesture - wrap in event handler
- **Stream URLs:** Fetched via `getStreamUrlById()` from external API
- **Equalizer:** 10-band (31Hz - 16kHz), presets saved to DB (authenticated users)

## Database Schema (Drizzle ORM)

**Key tables:**
- `users` - User accounts (NextAuth)
- `sessions` - Active sessions (NextAuth)
- `playlists` - User-created playlists
- `playlist_tracks` - Playlist → Track mapping
- `listening_history` - Play history (authenticated users)
- `equalizer_presets` - Saved equalizer configurations
- `user_preferences` - Smart queue settings, UI preferences

**Migrations:** Auto-generated in `drizzle/` directory. Run `npm run db:push` to apply changes directly, or `npm run db:generate` then `npm run db:migrate` for versioned migrations.

## Electron Desktop App

**Architecture:**
- `electron/main.cjs` - Main process (CommonJS to avoid ES module conflicts)
- `electron/preload.cjs` - Secure IPC bridge (context isolation enabled)
- Next.js runs in standalone mode (bundled server + client)

**Build process:**
1. `ELECTRON_BUILD=true next build` - Creates standalone Next.js bundle
2. `electron-builder` - Packages `.next/standalone` into native app

**Security:**
- `contextIsolation: true` - Prevents direct Node.js access from renderer
- `sandbox: true` - Additional security layer
- Preload script exposes only safe APIs via `window.electron`

**Platform-specific builds:** Use dedicated scripts for each OS (Windows requires code signing setup in `electron/sign.js`).

## API Integration (External Music Service)

**Client:** `src/utils/api.ts` - Centralized API client for external music service.

**Key functions:**
- `searchTracks(query)` - Search for tracks
- `searchAlbums(query)` - Search for albums
- `searchArtists(query)` - Search for artists
- `getAlbumById(id)` - Get album details + tracks
- `getArtistTopTracks(id)` - Artist's popular tracks
- `getStreamUrlById(id)` - Get playback URL for track

**Response types:** Defined in `src/types/index.ts` (Track, Album, Artist, SearchResponse).

**Authentication:** Uses `STREAMING_KEY` from environment variables.

## Common Gotchas

1. **Audio Context initialization:** Must happen after user interaction. Don't initialize in `useEffect` on mount.

2. **Environment variables:** Changes to `src/env.js` schema require server restart. Browser needs refresh for `NEXT_PUBLIC_*` vars.

3. **tRPC query invalidation:** After mutations, invalidate queries manually:
   ```tsx
   const utils = api.useUtils();
   await utils.music.getPlaylists.invalidate();
   ```

4. **Mobile header spacing:** Content needs `pt-16 pb-24` on mobile to account for header + player. Desktop uses `md:pt-0 md:pb-24`.

5. **TypeScript strict indexing:** Arrays and objects may be `undefined`. Always check:
   ```tsx
   const track = tracks[0];
   if (track) { }
   ```

6. **Electron builds:** Don't use `npm run build` - use `npm run electron:build:*` scripts which set `ELECTRON_BUILD=true` and handle packaging.

7. **Z-index conflicts:** Follow documented hierarchy. Mobile header/player use z-50, menu uses z-60-61, modals use z-98-99.

8. **Source code comments:** All comments have been removed from source files for a cleaner, more lightweight codebase. Documentation lives in CLAUDE.md, README.md, and commit messages.

## Testing & Quality

- **TypeScript:** `npm run typecheck` - Zero errors required
- **Linting:** `npm run lint` - Follow existing ESLint rules
- **Formatting:** `npm run format:write` - Prettier with Tailwind plugin
- **Manual testing:** Test responsive breakpoints, audio playback, and mobile gestures

## Performance & Security Optimizations

### Production Build Optimizations

**Next.js Configuration ([next.config.js](next.config.js)):**
- `swcMinify: true` - Fast Rust-based minification
- `compress: true` - Gzip compression enabled
- `productionBrowserSourceMaps: false` - Smaller bundle size
- `removeConsole` - Remove console.log in production (keeps error/warn)
- Aggressive code splitting with custom webpack optimization
- Module IDs: deterministic for better caching
- Advanced split chunks configuration for framework, libraries, and shared code

**Image Optimization:**
- AVIF and WebP format support
- Optimized device sizes and image sizes
- Minimum cache TTL: 60 seconds
- Lazy loading for all images

**Package Optimization:**
- Tree-shaking for lucide-react, framer-motion, @tanstack/react-query, @trpc/*
- Webpack build worker enabled for faster builds
- CSS optimization enabled

### Security Headers

**Comprehensive HTTP Security Headers:**
- `Strict-Transport-Security` - Force HTTPS with HSTS preload
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection` - Enable XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Permissions-Policy` - Disable camera, microphone, geolocation
- `Content-Security-Policy` - Comprehensive CSP with nonce-based script execution

**Caching Strategy:**
- API routes: `no-store, max-age=0` (always fresh)
- Static assets: `public, max-age=31536000, immutable` (1 year cache)

### Rate Limiting & API Security

**Middleware Protection ([src/middleware.ts](src/middleware.ts)):**
- Rate limiting: 100 requests per 60 seconds per IP
- Automatic IP detection from X-Forwarded-For header
- Returns 429 status with Retry-After header when exceeded
- Memory-efficient rate limit tracking with automatic cleanup
- CSP headers for all non-API routes
- Additional security headers for API routes

### Progressive Web App (PWA)

**Service Worker ([public/sw.js](public/sw.js)):**
- Offline support with intelligent caching strategy
- Static asset caching for instant loads
- Dynamic content caching (max 50 items)
- Cache-first strategy for static resources
- Network-first strategy for API calls
- Graceful offline fallbacks

**Web App Manifest ([public/manifest.json](public/manifest.json)):**
- Installable as standalone app
- Custom app icons (192x192, 512x512)
- Theme color and background color
- App shortcuts for quick actions (Search, Library)
- Proper categorization for app stores

**Apple Web App Support:**
- `apple-web-app-capable: true`
- Status bar styling for iOS
- Custom title for home screen

### Database Performance

**Indexed Columns:**
- User queries: `userId` indexes on all user-related tables
- Search optimization: `query` index on search_history
- Time-based queries: `createdAt`, `playedAt`, `searchedAt` indexes
- Composite indexes for common query patterns:
  - `favorite_user_track_idx` (userId, trackId)
  - `history_user_played_idx` (userId, playedAt)
  - `playlist_track_position_idx` (playlistId, position)

**Query Optimization:**
- Unique constraints to prevent duplicates
- Cascade deletions for data integrity
- JSONB for flexible track data storage
- Efficient joins with proper foreign keys

### Performance Monitoring

**Utilities ([src/utils/performance.ts](src/utils/performance.ts)):**
- `measurePerformance()` - Sync function performance tracking
- `measureAsyncPerformance()` - Async function performance tracking
- `reportWebVitals()` - Core Web Vitals monitoring
- `getMemoryUsage()` - JavaScript heap usage tracking
- Development-only logging (removed in production)

**Usage Example:**
```tsx
import { measureAsyncPerformance } from "@/utils/performance";

const data = await measureAsyncPerformance("fetchTracks", async () => {
  return await api.music.searchTracks.query({ query: "jazz" });
});
```

### Bundle Optimization

**Code Splitting:**
- Route-based automatic code splitting
- Dynamic imports for heavy components (Equalizer, Queue, MobilePlayer)
- Lazy loading for visualizers
- Framework chunks separated from application code
- Large libraries (>160KB) split into separate chunks

**Tree Shaking:**
- ES modules for all code
- No unused exports
- Minimal barrel exports
- Direct imports where possible

### Security Best Practices

**Input Validation:**
- Zod schemas for all environment variables
- tRPC input validation on all endpoints
- SQL injection prevention via Drizzle ORM parameterized queries

**Authentication Security:**
- NextAuth v5 with secure session management
- HTTP-only cookies for session tokens
- CSRF protection built-in
- Secure password hashing (handled by OAuth providers)

**API Security:**
- Rate limiting on all API routes
- Request size limits (2MB max for server actions)
- No API key exposure (server-side only)
- Proper CORS configuration

### Performance Checklist

Before deploying:
- ✅ Run `npm run build` and check bundle size
- ✅ Test Lighthouse score (aim for 90+ on all metrics)
- ✅ Verify service worker registration in production
- ✅ Check Network tab for proper caching headers
- ✅ Test rate limiting with rapid requests
- ✅ Verify CSP headers don't block legitimate resources
- ✅ Test PWA installation on mobile devices

## Server Architecture (Custom Server Script)

The application uses a **custom Node.js server wrapper** (`scripts/server.js`) that provides enhanced logging, build validation, and startup configuration:

**Key Features:**
- **Chalk-based logging**: Colorized, timestamped logs with icons (ℹ, ✓, ⚠, ✗)
- **Automatic build validation**: Checks for `.next/BUILD_ID` before starting production server
- **Auto-recovery**: Automatically runs `npm run build` if production build is missing
- **Environment priority**: `.env.local` > `.env.production` > `.env` (production), or `.env.development` only (dev)
- **System monitoring**: Memory usage tracking, network interface detection
- **Graceful shutdown**: Handles SIGTERM, SIGINT, SIGUSR2 with proper cleanup
- **PM2 integration**: Sends 'ready' signal to PM2 when server is up

**Environment Loading Behavior:**
```js
// Development: ONLY loads .env.development
// Production: Loads in priority order (first wins):
//   1. .env.local (highest priority)
//   2. .env.production
//   3. .env (lowest priority)
```

**Build Validation:**
- Production mode requires valid `.next/BUILD_ID` file
- Missing build triggers automatic `npm run build`
- Prevents crash loops by exiting cleanly if build fails
- Pre-start hook (`scripts/ensure-build.js`) also validates before PM2 starts

## Helper Scripts

The `scripts/` directory contains utility scripts for various tasks:

- **server.js** - Custom Next.js server wrapper with enhanced logging (main entry point)
- **ensure-build.js** - PM2 pre-start hook to validate/create production build
- **load-env-build.js** - Environment variable loader for Electron builds
- **generate-ssl-cert.js** - SSL certificate generation for HTTPS development
- **download-node.js** - Downloads Node.js binaries for Electron packaging
- **check-users.ts** - Database utility to check user accounts
- **populate-userhash.ts** - Populate user hash fields in database
- **set-profile-public.ts** - Set user profile visibility
- **mark-migrations-simple.js** - Mark migrations as applied (simple version)
- **mark-migrations-applied.ts** - Mark migrations as applied in database
- **migrate-to-neon.ts** - Migration script for Neon database
- **db-sync.cjs / db-sync.sh** - Database synchronization utilities
- **reset-queue-state.js** - Reset user queue state
- **copydb/** - Database migration/copy utilities

## Deployment (PM2)

**Configuration:** `ecosystem.config.cjs` defines two apps:
- `songbird-frontend-prod` - Production (uses PORT from .env, default: 3222)
- `songbird-frontend-dev` - Development (uses PORT from .env, default: 3222)

**Important:** Process names are `songbird-frontend-prod` and `songbird-frontend-dev` (not `songbird-player-*` or `darkfloor-art-*`). The package name "songbird-player" is only used in npm/package.json, and the website is "darkfloor.art", but PM2 uses the "songbird-frontend" naming.

**Workflow:**
1. Make changes
2. `npm run deploy` - Builds + reloads production (zero downtime)
3. Check logs: `npm run pm2:logs`

**Environment files:** PM2 loads `.env.production` for prod instance, `.env.local` for dev.

**Pre-start Hook:** `scripts/ensure-build.js` runs before PM2 starts the process, ensuring build exists.
