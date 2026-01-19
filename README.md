# The Collector

A full-stack web application for managing personal collectible collections, including trading cards and comic books.

## Features

- **Multiple Collection Types** - Organize trading cards and comic books in separate collections
- **Detailed Item Tracking** - Record purchase price, estimated value, condition, grading info, and more
- **Image Upload** - Attach photos to your collectibles
- **Search & Filter** - Find items by name, publisher, series, condition, value range, and year
- **Collection Statistics** - View total value, investment tracking, and breakdowns by type and condition
- **Price History** - Track value changes over time

## Tech Stack

- **[Astro](https://astro.build/)** - Web framework with server-side rendering
- **[Preact](https://preactjs.com/)** - Lightweight React alternative for interactive components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[SQLite](https://www.sqlite.org/)** - Embedded database via better-sqlite3
- **TypeScript** - Type-safe JavaScript

## Getting Started

### Prerequisites

- Node.js 18 or later

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd the_collector
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) in your browser.

## Project Structure

```
the_collector/
├── src/
│   ├── components/     # UI components (Astro and Preact)
│   ├── layouts/        # Page layouts
│   ├── lib/            # Database and utilities
│   │   ├── db.ts       # Database connection and queries
│   │   ├── schema.ts   # TypeScript types
│   │   └── utils.ts    # Helper functions
│   ├── pages/          # File-based routing
│   │   ├── api/        # API endpoints
│   │   ├── cards/      # Trading cards pages
│   │   ├── comics/     # Comic books pages
│   │   └── index.astro # Home page
│   └── styles/         # Global CSS
├── public/             # Static assets
└── package.json
```

## Database

The application uses SQLite with the database file stored at `collection.db` in the project root. The schema is automatically initialized on first run, including default collection types (Cards, Comics) and users.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run start` | Alias for `npm run dev` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run db:seed` | Seed the database with sample data |
