# Songbird API

## Project Overview
NestJS-based API server integrating multiple music services (Spotify, Deezer, Last.fm).

## Development Environment
- **Node Version**: v25.2.0 (managed via NVM with lazy-loading)
- **Shell**: zsh with NVM lazy-loading via `_zsh_nvm_load`
- **Package Manager**: npm

## Common Commands
- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Prisma Format**: `npx prisma format`
- **Start PM2 (Dev)**: `npm run pm2:start`
- **Start PM2 (Production)**: `npm run pm2:start:prod`

## Git Configuration
- **Current Branch**: main
- **Main Branch**: main (use for PRs)

## Project Structure
- **Main Entry**: `src/main.ts`
- **Modules**: Located in `src/modules/`
  - `auth/` - Authentication with custom JWT guard
  - `deezer/` - Deezer integration
  - `lastfm/` - Last.fm integration
  - `music/` - Music controller
  - `spotify/` - Spotify integration
- **Logging**: Custom interceptor and service in `src/logging/`
- **Database**: Prisma ORM (`src/prisma/`)
- **Types**: Shared types in `src/types.ts`

## Recent Changes
- Refactored DTOs and Controller for Spotify module
- Enhanced error handling and type safety across services
- Updated markdownlint configuration

## Deleted Files
- `ecosystem.config.js` (replaced with `ecosystem.config.cjs`)

## Important Notes
- TypeScript configuration in `tsconfig.json`
- Multiple service integrations require careful error handling
- Custom JWT authentication guard in use
