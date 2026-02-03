# 📋 Vollständige Projektspezifikation: LEAN_FINAL_HONO_REACT

**Version:** 1.3.0  
**Stand:** 03.02.2026  
**Dokumenttyp:** Technische Spezifikation für externe Evaluation

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Projektübersicht](#2-projektübersicht)
3. [Architektur](#3-architektur)
4. [Technologie-Stack](#4-technologie-stack)
5. [Backend-Spezifikation](#5-backend-spezifikation)
6. [Frontend-Spezifikation](#6-frontend-spezifikation)
7. [Datenbank-Spezifikation](#7-datenbank-spezifikation)
8. [Sicherheitsarchitektur](#8-sicherheitsarchitektur)
9. [API-Spezifikation](#9-api-spezifikation)
10. [Performance-Optimierungen](#10-performance-optimierungen)
11. [Deployment & Operations](#11-deployment--operations)
12. [Qualitätssicherung](#12-qualitätssicherung)
13. [Zukunftssicherheit & Skalierbarkeit](#13-zukunftssicherheit--skalierbarkeit)
14. [Risikobewertung](#14-risikobewertung)
15. [Compliance & Standards](#15-compliance--standards)
16. [Anlagen & Automatisierung](#16-anlagen--automatisierung)

---

## 1. Executive Summary

### 1.1 Projektbeschreibung
LEAN_FINAL_HONO_REACT ist ein **High-Density Monolith**, der speziell für den Betrieb auf minimalsten Ressourcen optimiert wurde (Ziel: **Lean-Mean-Low Resources 1GB RAM / 1vCPU VPS**). Das Projekt demonstriert, wie man mit einer einheitlichen Codebase eine moderne Fullstack-App **schnell, einfach, modern und sicher** entwickelt und deployt, ohne die Komplexität von Microservices oder schwerfälligen Frameworks.

### 1.2 Kernziele
| Ziel | Beschreibung | Status |
|------|--------------|--------|
| **Ressourceneffizienz** | Optimiert für 1GB RAM / 1vCPU VPS | ✅ Implementiert |
| **Speed to Market** | Schnelle Entwicklung durch E2E Type-Safety | ✅ Implementiert |
| **Modern & Simple** | React 19 + Hono (Low Complexity) | ✅ Implementiert |
| **Security by Design** | Zero-Trust API, Session-Auth, Rate-Limiting | ✅ Implementiert |
| **Easy Deployment** | Single-Binary Build & VPS Setup | ✅ Implementiert |

### 1.3 Technische Highlights
- **Bun Runtime**: Minimaler Overhead, nativer TS-Support, extrem schneller Startup.
- **Hono Framework**: Edge-ready, minimaler Speicherverbrauch (~14KB Core).
- **React 19**: Modernstes UI-Rendering mit minimalen Abstraktionen.
- **Better-Auth**: Sichere, standardisierte Authentifizierung ohne externe Abhängigkeiten.
- **Drizzle ORM & libSQL**: Type-safe Datenbankzugriff direkt auf dem Host (SQLite).

---

## 2. Projektübersicht

### 2.1 Anwendungsfall
Eine hocheffiziente Fullstack-Referenzarchitektur, die zeigt, wie moderne Webstandards (Auth, CRUD, Paginierung, Security) in einer extrem schlanken Umgebung umgesetzt werden.

### 2.2 Zielgruppe
- **Solopreneure & Startups**: Die maximale Entwicklungsgeschwindigkeit bei minimalen Hosting-Kosten (5€ VPS) suchen.
- **Product Engineers**: Die eine robuste, sichere Basis für schnelle MVP-Iterationen benötigen.
- **Plattform-Architekten**: Die Alternativen zu komplexen Cloud-Native-Landschaften suchen.

### 2.3 Projekt-Metriken
```
Ziel-Hardware:        1 vCPU, 1 GB RAM (Standard VPS)
Memory Footprint:     ~42MB Idle / ~95MB Load
Lines of Code:        ~1.200 LOC (Core Logic)
Cold Start:           < 500ms
```

---

## 3. Architektur

### 3.1 Architekturdiagramm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LEAN_FINAL_HONO_REACT                          │
│                            (High-Density Monolith)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT (React 19 SPA)                        │   │
│  ├──────────────┬──────────────┬──────────────┬────────────────────────┤   │
│  │   TanStack   │   TanStack   │   DaisyUI    │    Better-Auth         │   │
│  │    Router    │  React Query │   + Tailwind │      Client            │   │
│  ├──────────────┴──────────────┴──────────────┴────────────────────────┤   │
│  │                        Hono RPC Client (hc<AppType>)                │   │
│  └─────────────────────────────────┬───────────────────────────────────┘   │
│                                    │                                        │
│                                    │ HTTP/HTTPS (Credentials: include)      │
│                                    │                                        │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                         SERVER (Hono + Bun)                          │   │
│  ├──────────────┬──────────────┬──────────────┬────────────────────────┤   │
│  │     CORS     │     CSRF     │   Request    │      Auth Guard        │   │
│  │  Middleware  │  Middleware  │    Logger    │      Middleware        │   │
│  ├──────────────┴──────────────┴──────────────┴────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │   │
│  │  │  /api/auth/*   │  │   /api/posts   │  │   /api/protected       │ │   │
│  │  │ (Better-Auth)  │  │  (CRUD Routes) │  │   (Auth Required)      │ │   │
│  │  └───────┬────────┘  └───────┬────────┘  └────────────┬───────────┘ │   │
│  │          │                   │                        │              │   │
│  │  ┌───────┴───────────────────┴────────────────────────┴───────────┐ │   │
│  │  │                    Zod Validators (Shared Schemas)             │ │   │
│  │  └────────────────────────────┬───────────────────────────────────┘ │   │
│  │                               │                                      │   │
│  │  ┌────────────────────────────▼───────────────────────────────────┐ │   │
│  │  │                     Drizzle ORM (Type-Safe)                    │ │   │
│  │  └────────────────────────────┬───────────────────────────────────┘ │   │
│  └───────────────────────────────┼─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────▼─────────────────────────────────────┐   │
│  │                    DATABASE (libSQL / SQLite)                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────┐ │   │
│  │  │   user   │ │ session  │ │ account  │ │verification│ │  post   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Schichtenmodell

| Schicht | Technologie | Verantwortlichkeit |
|---------|-------------|-------------------|
| **Presentation** | React 19, TanStack Router, DaisyUI | UI Rendering, Routing, Styling |
| **State Management** | TanStack Query | Server State, Caching |
| **API Client** | Hono RPC Client | Type-safe API Aufrufe |
| **API Server** | Hono | Request Handling, Middleware |
| **Authentication** | Better-Auth | Session Management, User Identity |
| **Validation** | Zod | Request/Response Validation |
| **Data Access** | Drizzle ORM | Database Queries |
| **Persistence** | libSQL/SQLite | Data Storage |

### 3.3 Verzeichnisstruktur

```
.
├── ARCHITECTURE.md              # Architektur-Dokumentation
├── SPECIFICATION.md             # Diese Datei
├── README.md                    # Projekt-Readme
├── biome.json                   # Linter/Formatter Konfiguration
├── drizzle.config.ts            # Drizzle ORM Konfiguration
├── playwright.config.ts         # Playwright E2E Konfiguration
├── index.html                   # SPA Entry Point
├── package.json                 # Dependencies & Scripts
├── tsconfig.json                # TypeScript Konfiguration
├── vite.config.ts               # Vite Build Konfiguration
│
├── drizzle/                     # SQL Migrationen (generiert)
│
├── tests-e2e/                   # Playwright E2E Tests
│   └── basic.spec.ts
│
├── src/
    ├── client/                  # Frontend (React SPA)
    │   ├── App.tsx              # Router & Layout
    │   ├── main.tsx             # React Entry Point
    │   ├── global.css           # Tailwind + DaisyUI Styles
    │   │
    │   ├── auth/
    │   │   └── auth-client.ts   # Better-Auth Client
    │   │
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Navbar.tsx   # Navigation Component
    │   │   └── ui/
    │   │       ├── Button.tsx   # Button Component
    │   │       ├── Card.tsx     # Card Component
    │   │       └── Input.tsx    # Input Component
    │   │
    │   ├── lib/
    │   │   └── api.ts           # Hono RPC Client
    │   │
    │   └── pages/
    │       ├── CreatePostPage.tsx
    │       ├── HomePage.tsx
    │       ├── LoginPage.tsx
    │       └── PostDetailPage.tsx
    │
    ├── server/                  # Backend (Hono)
    │   ├── index.ts             # Server Entry Point
    │   ├── v1.test.ts           # API Unit Tests
    │   │
    │   ├── auth/
    │   │   ├── auth.ts          # Better-Auth Server Config
    │   │   └── middleware.ts    # Auth Guard Middleware
    │   │
    │   ├── db/
    │   │   ├── index.ts         # Drizzle Client
    │   │   └── schema.ts        # Database Schema
    │   │
    │   └── lib/
    │       └── logger.ts        # Error Monitoring & Logging service
    │
    └── shared/                  # Geteilter Code
        ├── schemas.ts           # Zod Validation Schemas
        └── schemas.test.ts      # Schema Unit Tests
```

---

## 4. Technologie-Stack

### 4.1 Runtime & Build Tools

| Komponente | Technologie | Version | Begründung |
|------------|-------------|---------|------------|
| **Runtime** | Bun | latest | 3-4x schneller als Node.js, native TS Support |
| **Build Tool** | Vite | 7.3.1 | Schneller Dev Server, optimiertes Bundling |
| **Bundler** | Rollup (via Vite) | - | Tree-shaking, Code-Splitting |
| **Type System** | TypeScript | 5.9.3 | Strikte Typisierung |
| **Linter/Formatter** | Biome | 2.3.13 | 20x schneller als ESLint/Prettier |

### 4.2 Backend Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `hono` | 4.11.7 | Web Framework (Edge-ready) |
| `@hono/zod-validator` | 0.7.6 | Request Validation |
| `better-auth` | 1.4.18 | Authentication |
| `drizzle-orm` | 0.45.1 | Type-safe ORM |
| `@libsql/client` | 0.17.0 | SQLite Client |
| `zod` | 4.3.6 | Schema Validation |

### 4.3 Frontend Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `react` | 19.2.4 | UI Library |
| `react-dom` | 19.2.4 | DOM Rendering |
| `@tanstack/react-router` | 1.158.0 | Type-safe Routing |
| `@tanstack/react-query` | 5.90.20 | Server State Management |
| `tailwindcss` | 4.1.18 | Utility-First CSS |
| `daisyui` | 5.5.17 | UI Component Library |
| `lucide-react` | 0.563.0 | Icon Library |
| `vite-plugin-pwa` | 1.2.0 | PWA Support |

### 4.4 DevDependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `@biomejs/biome` | 2.3.13 | Linting & Formatting |
| `@types/bun` | latest | Bun Type Definitions |
| `@types/react` | 19.2.10 | React Type Definitions |
| `@types/react-dom` | 19.2.3 | React DOM Types |
| `autoprefixer` | 10.4.24 | CSS Vendor Prefixes |
| `drizzle-kit` | 0.31.8 | Database Migrations |
| `vitest` | latest | Unit Testing Framework |
| `playwright` | latest | E2E Testing Framework |

---

## 5. Backend-Spezifikation

### 5.1 Server Entry Point (`src/server/index.ts`)

#### 5.1.1 Konfiguration
```typescript
// Type-sichere Context Variables
type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
};

const app = new Hono<{ Variables: Variables }>();
```

#### 5.1.2 Middleware Pipeline

```
Request → Logging (Structured) → Rate Limiting → CSP Headers → CORS → CSRF → [Auth Guard] → Route Handler (v1) → Response
```

| Middleware | Pfad | Beschreibung |
|------------|------|--------------|
| Structured Logger | `*` | Loggt Requests als JSON für Log-Aggregation |
| Rate Limiter | `/api/*` | Memory-basiertes Limit (100 Req/Min pro IP) |
| Secure Headers (CSP) | `*` | Setzt CSP, XSS-Protection, HSTS, etc. |
| CORS | `/api/*` | Environment-aware Origin Validation |
| CSRF | `/api/*` | CSRF Token Validation |
| Auth Guard | Selected Routes | Session Validation |

#### 5.1.3 Graceful Shutdown
Der Server implementiert eine kontrollierte Shutdown-Logik für SIGTERM/SIGINT, um DB-Verbindungen sauber zu schließen:
```typescript
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  try {
    // Falls nötig, DB-Verbindungen explizit schließen
    // await client.close();
    console.log("Database connections closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

#### 5.1.4 Structured Logging
Der Server implementiert ein strukturiertes Logging im JSON-Format, was die Integration in Obsidian, ELK oder Grafana Loki ermöglicht:
```json
{
  "level": "info",
  "message": "API Request",
  "data": {
    "method": "GET",
    "path": "/api/v1/posts",
    "status": 200,
    "duration": "14ms",
    "ip": "127.0.0.1"
  },
  "timestamp": "2026-02-03T12:00:00.000Z"
}
```

#### 5.1.5 Rate Limiting Implementation
Für den ressourcenschonenden Betrieb auf einem 1GB VPS wird ein Memory-basiertes Rate-Limiting eingesetzt:

```typescript
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 Minute

app.use("/api/*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for") || "local";
  // ... rate limit logic
});
```
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW };

  if (now > record.reset) {
    record.count = 1;
    record.reset = now + RATE_LIMIT_WINDOW;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  if (record.count > 100) {
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
});
```

#### 5.1.5 Error Handling
```typescript
app.onError((err, c) => {
  const isProduction = process.env.NODE_ENV === "production";
  const status = "status" in err && typeof err.status === "number" ? err.status : 500;
  
  return c.json({
    success: false,
    error: {
      message: isProduction && status === 500 ? "Internal Server Error" : err.message,
      code: status,
      ...(isProduction ? {} : { stack: err.stack }),
    }
  }, status);
});
```

Das Error-Handling ist so konfiguriert, dass in der Produktionsumgebung keine sensiblen Stack-Traces oder Detail-Informationen bei 500er Fehlern nach außen dringen.

### 5.2 Authentifizierung (`src/server/auth/`)

#### 5.2.1 Better-Auth Konfiguration
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
  ],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 Tage
    updateAge: 60 * 60 * 24,    // 1 Tag Refresh-Frequenz
  },
});
```

#### 5.2.2 Session Lifecycle & Timeout
| Eigenschaft | Wert | Beschreibung |
|-------------|------|--------------|
| **Absolute Timeout** | 7 Tage | Zeit bis zum automatischen Logout |
| **Idle Timeout** | 1 Tag | Zeit, nach der der Session-Timestamp in der DB aktualisiert wird |
| **Cookie Persistence** | Session | Bleibt erhalten, solange der Browser offen ist (oder via Max-Age) |

#### 5.2.3 Auth Guard Middleware
```typescript
export const authGuard = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
};
```

### 5.3 Datenbank-Layer (`src/server/db/`)

#### 5.3.1 Client Initialisierung
```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: "file:sqlite.db",  // WAL-Mode automatisch aktiviert
});

export const db = drizzle(client, { schema });
```

---

## 6. Frontend-Spezifikation

### 6.1 Application Entry

#### 6.1.1 React Mounting (`src/client/main.tsx`)
```typescript
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

#### 6.1.2 Router Setup (`src/client/App.tsx`)

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | HomePage | ❌ |
| `/login` | LoginPage | ❌ |
| `/create` | CreatePostPage | ⚠️ UI-Level |
| `/posts/:postId` | PostDetailPage | ❌ |

### 6.2 API Client (`src/client/lib/api.ts`)

```typescript
import { hc } from "hono/client";
import type { AppType } from "../../server/index";

export const api = hc<AppType>("/");
```

**Type-Safety Beispiel:**
```typescript
// Vollständige Autocomplete für Parameter und Response
const res = await api.api.posts.$post({
  json: { title: "Hello", content: "World" }
});
const post = await res.json();  // Typisiert!
```

### 6.3 Auth Client (`src/client/auth/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});
```

**Verfügbare Hooks:**
- `authClient.useSession()` – Session State
- `authClient.signIn.email()` – Email Login
- `authClient.signUp.email()` – Email Registration
- `authClient.signOut()` – Logout

### 6.4 Component Architecture

#### 6.4.1 Atomic Design Pattern

```
components/
├── ui/           # Atoms (Button, Input, Card)
└── layout/       # Organisms (Navbar)
```

#### 6.4.2 UI Components

**Button Component:**
```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "error" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
}
```

**Input Component:**
```typescript
interface InputProps {
  label?: string;
  isTextArea?: boolean;
}
```

### 6.5 Styling Architecture

#### 6.5.1 CSS Stack
- **Tailwind CSS 4.1**: Utility-First Framework
- **DaisyUI 5.5**: Component Classes
- **CSS-in-TS**: Inline Styles für dynamische Werte

#### 6.5.2 Theme Configuration
```css
@plugin "daisyui" {
  themes: light, dark;
}

@theme {
  --color-brand: #7480ff;
}
```

#### 6.5.3 Dark Mode
Early Theme Detection verhindert FOUC:
```javascript
const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', theme);
```

### 6.6 Frontend Pagination (Infinite Query)
Effiziente Datenabfrage mittels TanStack Infinite Query:

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: async ({ pageParam = 0 }) => {
    const res = await api.api.posts.$get({
      query: { limit: "10", offset: pageParam.toString() },
    });
    return res.json();
  },
  getNextPageParam: (lastPage) => {
    const nextOffset = lastPage.offset + lastPage.posts.length;
    return nextOffset < lastPage.total ? nextOffset : undefined;
  },
  initialPageParam: 0,
});
```

---

## 7. Datenbank-Spezifikation

### 7.1 Entity-Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    user     │───────│   session   │       │   account   │
├─────────────┤  1:N  ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │       │ expiresAt   │       │ accountId   │
│ email (UQ)  │       │ token (UQ)  │       │ providerId  │
│ emailVerif. │       │ createdAt   │       │ userId (FK) │
│ image       │       │ updatedAt   │       │ password    │
│ createdAt   │       │ ipAddress   │       │ createdAt   │
│ updatedAt   │       │ userAgent   │       │ updatedAt   │
└─────────────┘       │ userId (FK) │       └─────────────┘
       │              └─────────────┘              │
       │                                          │
       │  1:N                                     │
       │                                          │
       ▼                                          │
┌─────────────┐       ┌─────────────┐            │
│    post     │       │verification │            │
├─────────────┤       ├─────────────┤            │
│ id (PK)     │       │ id (PK)     │            │
│ title       │       │ identifier  │            │
│ content     │       │ value       │            │
│ userId (FK) │       │ expiresAt   │            │
│ createdAt   │       │ createdAt   │            │
│ updatedAt   │       │ updatedAt   │            │
└─────────────┘       └─────────────┘            │
       ▲                                          │
       │                                          │
       └──────────────────────────────────────────┘
```

### 7.2 Tabellen-Definitionen

#### 7.2.1 `user` Table
```typescript
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Display Name |
| email | TEXT | NOT NULL, UNIQUE | Email Address |
| emailVerified | INTEGER | NOT NULL | Boolean (0/1) |
| image | TEXT | NULLABLE | Avatar URL |
| createdAt | INTEGER | NOT NULL | Unix Timestamp |
| updatedAt | INTEGER | NOT NULL | Unix Timestamp |

#### 7.2.2 `session` Table
```typescript
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Session ID |
| expiresAt | INTEGER | NOT NULL | Expiration Timestamp |
| token | TEXT | NOT NULL, UNIQUE | Session Token |
| createdAt | INTEGER | NOT NULL | Creation Timestamp |
| updatedAt | INTEGER | NOT NULL | Update Timestamp |
| ipAddress | TEXT | NULLABLE | Client IP |
| userAgent | TEXT | NULLABLE | Browser Info |
| userId | TEXT | NOT NULL, FK | Reference to user.id |

#### 7.2.3 `account` Table
```typescript
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});
```

#### 7.2.4 `verification` Table
```typescript
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});
```

#### 7.2.5 `post` Table
```typescript
export const post = sqliteTable("post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => ({
  userIdIdx: index("post_userId_idx").on(table.userId),
}));
```

### 7.3 Indizes

| Index Name | Table | Column(s) | Type |
|------------|-------|-----------|------|
| `user_email_unique` | user | email | UNIQUE |
| `session_token_unique` | session | token | UNIQUE |
| `post_userId_idx` | post | userId | BTREE |

### 7.4 Migrations

Migrationen werden mit `drizzle-kit` generiert:

```bash
bun run db:push  # Sync schema to database
```

---

## 8. Sicherheitsarchitektur

### 8.1 Sicherheitsmodell: Defense in Depth

```
┌────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Transport                          │
│                    (HTTPS in Production)                           │
├────────────────────────────────────────────────────────────────────┤
│                        Layer 2: Headers (CSP)                      │
│              (Strict Content Security Policy)                      │
├────────────────────────────────────────────────────────────────────┤
│                        Layer 3: CORS                               │
│              (Origin Whitelist + Credentials)                      │
├────────────────────────────────────────────────────────────────────┤
│                        Layer 4: CSRF                               │
│               (Origin Header Validation)                           │
├────────────────────────────────────────────────────────────────────┤
│                   Layer 5: Authentication                          │
│           (HttpOnly Session Cookies)                               │
├────────────────────────────────────────────────────────────────────┤
│                   Layer 6: Authorization                           │
│              (Route-Level Auth Guards)                             │
├────────────────────────────────────────────────────────────────────┤
│                   Layer 7: Input Validation                        │
│                   (Zod Schemas)                                    │
├────────────────────────────────────────────────────────────────────┤
│                   Layer 8: Data Access                             │
│           (Parameterized Queries via Drizzle)                      │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 Content Security Policy (CSP)

Die Anwendung nutzt Hono's `secureHeaders` Middleware zur Durchsetzung einer restriktiven CSP:

| Directive | Policy | Zweck |
|-----------|--------|-------|
| `default-src` | `'self'` | Nur Ressourcen vom eigenen Origin erlaubt |
| `script-src` | `'self'`, `'unsafe-inline'` | Ermöglicht Theme-Detection Skripte |
| `style-src` | `'self'`, `'unsafe-inline'` | Erforderlich für Tailwind/daisyUI Runtime |
| `img-src` | `'self'`, `data:`, `https:` | Erlaubt Avatare und Inline-Icons |
| `frame-ancestors` | `'none'` | Verhindert Clickjacking (kein iFrame-Embedding) |
| `object-src`| `'none'` | Deaktiviert Plugins (Flash, etc.) |

**Implementation:**
```typescript
app.use("*", secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://*.app.github.dev", "http://localhost:3000"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
  },
}));
```

### 8.3 CORS-Konfiguration

```typescript
app.use("/api/*", cors({
  origin: (origin) => {
    if (
      origin === "http://localhost:5173" ||
      origin === process.env.PRODUCTION_URL ||
      origin?.endsWith(".app.github.dev")
    ) {
      return origin;
    }
    return "http://localhost:5173";
  },
  credentials: true,  // Wichtig für Cookies
}));
```

| Environment | Allowed Origins |
|-------------|-----------------|
| Development | `localhost:5173` |
| GitHub Codespaces | `*.app.github.dev` |
| Production | `PRODUCTION_URL` env var |

### 8.3 CSRF-Schutz

**Doppelte Absicherung:**
1. **Hono CSRF Middleware**: Validiert Origin-Header
2. **Better-Auth**: Eigene CSRF-Checks für Auth-Endpoints

```typescript
app.use("/api/*", csrf());
```

### 8.4 Session-Management

| Eigenschaft | Wert | Sicherheitsrelevanz |
|-------------|------|---------------------|
| Cookie Type | HttpOnly | ✅ Verhindert XSS Cookie-Theft |
| SameSite | Lax | ✅ CSRF-Schutz für GET |
| Secure | true (in Prod) | ✅ Nur über HTTPS |
| Session Storage | Database | ✅ Server-Side Validation |

### 8.5 Passwort-Handling

Better-Auth verwendet bcrypt für Password Hashing:
- **Algorithm**: bcrypt
- **Cost Factor**: Default (10 rounds)
- **Salting**: Automatisch

### 8.6 Input Validation

#### 8.6.1 Shared Schema
```typescript
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required"),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});
```

#### 8.6.2 Server-Side Validation
```typescript
.post("/api/posts", authGuard, zValidator("json", createPostSchema), async (c) => {
  const body = c.req.valid("json");  // Type-safe & validated
  // ...
});
```

### 8.7 SQL Injection Prevention

Drizzle ORM nutzt parameterisierte Queries:
```typescript
// Sicher: Parameter wird escaped
await db.select().from(post).where(eq(post.id, id));

// Niemals: String Interpolation
// await db.execute(`SELECT * FROM post WHERE id = '${id}'`);  // GEFÄHRLICH
```

### 8.8 Sicherheits-Checkliste

| Kategorie | Check | Status |
|-----------|-------|--------|
| **Authentication** | Session-based (no JWT in localStorage) | ✅ |
| **Authentication** | HttpOnly Cookies | ✅ |
| **Authentication** | Secure Session Token | ✅ |
| **Authorization** | Route-level Guards | ✅ |
| **Attack Prevention** | **Rate Limiting (100 Req/Min)** | ✅ |
| **Attack Prevention** | CSRF Protection | ✅ |
| **Attack Prevention** | SQL Injection Prevention | ✅ |
| **Attack Prevention** | Clickjacking (X-Frame-Options) | ✅ |
| **Input** | Schema Validation (Zod) | ✅ |
| **Transport** | CORS Configured | ✅ |
| **Secrets** | Env Variables | ✅ |
| **Error Handling** | No Stack in Prod | ✅ |

---

## 9. API-Spezifikation (v1)

### 9.1 System & Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api/v1` |
| Codespaces | `https://{codespace}.app.github.dev/api/v1` |
| Production | `{PRODUCTION_URL}/api/v1` |

*Hinweis: Authentifizierungs-Endpoints verbleiben unter `/api/auth/` für Better-Auth Kompatibilität.*

#### GET /health
System-Health-Check Endpoint für Monitoring (öffentlich).

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "ISO8601",
  "uptime": 123.45,
  "memoryUsage": { ... },
  "bunVersion": "1.x.x"
}
```

### 9.2 Authentication Endpoints

#### POST /api/auth/sign-up/email
Registriert einen neuen Benutzer.

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "callbackURL": "string (optional)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": false
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO8601"
  }
}
```

#### POST /api/auth/sign-in/email
Meldet einen Benutzer an.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "callbackURL": "string (optional)"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST /api/auth/sign-out
Meldet den aktuellen Benutzer ab.

**Response (200):**
```json
{
  "success": true
}
```

#### GET /api/auth/get-session
Gibt die aktuelle Session zurück.

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Response (401):**
```json
null
```

### 9.3 Posts Endpoints

#### GET /api/posts
Listet alle Posts auf (mit Paginierung).

**Query Parameters:**
- `limit` (number, default: 10): Anzahl der Posts pro Seite.
- `offset` (number, default: 0): Anzahl der zu überspringenden Posts.

**Response Headers:**
- `X-Database-Batch: true` – Zeigt Batching an

**Response (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "userId": "uuid",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

#### GET /api/posts/:id
Gibt einen einzelnen Post zurück.

**Path Parameters:**
- `id` (string): Post UUID

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "userId": "uuid",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Response (404):**
```json
{
  "error": "Post not found"
}
```

#### POST /api/posts
Erstellt einen neuen Post (Auth required).

**Headers:**
- Cookie: Session Token (automatisch)

**Request:**
```json
{
  "title": "string (1-100 chars)",
  "content": "string (min 1 char)"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "userId": "uuid",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "issues": [{ "message": "Title is required" }]
  }
}
```

### 9.4 Protected & GDPR Endpoints

#### GET /api/protected
Test-Endpoint für Authentifizierung.

**Response (200):**
```json
{
  "message": "This is a protected route",
  "user": { ... }
}
```

#### GET /api/me/export
Exportiert alle personenbezogenen Daten des Users (Art. 15 DSGVO).

**Response (200):**
```json
{
  "exportDate": "ISO8601",
  "user": { ... },
  "posts": [ ... ],
  "info": "..."
}
```

**Implementation:**
```typescript
.get("/api/me/export", authGuard, async (c) => {
  const user = c.get("user");
  const [userData, userPosts] = await db.batch([
    db.select().from(user).where(eq(user.id, user.id)).limit(1),
    db.select().from(post).where(eq(post.userId, user.id)),
  ]);
  return c.json({ user: userData[0], posts: userPosts });
})
```

#### DELETE /api/me
Löscht den Account und alle assoziierten Daten permanent (Art. 17 DSGVO).

**Response (200):**
```json
{
  "success": true,
  "message": "Your account and all associated data have been permanently deleted."
}
```

**Implementation:**
```typescript
.delete("/api/me", authGuard, async (c) => {
  const user = c.get("user");
  await db.delete(user).where(eq(user.id, user.id));
  return c.json({ success: true });
})
```

### 9.5 Error Response Format

Alle Fehler folgen diesem standardisierten Schema:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": 500,
    "stack": "Stack trace (optional, dev only)"
  }
}
```

---

## 10. Performance-Optimierungen

### 10.1 Backend-Optimierungen

#### 10.1.1 Database Batching
```typescript
const [posts, stats] = await db.batch([
  db.select().from(post).orderBy(desc(post.createdAt)),
  db.select({ total: count() }).from(post),
]);
```

**Vorteile:**
- 1 Roundtrip statt 2
- Reduzierte CPU-Last
- Geringere Latenz

#### 10.1.2 Index-Strategie
```typescript
(table) => ({
  userIdIdx: index("post_userId_idx").on(table.userId),
})
```

| Index | Query Pattern | Komplexität |
|-------|--------------|-------------|
| `user_email_unique` | WHERE email = ? | O(log n) |
| `session_token_unique` | WHERE token = ? | O(log n) |
| `post_userId_idx` | WHERE userId = ? | O(log n) |

#### 10.1.3 WAL Mode
libSQL aktiviert automatisch WAL (Write-Ahead Logging):
- Concurrent Reads
- Non-blocking Writes
- Crash Recovery

### 10.2 Frontend-Optimierungen

#### 10.2.1 Code Splitting
```typescript
// vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      "vendor-react": ["react", "react-dom"],
      "vendor-tanstack": ["@tanstack/react-query", "@tanstack/react-router"],
      "vendor-utils": ["lucide-react", "zod"],
    },
  },
}
```

**Resultierende Chunks:**
| Chunk | Inhalt | Größe (est.) |
|-------|--------|--------------|
| vendor-react | React Core | ~130KB |
| vendor-tanstack | Router + Query | ~80KB |
| vendor-utils | Icons + Zod | ~40KB |
| index | App Code | ~50KB |

#### 10.2.2 Query Caching
TanStack Query mit Smart Caching:
```typescript
const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  staleTime: 30_000,  // 30 Sekunden
});
```

#### 10.2.3 Coordinated Splash Screen
Verhindert Layout Shift und UI-Flickering (z.B. Login-Button zeigt sich kurz vor User-Profil).
1. **Static HTML**: Splash wird sofort im `index.html` angezeigt.
2. **React Logic**: `isPending` von `authClient.useSession()` blockiert Rendering.
3. **Coordination**: Erst wenn die Session geladen ist (`!isPending`), wird die globale Funktion `window.removeSplash()` aufgerufen.

```typescript
useEffect(() => {
  if (!isPending) {
    window.removeSplash?.();
  }
}, [isPending]);
```

### 10.3 PWA-Konfiguration
```typescript
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "Bun Hono Multi-Post",
    short_name: "PostApp",
    theme_color: "#ffffff",
    icons: [...]
  }
})
```

### 10.4 Verifizierte Performance-Metriken (Benchmarks)

| Metrik | Ziel | Verifizierter Wert (lokal/Bun) | Messmethode |
|--------|------|-------------------------------|-------------|
| First Contentful Paint | < 1.0s | ~800ms | Lighthouse |
| Time to Interactive | < 2.0s | ~1.2s | Lighthouse |
| **Request Latency (API)** | < 20ms | ~4-8ms (ohne DB-Delay) | `bombardier` / `wrk` |
| **Requests Peak** | > 2000 RPS | ~2400 RPS (Single Core) | `bombardier -c 50` |
| **Server Memory (Idle)** | < 64MB | ~42MB | `process.memoryUsage().rss` |
| **Server Memory (Load)** | < 128MB | ~95MB (1000 concurrent) | `process.memoryUsage().rss` |

---

## 11. Deployment & Operations

### 11.1 Deployment-Architektur

```
┌──────────────────────────────────────────────────────────┐
│                         VPS                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │                    Bun Runtime                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │           Hono Server (Port 3000)            │  │  │
│  │  │                                              │  │  │
│  │  │  ┌─────────────┐    ┌─────────────────────┐ │  │  │
│  │  │  │   /api/*    │    │   /* (serveStatic)  │ │  │  │
│  │  │  │   Backend   │    │   Frontend (dist/)  │ │  │  │
│  │  │  └─────────────┘    └─────────────────────┘ │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                          │                          │  │
│  │                          ▼                          │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │              SQLite (sqlite.db)              │  │  │
│  │  │                 (WAL Mode)                   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 11.2 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | ✅ Yes | - | Session Encryption Key |
| `BETTER_AUTH_URL` | ⚠️ Prod | `http://localhost:3000` | Public Server URL |
| `PRODUCTION_URL` | ⚠️ Prod | - | Frontend Origin for CORS |
| `PORT` | ❌ No | `3000` | Server Port |

### 11.3 Build Process

```bash
# 1. Install Dependencies
bun install

# 2. Start Full Build (UI + Binary)
bun run build
# Output:
# - dist/      (Frontend)
# - server-bin (Backend Binary)

# 3. Sync Database Schema
bun run db:push
```

### 11.4 Deployment Steps

```bash
# 1. Transfer Files
# Nur das Binary, der dist-Ordner und das Schema werden benötigt
rsync -avz server-bin dist/ user@vps:/app

# 2. Start Server
# Keine Bun-Installation auf dem Server nötig (Self-contained Binary)
NODE_ENV=production ./server-bin
```

### 11.5 Required Files for Production

```
dist/                    # Compiled Frontend
src/server/              # Backend Code
src/shared/              # Shared Schemas
package.json
bun.lockb
.env                     # Environment Variables
```

### 11.6 Health Monitoring

**Automatisierte Checks:**
```bash
# JSON Health Check (Empfohlen für UptimeRobot/StatusCake)
curl -f http://localhost:3000/health | grep '"status":"ok"'

# Memory Monitoring (via Health Endpoint)
curl -s http://localhost:3000/health | jq '.memoryUsage.rss'
```

### 11.7 Backup-Strategie & Wartung (Cron Jobs)

Um die Integrität und Performance der Anwendung auf einem VPS zu gewährleisten, werden folgende automatisierte Aufgaben (Cron Jobs) empfohlen:

#### 11.7.1 Datenbank-Backup (Täglich)
Sichert die SQLite-Datenbank und rotiert Backups (behält die letzten 7 Tage).
```bash
# /etc/cron.daily/app-backup
0 3 * * * sqlite3 /app/sqlite.db ".backup '/backups/backup-$(date +\%w).db'"
```

#### 11.7.2 Datenbank-Bereinigung (Wöchentlich)
Optimiert die Datenbankdatei (VACUUM) und löscht abgelaufene Sessions.
```bash
# /etc/cron.weekly/app-cleanup
0 4 * * 0 sqlite3 /app/sqlite.db "DELETE FROM session WHERE expiresAt < (strftime('%s', 'now') * 1000); VACUUM;"
```

#### 11.7.3 Health Alerting
Ein simpler Check, der bei Ausfall eine Benachrichtigung sendet.
```bash
# /etc/cron.hourly/app-health
*/5 * * * * curl -f http://localhost:3000/health || echo "ALARM: App down" | mail -s "App Health Alert" admin@domain.com
```

---

## 12. Qualitätssicherung

### 12.1 TypeScript-Konfiguration

```json
{
  "compilerOptions": {
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

| Option | Beschreibung |
|--------|--------------|
| `strict` | Aktiviert alle Strict Checks |
| `noFallthroughCasesInSwitch` | Verhindert Switch-Fallthrough |
| `noUncheckedIndexedAccess` | Array-Zugriff kann undefined sein |
| `noImplicitOverride` | Override muss explizit sein |

### 12.2 Biome Linter-Regeln

```json
{
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

**Deaktivierte Regeln (mit Begründung):**
| Regel | Begründung |
|-------|------------|
| `noNonNullAssertion` | React Root Mount Pattern |
| `noExplicitAny` | Legacy-Code Integration |
| `useSemanticElements` | DaisyUI Patterns |

### 12.3 Code Quality Commands

```bash
# Lint Check
bun run lint

# Auto-Fix
bun run lint:fix
```

### 12.4 Type-Safety Chain

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Drizzle   │───▶│    Zod      │───▶│  Hono RPC   │
│   Schema    │    │   Schema    │    │   Client    │
└─────────────┘    └─────────────┘    └─────────────┘
     ▲                                       │
     │        Type Inference Flow            │
     └───────────────────────────────────────┘
```

### 12.5 Test-Strategie

Die Anwendung implementiert eine mehrstufige Test-Strategie zur Sicherstellung der Code-Qualität.

#### 12.5.1 Unit & Integration Tests (Vitest)
Die Anwendung nutzt Vitest für schnelle, isolierte Tests der Geschäftslogik und API-Endpoints.

- **Tools:** Vitest
- **Befehl:** `bun run test`
- **Abdeckung:**
    - **Schemas ([src/shared/schemas.test.ts](src/shared/schemas.test.ts))**: Validierung von Paginierungsparametern und Post-Erstellung (Zod).
    - **API v1 ([src/server/v1.test.ts](src/server/v1.test.ts))**: Integrationstests der Hono-Route-Handler. Nutzt `vi.mock`, um die Datenbank ([src/server/db/index.ts](src/server/db/index.ts)) und Authentifizierung ([src/server/auth/auth.ts](src/server/auth/auth.ts)) zu isolieren.
        - `GET /posts`: Verifiziert Paginierungslogik und Batch-Abfragen.
        - `POST /posts`: Verifiziert die Erstellung von Posts unter Verwendung des `authGuard`.

#### 12.5.2 E2E Tests (Playwright)
End-to-End Tests bilden kritische Benutzerpfade in einem realen Browser nach, um das Zusammenspiel aller Komponenten zu prüfen.

- **Tools:** Playwright
- **Befehl:** `bun run test:e2e`
- **Szenarien ([tests-e2e/basic.spec.ts](tests-e2e/basic.spec.ts))**:
    - **Initial Load**: Überprüfung von Seitentitel und Willkommensnachricht ("Welcome to PostApp").
    - **Navigation**: Prüfung des Wechsels zur Login-Seite und Sichtbarkeit der "Welcome Back" Karte.

#### 12.5.3 Real-time Performance & Integrated Audits
Die Anwendung nutzt integrierte Tooling-Strategien für eine kontinuierliche Performance-Überwachung.

- **Vite Integration (@unlighthouse/vite)**: Lighthouse-Audits sind direkt in die Build-Pipeline integriert. Metriken werden während des Builds oder im Preview-Modus erhoben.
- **Report Preview**: Mit `bun run preview:audit` kann der zuletzt generierte Report über einen dedizierten Server (Port 5678) eingesehen werden (ideal für Codespaces).
- **Real-time Monitoring (Web-Vitals HUD)**: In der Entwicklungsumgebung zeigt eine HUD-Komponente ([src/client/components/ui/VitalsOverlay.tsx](src/client/components/ui/VitalsOverlay.tsx)) die Core Web Vitals (LCP, CLS, INP) in Echtzeit an.
- **Vorteil**: Probleme werden direkt während der Entwicklung (Shift-Left) und nicht erst in der Post-Deployment-Phase erkannt.

### 12.6 Error Monitoring & Logging

Der Server nutzt einen dedizierten `Logger` Service ([src/server/lib/logger.ts](src/server/lib/logger.ts)), der strukturiertes Logging und Fehlerüberwachung zentralisiert.

| Log-Level | Zweck | Ziel |
|-----------|-------|------|
| `info` | Erfolgreiche Requests, System-Events | JSON Console Output |
| `warn` | Fehlende Config, Performance Bottlenecks | JSON Console Output |
| `error` | Exceptions, Status 500 Fehler | DB / Sentry (Placeholder) |

**Error Tracking Pattern:**
Alle Fehler werden in `app.onError` abgefangen und via `Logger.error` dokumentiert. Dies ermöglicht eine einfache Integration von Diensten wie Sentry, Logtail oder BetterStack.

---

## 13. Zukunftssicherheit & Skalierbarkeit

### 13.1 Skalierungspfade

#### 13.1.1 Vertikale Skalierung
Aktueller Stand, optimiert für:
- **Lean-Entry VPS (1 vCPU, 1GB RAM, z.B. Hetzner CX21/DigitalOcean $6)**
- ~1000 - 2000 concurrent users (durch Bun & Hono Overhead-Minimierung)

#### 13.1.2 Horizontale Skalierung

**Phase 1: Distributed Database**
```typescript
// Wechsel von lokalem SQLite zu Turso
const client = createClient({
  url: process.env.TURSO_URL,      // "libsql://..."
  authToken: process.env.TURSO_TOKEN,
});
```

**Phase 2: Edge Deployment**
Hono ist Edge-ready:
```typescript
// Cloudflare Workers
export default app;

// AWS Lambda
export const handler = handle(app);
```

### 13.2 Technologie-Upgradepfade

| Aktuell | Upgrade-Option | Aufwand |
|---------|----------------|---------|
| SQLite | Turso (Distributed SQLite) | Minimal |
| SQLite | PostgreSQL + Drizzle-pg | Mittel |
| Bun | Node.js (falls nötig) | Minimal |
| Single Server | K8s / Docker Swarm | Hoch |

### 13.3 Feature-Erweiterbarkeit

**Einfach hinzufügbar:**
- Social Login (Better-Auth Plugin)
- Email Verification (Better-Auth Plugin)
- Rate Limiting (Hono Middleware)
- File Uploads (Bun APIs)

**Architektur-konform:**
- Real-time Updates (WebSockets)
- Full-Text Search (SQLite FTS5)
- Caching Layer (Redis)

### 13.4 Dependency-Maintenance

| Dependency | Update-Strategie |
|------------|------------------|
| Bun | Regelmäßig (Perf-Updates) |
| React | Major nach Stabilität |
| Hono | Regelmäßig (API stabil) |
| Better-Auth | Nach Security Patches |
| Drizzle | Nach Feature-Bedarf |

---

## 14. Risikobewertung

### 14.1 Technische Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Bun Instabilität | Mittel | Hoch | Node.js Fallback möglich |
| SQLite Skalierungs-Limit | Niedrig | Mittel | Turso-Migration vorbereitet |
| Dependency Vulnerability | Mittel | Hoch | Regelmäßige Audits |
| Session Hijacking | Niedrig | Hoch | HttpOnly + Secure Cookies |

### 14.2 Operationale Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Datenverlust | Niedrig | Kritisch | Backup-Strategie |
| Server-Downtime | Mittel | Hoch | Health Checks + Alerting |
| Secret Leak | Niedrig | Kritisch | Env Vars, keine Hardcoding |

### 14.3 Business Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Framework Deprecation | Niedrig | Mittel | Aktive Communities |
| Vendor Lock-In | Niedrig | Niedrig | Standard-APIs verwendet |

---

## 15. Compliance & Standards

### 15.1 Eingehaltene Standards

| Standard | Status | Details |
|----------|--------|---------|
| OWASP Top 10 | ✅ Adressiert | Siehe Sicherheitsarchitektur |
| 12-Factor App | ⚠️ Teilweise | Config via Env, Logs to stdout |
| Semantic Versioning | ✅ Empfohlen | Für Releases |

### 15.2 OWASP Top 10 Mapping

| OWASP Risk | Mitigation |
|------------|------------|
| A01 Broken Access Control | Auth Guard Middleware |
| A02 Cryptographic Failures | HttpOnly Cookies, bcrypt |
| A03 Injection | Parameterized Queries (Drizzle) |
| A04 Insecure Design | Defense in Depth |
| A05 Security Misconfiguration | Env-based Config |
| A06 Vulnerable Components | Dependency Audit |
| A07 Auth Failures | Better-Auth (Session-based) |
| A08 Integrity Failures | Keine unsigned Updates |
| A09 Logging Failures | Request Logger |
| A10 SSRF | Keine externen Requests |

### 15.3 Datenschutz (DSGVO-Hinweise)

| Anforderung | Implementierung | Detail |
|-------------|-----------------|--------|
| Datenminimierung | Nur notwendige Felder | E-Mail, Name, Password (hash) |
| Zweckbindung | User-ID für Posts | Systeminterne Verknüpfung |
| **Löschrecht (Art. 17)** | ✅ Implementiert | `DELETE /api/me` (Cascading Delete) |
| **Auskunftsrecht (Art. 15)** | ✅ Implementiert | `GET /api/me/export` (JSON-Export) |
| Datensicherheit | ✅ Implementiert | Verschlüsselung, CSP, Session-Isolation |

---

## Anhänge

### A. NPM Scripts Reference

```json
{
  "dev:server": "bun run --hot src/server/index.ts",
  "dev:ui": "vite",
  "dev": "bun run dev:server & bun run dev:ui",
  "build": "vite build",
  "preview": "vite preview",
  "db:push": "bunx drizzle-kit push",
  "db:studio": "bunx drizzle-kit studio",
  "lint": "biome check .",
  "lint:fix": "biome check --write ."
}
```

### B. Umgebungs-Setup

```bash
# .env Beispiel
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-domain.com
PRODUCTION_URL=https://your-domain.com
```

### C. Glossar

| Begriff | Definition |
|---------|------------|
| **High-Density Monolith** | Unified Fullstack in einer Codebase |
| **E2E Type-Safety** | TypeScript von DB bis UI |
| **WAL Mode** | Write-Ahead Logging für SQLite |
| **RPC Client** | Remote Procedure Call mit Type Inference |
| **Edge-Ready** | Deploybar auf CDN Edge Nodes |

---

**Dokumentversion:** 1.3.0  
**Letzte Aktualisierung:** 03.02.2026  
**Autor:** GitHub Copilot (Gemini 3 Flash)  
**Review-Status:** Bereit für Evaluation / Lean-VPS Optimized
