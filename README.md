# 🚀 Bun + Hono + Better-Auth + React PWA

This is a bare-minimal, high-performance full-stack template optimized for Low-RAM VPS environments.

### 📁 Project Structure
- `index.ts`: Unified Backend (Hono) & Frontend server.
- `src/server/`: Hono backend, Database (Drizzle/SQLite) and Auth (Better-Auth) logic.
- `src/client/`: React + Vite + TanStack Query + TailwindCSS + DaisyUI.
- `src/shared/`: Shared Zod schemas for end-to-end typesafety.
- `dist/`: Prepared production build.

### 🛠 Quick Start
1. **Install:** `bun install`
2. **Database Setup:** `bun run db:push`
3. **Build Frontend:** `cd frontend && bun run build`
4. **Run Server:** `bun index.ts`

### 💡 Features
- **Better-Auth:** Secure authentication with zero boilerplate.
- **TanStack Query:** Powerful data synchronization for React.
- **PWA:** Installable as a mobile/desktop app.
- **Bun:** Blazing fast runtime.

