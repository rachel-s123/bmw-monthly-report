# BMW Marketing Dashboard - Vite Migration

This project is a migration of the BMW Marketing Dashboard to a modern Vite-based architecture with React frontend and Express backend.

## Project Structure

```
bmw-monthly-report/
├── client/                  # Frontend Vite React application
│   ├── public/              # Static assets
│   └── src/
│       ├── assets/          # Images, fonts, etc.
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API and other services
│       └── styles/          # CSS styles
├── server/                  # Backend Express application
│   ├── routes/              # API route handlers
│   └── services/            # Business logic services
├── docs/                    # Documentation
│   ├── vite-quickstart.md   # Quickstart guide for the migration
│   └── vite-refactor-plan.md # Overall migration plan
└── package.json             # Root package.json for managing both apps
```

## Getting Started

1. Install all dependencies:

   ```bash
   npm run install-all
   ```

2. Start development servers:

   ```bash
   npm run dev
   ```

   This will start both the client (on port 5173) and the server (on port 5000).

3. Build for production:

   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm start
   ```

## Migration Resources

- See `docs/vite-refactor-plan.md` for the detailed migration plan
- See `docs/vite-quickstart.md` for step-by-step technical instructions

## Current Migration Status

Initial project structure has been set up with:

- Vite + React frontend with initial components
- Express backend with basic API endpoints
- France dashboard as the first migrated section

Next steps include:

1. Migrating Germany and UK dashboard sections
2. Implementing remaining chart components
3. Adding authentication
4. Implementing data fetching from real API endpoints
