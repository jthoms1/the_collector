# Jet

Personal collectibles management app for trading cards and comic books.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:4321 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Tech Stack

- **Astro 5.0** - SSR framework with Node.js adapter
- **Preact** - Lightweight React alternative for interactive components
- **Tailwind CSS** - Utility-first styling with custom theme
- **TypeScript** - Strict mode enabled
- **better-sqlite3** - Embedded SQLite database

## Architecture

### Component Strategy
- `.astro` files for static/server-rendered content (can access database directly)
- `.tsx` files (Preact) for client-side interactivity only
- Use `client:load` directive when hydrating Preact components

### Key Directories
- `src/components/` - UI components (Astro and Preact)
- `src/lib/db.ts` - Database singleton, all queries and CRUD operations
- `src/lib/schema.ts` - TypeScript interfaces and types
- `src/lib/utils.ts` - Formatters, validators, helpers
- `src/pages/api/` - RESTful API endpoints

### Database
- SQLite file at project root: `collection.db`
- Schema auto-initializes on first connection
- Tables: items, collection_types, price_history, tags, item_tags, users
- Uses parameterized queries for all operations

## Coding Conventions

### Naming
- Components: PascalCase (`ItemCard.astro`, `SearchBar.tsx`)
- Pages/API: lowercase with brackets for dynamic routes (`[id].astro`)
- Use `@/` path alias for imports from src/

### TypeScript
- Define Props interfaces for all components
- Types centralized in `src/lib/schema.ts`
- Strict mode - no implicit any

### Styling
- Tailwind utility classes preferred
- Custom component classes in `src/styles/global.css` (`.btn-primary`, `.card`, `.input`, `.badge`)
- Custom colors: `primary` (sky blue), `accent` (magenta)

### API Routes
- Return JSON with appropriate status codes
- Use try-catch with error responses
- HTTP methods: GET (list/read), POST (create), PUT (update), DELETE (remove)

## File Upload
- Images stored in `/Cards/` or `/Comics/` directories (gitignored)
- Accepted formats: JPEG, PNG, WebP, GIF (max 10MB)
- Middleware serves images with 1-year cache headers
