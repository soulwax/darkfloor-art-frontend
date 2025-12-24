# Changelog

All notable changes to darkfloor.art will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.6.7] - 2025-12-24

### Added

#### WebGL Migration Planning

- **ROADMAP.md**: Created comprehensive roadmap for migrating visualization system from Canvas2D to WebGL
  - **Executive Summary**: Timeline, benefits, and architectural overview
  - **7-Phase Implementation Plan**: Week-by-week breakdown (20-week timeline)
    - Phase 0: Foundation & Research (Weeks 1-2)
    - Phase 1: Core Infrastructure (Weeks 3-5)
    - Phase 2: Pattern Migration (Weeks 6-12) - Converting 80+ patterns in batches
    - Phase 3: Post-Processing Pipeline (Weeks 11-12)
    - Phase 4: Transition System (Weeks 13-14)
    - Phase 5: Integration & Testing (Weeks 15-16)
    - Phase 6: Polish & Optimization (Weeks 17-18)
    - Phase 7: Launch & Monitoring (Weeks 19-20)
  - **Technical Architecture**: Proposed code structure with shader system
  - **Risk Mitigation**: Comprehensive risk assessment and mitigation strategies
  - **Success Metrics**: Performance targets and quality benchmarks
  - **Expected Benefits**:
    - +100-200% FPS improvement at 4K resolution
    - -60% reduction in CPU usage
    - -65% reduction in code size
    - -50% reduction in mobile battery impact
    - -75% reduction in pattern creation time
  - **Pattern Conversion Guide**: Template and checklist for porting patterns to GLSL
  - **Device Test Matrix**: Cross-platform testing requirements
  - **Resources & References**: Learning materials and technical documentation

### Technical Planning

- **Migration Strategy**: Gradual, feature-flagged migration approach
  - Parallel development with existing Canvas2D system
  - Graceful fallback for unsupported devices
  - Phased rollout (10% → 50% → 100% of users)
- **Shader Architecture**: Multi-layer framebuffer system proposed
  - Pattern registry with dynamic shader loading
  - Audio texture pipeline for GPU-based audio reactivity
  - Post-processing effects (blur, bloom, color grading, distortion)
  - Advanced transition system between patterns
- **Performance Budget**: Defined performance targets per platform
  - Desktop: 60fps at 4K, <10% CPU usage
  - Mobile: 30-60fps, <20% CPU usage, <50MB memory
  - Initial bundle size increase: <100KB for WebGL infrastructure


## [0.6.6] - 2025-12-23

### Added

#### Dynamic Open Graph Image Generation

- **Open Graph Image API**: Created new `/api/og` route for dynamically generating Open Graph embed images
  - Default embed: Shows "darkfloor.art" branding with description when no song query is present
  - Dynamic song embeds: Displays album artwork (squared, left-aligned) with track title, artist, and album information on the right
  - All images generated at 1200×630px (standard Open Graph size) with proper layout and styling
  - Uses Next.js `ImageResponse` API with edge runtime for fast image generation

### Changed

#### Enhanced SEO and Social Sharing

- **Metadata Improvements**: Updated Open Graph and Twitter Card metadata across the application
  - Replaced static Emily the Strange image references with dynamic OG image generator
  - Changed Open Graph type from "website" to "music.song" for track-specific pages
  - Enhanced descriptions to include album information when available
  - Updated both root layout and home page metadata for consistency
- **Image Assets**: Added Emily the Strange image to public directory for fallback scenarios
- **Search Query Embeds**: Song links with query parameters now generate rich embeds showing album art and track details

**Files Modified:**

- Added: `src/app/api/og/route.tsx` (dynamic OG image generator)
- Modified: `src/app/page.tsx` (dynamic metadata generation)
- Modified: `src/app/layout.tsx` (updated default metadata)
- Added: `public/emily-the-strange.png` (fallback image asset)


## [0.6.5] - 2025-12-23

### Changed

#### FlowFieldRenderer Performance Optimizations

- **FlowFieldRenderer performance reworks (drastic)**:
  - **Quantum Entanglement**: heavy rewrite using aggressive LOD, temporal subsampling, quadratic curves, reduced glow, and `fillRect` particles to avoid browser FPS collapse.
  - **Void Whisper**: reduced fidelity (fewer layers/particles), removed most per-frame gradients, simplified tendrils, and reduced core layering.
  - **Spectral Echo**: reduced layers/segments, added temporal subsampling, removed particle/beam gradients and trails, and simplified the core.
  - **Twilight Zone**: removed per-zone gradients; replaced with cheap ring strokes + sparse sparkles and fewer wisps/core layers.
  - **Demonic Gate**: reduced particle/entity/tendril/sigil counts, removed tendril gradients, simplified sigils, and reduced shadow costs.
  - **Shadow Dance**: removed trail/beam gradients, reduced dancer complexity, simplified trails/wisps, and reduced center layers.
- **FlowFieldRenderer Hyper-Optimization**: Replaced remaining `Math.sin`, `Math.cos`, and `Math.sqrt` hot paths with fast trig/fast sqrt helpers across all mystical visual patterns (including ShadowRealm, QuantumEntanglement, NecromanticSigil, DimensionalRift, ChaosVortex, EtherealMist, BloodMoon, DarkMatter, SoulFragment, ForbiddenRitual, TwilightZone, SpectralEcho, VoidWhisper, DemonicGate, CursedRunes, ShadowDance, NightmareFuel).
- **Performance & Visual Fidelity**: Pre-calculated common constants, angle steps, and hue offsets; reduced per-frame allocations; enhanced gradients and glow layers for deeper, more responsive visuals without extra CPU cost.
- **Pattern Infrastructure**: Tightened use of cached HSLA color strings, fast modulo for hues, and object pooling in the visualizer pipeline to keep frame times stable even under heavy audio-reactive scenes.


## [0.6.4] - 2025-12-21

### Changed

#### Complete Rebrand to darkfloor.art

**User-Facing Changes:**
- **Brand Identity**: Completely rebranded from "isobelnet.de" to "darkfloor.art" across all user interfaces
- **UI Components**: Updated all component text including headers, menus, welcome messages, and share dialogs
- **Metadata**: Updated page titles, Open Graph data, and Twitter card metadata for SEO and social sharing
- **Mobile Experience**: Updated mobile header, hamburger menu branding, and player UI text

**Technical Changes:**
- **Package Configuration**: Renamed package from `isobelnet-de` to `darkfloor-art`
- **PM2 Processes**: Renamed production and development processes to `darkfloor-art-prod` and `darkfloor-art-dev`
- **Electron App**: Updated desktop application name, app ID (`com.darkfloor.art`), and product name
- **Documentation**: Updated all README, CLAUDE.md, and setup documentation files
- **Scripts**: Updated all setup scripts, server banners, and diagnostic commands
- **Electron Storage**: Updated persistent storage partition name for Electron builds
- **Base URL**: Updated default fallback URL to `https://darkfloor.art`

**Files Modified (30+ total):**
- UI Components: HamburgerMenu, Header, WelcomeHero, EnhancedTrackCard, SwipeableTrackCard
- App Pages: layout, page, license, user profile
- Configuration: package.json, ecosystem.config.cjs, electron/main.cjs, getBaseUrl.ts
- Documentation: README.md, CLAUDE.md, CHANGELOG.md, electron docs
- Scripts: server.js, pm2-setup.sh, setup-database.sh, verify-build.js
- Styles: globals.css
- Services: smartQueue.ts

## [0.6.3] - 2025-12-21

### Added

#### Enhanced Visual Features

- **Improved Visual Components**: Enhanced visual rendering and display components throughout the application
- **Visual Enhancements**: Added more visual elements and improved visual feedback across the user interface
- **Visual Polish**: Refined visual styling and animations for a more immersive experience

## [0.6.2] - 2025-12-21

### Changed

- Internal improvements and bug fixes

## [0.6.0] - 2025-12-09

### Fixed

#### Critical Production Stability Issues

- **502 Error Crash Loop Resolution**: Fixed infinite crash loop causing 502 Bad Gateway errors in production
  - Root cause: Missing production build (BUILD_ID file) causing Next.js to crash on startup
  - Added build validation check before server startup to prevent crash loops
  - Implemented automatic build recovery via PM2 pre-start hook
  - Created `scripts/ensure-build.js` for automatic build verification and creation
  - Process now fails gracefully with clear error messages instead of infinite restarts
  - Prevents PM2 from restarting when build is missing (stops crash loop)

#### Production Build Management

- **Build Validation System**: Comprehensive build validation before production startup
  - Validates `.next` directory existence
  - Verifies `BUILD_ID` file presence (required by Next.js)
  - Checks `.next/server` directory for complete build
  - Provides clear error messages guiding manual intervention if needed
  - Exits immediately if build is invalid (prevents crash loops)

- **Automatic Build Recovery**: PM2 pre-start hook ensures build exists before starting
  - Automatically runs `npm run build` if BUILD_ID is missing
  - Prevents manual intervention in most cases
  - Logs build process for debugging
  - Fails gracefully if build process fails

### Changed

- **PM2 Configuration**: Enhanced production process management
  - Added `pre_start` hook for automatic build verification
  - Improved restart timing (min_uptime: 30s, restart_delay: 5s, listen_timeout: 10s)
  - Added `wait_ready` flag for Next.js readiness detection
  - Configured health check URL for application-level monitoring
  - Health check grace period set to 5 seconds

- **Error Handling**: Improved error handling in server script
  - Added null checks for error stack traces (TypeScript compliance)
  - Enhanced build validation error messages
  - Better logging for build-related failures

### Technical Improvements

- **Server Startup Flow**: Multi-layer defense against missing builds
  1. PM2 pre-start hook checks and builds if needed
  2. Server script validates build before starting Next.js
  3. Clear error messages if build is still missing
  4. Process exits cleanly (no infinite restart loops)

- **Documentation**: Added comprehensive 502 error analysis documentation
  - Root cause analysis of crash loop issue
  - Step-by-step fix implementation
  - Testing and verification procedures
  - Prevention measures and monitoring recommendations

## [0.6.0] - 2025-12-09

### Added

#### Visualizer Pattern Controls

- **Interactive Pattern Controls Panel**: New real-time control interface for visualizer patterns
  - Pattern duration adjustment (50-1000 frames)
  - Transition speed control (0.001-0.1)
  - Hue base adjustment (0-360°)
  - Real-time pattern state display showing current and next patterns
  - Transition progress indicator
  - Fractal pattern controls:
    - Zoom adjustment (0.1-10)
    - Offset X/Y controls (-2 to 2)
    - Julia C complex parameter controls (real and imaginary components)
  - Accessible via Layers button in player controls when visualizer is enabled
  - Mobile-responsive design with backdrop blur and arcane-themed styling

### Changed

- **Player Controls**: Added pattern controls toggle button to player interface
  - Button appears when visualizer is enabled
  - Integrated with existing player control layout

## [0.5.3] - 2025-12-09

### Changed

- Voronoi pattern smoothing & soothing
- Removed Plasma pattern completely, it was out of place, too in your face
- Bubble pattern replaced with The Orb
- Flow field pattern optimized for performance
- Reduced Mandala fidelity, layering and symmetry. Sometimes less is more.

#### Logging Enhancements

- **Ecosystem Configuration Logging**: Enhanced logging capabilities for PM2 ecosystem management
  - Better allround logging configuration for production and development environments
  - Separate log files for error, output, and combined logs
  - Timestamp formatting for better log traceability
  - Log file organization in dedicated PM2 logs directory

## [0.5.2] - 2025-12-09

### Added

#### Logging Enhancements

- **Ecosystem Configuration Logging**: Enhanced logging capabilities for PM2 ecosystem management
  - Comprehensive logging configuration for production and development environments
  - Separate log files for error, output, and combined logs
  - Timestamp formatting for better log traceability
  - Log file organization in dedicated PM2 logs directory

## [0.5.1] - 2025-12-09

#### Logging Enhancements & Visualizer Pattern Changes

- **Visual Component Logging**: Added comprehensive logging for visual components and visualizer patterns
  - Logging for visual pattern transitions and rendering
  - Performance metrics logging for visual effects
  - Debug logging for visual component state changes

## [0.5.0] - 2025-12-09

### Added

#### Visual Enhancements

- **Arcane-themed CSS Effects**: Enhanced mystical atmosphere with advanced visual effects
  - Radial gradient background for mystical depth
  - Ethereal glow effects at page edges using pseudo-elements
  - Pulsating and glowing animations for enhanced arcane theme
  - Floating energy particles effect for added mystique
  - Shimmer overlay creating depth and movement sense

### Changed

#### Performance Optimizations

- **Visual Pattern Performance**: Optimized pattern transition duration and rendering speed
  - Enhanced Flower of Life rendering (pixel-by-pixel optimization)
  - Optimized Chakras pattern performance
  - Improved Ouroboros animation efficiency
  - Enhanced fractal rendering performance
  - Optimized Metatron's Cube drawing algorithm

#### Configuration Updates

- **PM2 Development Configuration**: Updated development script execution method
  - Changed from `script: 'npm'` to `script: 'scripts/server.js'`
  - Updated interpreter from `'none'` to `'node'` for proper environment variable propagation
  - Added default `env` properties for both production and development configurations

### Fixed

#### Critical Production Issues

- **PM2 Process Management**: Resolved critical PM2 startup and deployment issues
  - Fixed EADDRINUSE errors on port 3222 by switching from cluster to fork mode
  - Changed production from `instances: 2` + `exec_mode: 'cluster'` to `instances: 1` + `exec_mode: 'fork'`
  - Fixed Next.js incompatibility with PM2 cluster mode
  - Resolved development process "waiting restart" loop
  - Added proper environment variable propagation in development mode
  - Fixed 502 Bad Gateway errors in production

#### Code Quality

- **TypeScript Compliance**: Removed unused imports to fix ESLint warnings
  - Removed unused `useEffect` import from Player component
- **Dependency Conflicts**: Resolved version conflicts in dependencies
  - Fixed @types/node dependency version conflicts
- **Merge Conflicts**: Resolved merge conflicts in settings and package-lock files
- **Environment Configuration**: Standardized dotenv configuration across the application

### Technical Improvements

- **PM2 Configuration**: Comprehensive PM2 ecosystem configuration with detailed comments
  - Memory management settings (2GB max per instance)
  - Auto-restart with exponential backoff
  - Graceful shutdown configuration
  - Separate development and production configurations
  - File watching enabled for development with proper ignore patterns
  - Enhanced logging configuration with timestamp formatting

## [0.4.1] - 2025-12-08

### Added

#### Visual Enhancements

- **23 New Mystical Visualizer Patterns**: Added arcane and mystical patterns to the flow field visualizer
  - Sacred Geometry: Pentagram, Flower of Life, Sri Yantra, Metatron's Cube, Vesica Piscis
  - Mystical Symbols: Runes, Sigils, Ouroboros, Chakras, Alchemy symbols
  - Celestial: Celestial bodies, Portal effects, Astrolabe, Moon Phases, Tarot cards
  - Spiritual: Dreamcatcher, Phoenix, Serpent, Crystal Grid, Kabbalah Tree of Life
  - Sacred Patterns: Merkaba, Torus Field, Cosmic Egg
- **Pattern Randomization**: Implemented Fisher-Yates shuffle algorithm for randomized pattern transitions
- **Auto Re-shuffle**: Patterns automatically re-shuffle when completing a full cycle for continuous variety

### Changed

- **Visualizer Pattern Duration**: Halved pattern transition duration from 600 to 300 frames for more dynamic visual experience
- **Dynamic Duration Range**: Adjusted minimum dynamic duration from 300 to 150 frames based on audio intensity
- **Total Pattern Count**: Increased from 22 to 45 unique visualizer patterns

### Fixed

- **TypeScript Compilation**: Fixed implicit 'any' type errors in custom server script
- **PM2 Startup**: Resolved PM2 process manager startup issues
  - Fixed hostname configuration to use HOSTNAME env variable instead of NEXTAUTH_URL
  - Added explicit Node.js interpreter configuration for both production and development modes
- **Server Configuration**: Fixed DNS resolution errors caused by protocol prefix in hostname
- **Network Interface Handling**: Added proper null checks for network interface iteration
- **Error Type Safety**: Improved error handling in catch blocks with proper type guards

### Technical Improvements

- **JSDoc Annotations**: Added comprehensive JSDoc type annotations to server utility functions
- **Build System**: Improved TypeScript strict mode compliance across build scripts
- **Pattern Architecture**: Implemented scalable pattern management system with type-safe pattern definitions
- **Audio Reactivity**: All new patterns feature full audio reactivity with bass, mid, and treble frequency responses

## [0.3.0] - 2025-12-04

### Added - Electron Desktop Application

#### Core Electron Integration

- **Electron Desktop App**: Full desktop application support with packaging for Windows, macOS, and Linux
- **Production Build System**: Optimized standalone Next.js build with Electron integration
- **Build Scripts**: Comprehensive build pipeline with platform-specific scripts
  - `electron:dev` - Development mode with hot reload
  - `electron:prod` - Production mode testing
  - `electron:build:win/mac/linux` - Platform-specific distributables
  - `electron:prod:win` - Build and run Windows installer

#### Persistence & State Management

- **OAuth Session Persistence**: Login state persists across app restarts (30-day sessions)
- **User Preferences Persistence**: All settings saved and restored automatically
  - Audio: Volume, playback rate, equalizer settings
  - Visualizer: Type, position, size, enabled state
  - Smart Queue: Auto-queue, similarity preferences, thresholds
  - UI State: Panel states, theme, lyrics enabled
- **Window State Persistence**: Window size, position, and maximized state remembered
- **Persistent Storage Partition**: Dedicated storage partition for app data isolation
- **Cookie Management**: Automatic cookie flushing on app startup and shutdown
- **Storage Verification**: Automatic verification of storage persistence on startup

#### Electron Features

- **Media Key Support**: Global media key controls (play/pause, next, previous)
- **Native Window Controls**: Proper window management with state saving
- **Dynamic Port Assignment**: Automatic port detection and allocation
- **Server Management**: Graceful server startup, shutdown, and error handling
- **Production/Development Modes**: Automatic mode detection with appropriate configuration
- **Resource Bundling**: Automated copying of static assets, public files, and SSL certificates

#### Developer Experience

- **Storage Utilities**: Comprehensive Electron storage helpers
  - Storage verification and testing
  - Preference export/import for backup
  - Storage usage monitoring
  - Debug logging and status reporting
- **Storage Initialization**: Automatic storage setup and verification component
- **Documentation**: Complete Electron persistence guide with troubleshooting
- **Build Preparation**: Automated standalone package preparation script

#### Technical Improvements

- **Database Session Strategy**: NextAuth configured for 30-day database sessions
- **Cookie Configuration**: Secure, httpOnly cookies with CSRF protection
- **Error Handling**: Comprehensive error dialogs and logging
- **Type Safety**: Full TypeScript support across Electron main process
- **Graceful Shutdown**: Proper cleanup of server processes and resources

### Changed

- **Authentication**: Extended session duration from default to 30 days
- **Cookie Settings**: Custom cookie configuration for better persistence
- **Package Configuration**: Updated main entry point and build configuration
- **Environment Detection**: Improved production/development mode detection

### Fixed

- **Session Loss**: Fixed issue where users had to log in on every app restart
- **Preference Loss**: Fixed settings not persisting between app sessions
- **Build Process**: Resolved standalone build issues with missing resources

## [0.2.0] - Initial Release

### Added - Core Application

#### Music Streaming Platform

- **Deezer Integration**: Full integration with Deezer API for music streaming
- **Audio Player**: Advanced audio player with full playback controls
- **Queue Management**: Comprehensive queue system with drag-and-drop reordering
- **Search**: Real-time music search with artist, album, and track results
- **Playlists**: Create, manage, and play custom playlists

#### Smart Features

- **Smart Queue**: Intelligent auto-queue with similarity-based recommendations
- **Smart Mix**: Generate personalized mixes from seed tracks
- **HexMusic API Integration**: Advanced recommendation engine
- **Audio Analysis**: Spotify audio features integration for intelligent recommendations
- **Similarity Filtering**: Adjustable similarity levels (strict, balanced, diverse)

#### Audio Features

- **9-Band Equalizer**: Professional equalizer with custom and preset options
  - 8 built-in presets (Rock, Pop, Jazz, Classical, etc.)
  - Custom band adjustment
  - Real-time audio processing
  - Preset and settings persistence
- **Audio Visualizers**: Multiple visualizer types
  - Spectrum Analyzer
  - Waveform
  - Circular
  - Frequency Bands (Radial, Waterfall, Layered, Particles, Circular, Bars)
  - Radial Spectrum
  - Spectral Waves
  - Particle System
  - Frequency Rings
- **Playback Controls**:
  - Variable playback speed (0.5x - 2.0x)
  - Repeat modes (none, one, all)
  - Shuffle
  - Volume control with mute
  - Skip forward/backward (10 seconds)

#### User Interface

- **Responsive Design**: Full mobile and desktop support
- **Mobile Navigation**: Bottom navigation bar with swipeable panes
- **Swipe Gestures**: Natural mobile interactions
- **Pull-to-Refresh**: Refresh content with pull gesture
- **Dark Theme**: Modern dark UI design
- **Haptic Feedback**: Touch feedback on mobile devices (where supported)
- **Floating Action Button**: Quick access to player on mobile
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
  - Space: Play/pause
  - Arrow keys: Navigate and seek
  - Number keys: Quick navigation
  - M: Mute
  - And more...

#### Backend & Infrastructure

- **Next.js 15**: Latest Next.js with App Router
- **tRPC**: Type-safe API layer
- **PostgreSQL**: Reliable database with Drizzle ORM
- **NextAuth**: Discord OAuth authentication
- **Drizzle ORM**: Type-safe database queries and migrations

#### Data Management

- **User Profiles**: User accounts with authentication
- **Listening History**: Track playback history
- **Playlist Management**: CRUD operations for playlists
- **Favorites**: Like/unlike tracks
- **User Preferences**: Stored equalizer and UI preferences
- **Smart Queue Settings**: Configurable auto-queue behavior

#### Developer Features

- **TypeScript**: Full type safety across the stack
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Tailwind CSS 4**: Modern utility-first styling
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: User feedback system
- **Loading States**: Comprehensive loading indicators
- **Type Guards**: Runtime type validation
- **Storage Abstraction**: Type-safe localStorage wrapper

#### Performance

- **React Query**: Efficient data fetching and caching
- **Audio Context**: Optimized Web Audio API usage
- **Debounced Updates**: Performance-optimized user interactions
- **Lazy Loading**: Code splitting and component lazy loading
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Build size monitoring

#### Testing & Quality

- **Type Checking**: Strict TypeScript configuration
- **Linting**: Comprehensive ESLint rules
- **Error Suppression**: Extension error filtering
- **Debug Logging**: Detailed console logging for development

### Technical Stack

#### Frontend

- Next.js 15.5.6
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.1.16
- Framer Motion 12.23.24
- tRPC 11.7.0
- TanStack Query 5.90.5

#### Backend

- Next.js API Routes
- NextAuth 5.0.0-beta.30
- Drizzle ORM 0.41.0
- PostgreSQL (via pg 8.16.3)
- tRPC Server 11.0.0

#### Audio & Visualization

- Tone.js 15.1.22
- Web Audio API
- Canvas API
- react-audio-visualize 1.2.0

#### Development

- Electron 39.2.1
- Electron Builder 25.1.8
- ESLint 9.38.0
- Prettier 3.6.2
- Concurrently 9.1.2
- Cross-env 7.0.3

#### Build & Deploy

- PM2 Ecosystem
- Standalone Next.js Output
- Webpack 5.102.1
- PostCSS 8.5.6

---

## Release Notes

### Version 0.3.0 - Electron Desktop Application

This release transforms darkfloor.art into a full-featured desktop application with complete state persistence. Users can now:

- Install darkfloor.art as a native desktop app on Windows, macOS, and Linux
- Enjoy seamless login that persists across app restarts
- Have all preferences, settings, and UI state automatically saved and restored
- Use global media keys to control playback
- Experience native window management with state persistence

### Version 0.2.0 - Initial Release

The initial release of darkfloor.art provides a comprehensive music streaming platform with intelligent recommendations, advanced audio features, and a modern user interface. Key highlights:

- Stream music from Deezer's extensive catalog
- Intelligent auto-queue with similarity-based recommendations
- Professional 9-band equalizer with multiple visualization options
- Full mobile and desktop responsive design
- User authentication and personalized experience

---

## Upgrade Guide

### From 0.2.0 to 0.3.0

**For End Users:**

1. Download the installer for your platform from the releases page
2. Run the installer
3. Your first login will require Discord OAuth
4. After login, all preferences will persist automatically

**For Developers:**

1. Pull the latest changes
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. For development: `npm run electron:dev`
5. For production testing: `npm run electron:prod`
6. For building: `npm run electron:build:win` (or mac/linux)

**Database Migrations:**
No database migrations required for this release.

---

## Known Issues

### Version 0.3.0

- First-time setup requires manual Discord OAuth configuration in environment variables
- Windows installer requires manual uninstallation of previous versions
- macOS may require security preferences adjustment for first launch (unsigned builds)

### Version 0.2.0

- Mobile Safari may have issues with audio autoplay due to browser restrictions
- Some visualizers may have performance issues on lower-end devices
- Database migrations require manual execution via Drizzle Kit

---

## Future Roadmap

### Planned Features

- [ ] Offline mode with local caching
- [ ] Cross-device sync
- [ ] Last.fm scrobbling
- [ ] Lyrics display
- [ ] Mini player mode
- [ ] System tray integration
- [ ] Auto-updates
- [ ] Custom themes
- [ ] Podcast support
- [ ] Radio stations

### Under Consideration

- [ ] Spotify integration
- [ ] Apple Music integration
- [ ] Collaborative playlists
- [ ] Social features
- [ ] Artist pages
- [ ] Concert information
- [ ] Music discovery features

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Deezer API for music streaming
- NextAuth for authentication
- Electron for desktop application framework
- All open-source contributors

---

**Note**: This changelog is maintained manually. For detailed commit history, see the Git repository.
