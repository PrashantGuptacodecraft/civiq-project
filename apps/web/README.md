# CivIQ Web Application

This is the Next.js frontend application for the CivIQ platform.

## Local Startup

To run the application locally:

1. From the repository root, install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server from the root:
   ```bash
   pnpm run dev
   ```
   Or from within `apps/web`:
   ```bash
   pnpm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Architecture
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (configured to match `docs/ux/DESIGN-SYSTEM.md`)
