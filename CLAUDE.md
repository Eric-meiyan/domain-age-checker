# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a domain age/availability checker built with Next.js 15, TypeScript, and Tailwind CSS. The application provides real-time domain availability checking using RDAP protocol with WHOIS fallback, batch domain queries, and international support.

## Development Commands

```bash
# Development
pnpm dev           # Start development server with turbopack
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint

# Analysis & Deploy
pnpm analyze       # Analyze bundle size
pnpm cf:build      # Build for Cloudflare
pnpm cf:deploy     # Deploy to Cloudflare
```

## Architecture Overview

### Core Service
- **DomainCheckService** (`services/DomainCheckService.ts`): Core domain checking logic using RDAP protocol with WHOIS fallback
- **TldModel** (`models/TldModel.ts`): TLD configuration and caching management
- RDAP cache stored in `app/data/rdap-cache.json` with 30-day expiration

### API Endpoints
- `/api/domain-check`: Main domain availability checking (GET for TLD list, POST for batch checking)
- `/api/domains/tlds`: TLD configuration endpoint
- Authentication APIs using NextAuth

### Frontend Structure
- **App Router**: Using Next.js 15 App Router with locale-based routing (`app/[locale]/`)
- **Components**: Modular structure in `components/` with UI components in `components/ui/`
- **Internationalization**: Using next-intl with messages in `i18n/messages/` and page translations in `i18n/pages/landing/`

### Key Technologies
- **RDAP Protocol**: Primary method for domain checking with automatic fallback to WHOIS
- **Caching**: Local file-based caching for TLD configurations with intelligent updates
- **Batch Processing**: Concurrent domain checking with rate limiting (5 domains per batch)
- **Error Handling**: Graceful degradation from RDAP to WHOIS with detailed error reporting

## Domain Checking Flow

1. Service initialization loads TLD cache from file or IANA API
2. User submits keywords + TLD combinations
3. System generates domain combinations and checks availability
4. RDAP query attempted first, falls back to WHOIS if needed
5. Results aggregated with statistics and returned to frontend

## Configuration

- **TLD Config**: Managed in `app/config/tld-config.json`
- **Environment**: Uses `.env.local` for development
- **Theme**: Customizable in `app/theme.css` using Shadcn UI
- **Internationalization**: Content in `i18n/pages/landing/` for different locales

## Code Conventions

- TypeScript throughout with strict type definitions
- React functional components with hooks
- Tailwind CSS + Shadcn UI for styling
- Context API for state management
- MDX support for content pages
- Component names in CamelCase
- File structure follows Next.js App Router conventions

## Performance Features

- Concurrent domain checking with timeout controls
- RDAP server caching and rotation
- Local TLD configuration caching
- Bundle analysis with `pnpm analyze`
- Turbopack for faster development builds