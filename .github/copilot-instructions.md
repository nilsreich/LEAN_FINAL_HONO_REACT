# 🎯 Lean-Stack Instructions: Bun + Hono + libSQL + Zod

## 💡 Core Philosophy
Max efficiency for 512MB RAM VPS. Minimal dependencies, zero-bloat, rapid DX. Use Zod for end-to-end typesafety and runtime validation.

## 🛠 Tech Stack
- **Runtime:** Bun (native APIs preferred: `Bun.file`, `Bun.password`, `Bun.serve`).
- **Backend:** Hono (Lightweight, RPC mode via `hono/client`).
- **Database:** libSQL (local file `sqlite.db`) via `drizzle-orm`.
- **Auth:** Better-Auth (SQLite/libSQL adapter).
- **Frontend:** React + Vite (CSR), TanStack Router & Query.
- **Validation:** Zod (Required for all API inputs & Shared Schemas).
- **Styling:** Styling: TailwindCSS + DaisyUI (Plugin-based UI, zero JS overhead, CSS-only components).

## � Structure & Efficiency (Flat-Monorepo)
1. **Directory Map:**
   - `/src/server/`: Hono Entry (`index.ts`), DB Schema, Auth Logic.
   - `/src/client/`: React App, Pages, Components, Hooks.
   - `/src/shared/`: Shared Zod-Schemas and Constants.
   - `/drizzle/`: Database Migrations.
2. **Shared Schemas:** Definiere Zod-Schemas AUSSCHLIESSLICH in `/src/shared/schemas.ts`. Importiere diese in `/src/server` (Validierung) und `/src/client` (Formulare/Queries).
3. **Type-Inference:** Nutze `z.infer<typeof schema>` statt manueller Interfaces/Types.
4. **Hono Validation:** Nutze zwingend die `@hono/zod-validator` Middleware.
5. **Database:** Nutze libSQL Batching (`db.batch`) zur Ressourcenschonung.
6. **Themes:** DaisyUI 5 nutzt `@theme`-Blocks in CSS. Dark/Light Mode über `data-theme` am `<html>`.
7. **Tooling:** Biome für Linting/Formatting (kein ESLint/Prettier).

## 🚀 Efficiency & Rules
1. **Hono RPC:** Exportiere `type AppType = typeof route` in `/src/server/index.ts`.
2. **UI Hydration:** Die `index.html` (im Root) enthält einen Theme-Init-Script gegen FOUC.

## 📋 Code Generation Guidelines
- **Kürze:** Code auf das absolute Minimum reduzieren. Keine unnötigen Abstraktionen.
- **Kommentare:** Jede Logik kurz und prägnant kommentieren.
- **Native:** Nutze Bun-Build-ins wo möglich.
- **RPC:** Exportiere `type AppType = typeof route` für volle Typesafety im Frontend ohne tRPC.

## 🚫 Anti-Patterns
- ❌ Kein Docker, kein SSR, keine Microservices.
- ❌ Keine manuellen Typ-Definitionen für Daten, die bereits ein Zod-Schema haben.
- ❌ Keine schweren Logging-Systeme (nur `console.log`).