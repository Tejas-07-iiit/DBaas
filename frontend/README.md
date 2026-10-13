# DBaaS — Database-as-a-Service Frontend

A multi-engine Database-as-a-Service frontend built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.
Supports **MongoDB**, **PostgreSQL**, and **Qdrant** managed instances through a unified control-plane API.

---

## 📁 Project Architecture & Folder Structure

```text
dbaas/
├── public/                 # Static assets and favicons
├── scripts/                # Development & maintenance scripts
│   └── check-endpoints.mjs # Verifies all 40 required endpoints in .env.local
├── src/
│   ├── app/                # Next.js App Router (52 pages & routes)
│   │   ├── (marketing)/    # Public pages: /, /about, /features, /pricing, /product/*
│   │   ├── (content)/      # Content hubs: /blog/*, /case-studies/*, /docs/*, /changelog
│   │   ├── (auth)/         # Public auth gates: /login, /signup, /forgot-password, /reset-password
│   │   ├── (legal)/        # Legal & policy: /legal/privacy, /legal/security, /legal/terms
│   │   ├── dashboard/      # Authenticated console (AuthGuard protected)
│   │   │   ├── account/    # User settings & profile deletion
│   │   │   ├── admin/      # Platform admin panel (AdminGuard protected)
│   │   │   ├── projects/   # Workspace & database management per project
│   │   │   └── subscription/# Stripe billing & plan tiers
│   │   ├── globals.css     # Global theme styling, animations, tokens
│   │   └── layout.tsx      # Root layout frame with fonts and providers
│   ├── components/         # Reusable React UI components
│   │   ├── auth/           # Auth shells, terminal animations, password fields
│   │   ├── dashboard/      # Console cards, tables, badges, modals, guards
│   │   ├── demo/           # Demo Mode tools dialog
│   │   ├── effects/        # Background canvas effects, cursor glows, wordmarks
│   │   ├── layout/         # Navbar, Footer, MegaMenu, MobileMenu, SiteChrome
│   │   ├── legal/          # Legal layout frame
│   │   ├── product/        # Engine product page template
│   │   ├── providers/      # TanStack Query & React Context providers
│   │   ├── sections/home/  # Landing page interactive sections
│   │   └── ui/             # Design system primitives (Button, Card, Container, Section)
│   ├── config/             # Environment and API endpoint configuration
│   │   ├── endpoints.ts    # Registry of all 40 REST endpoints
│   │   └── env.ts          # Validated client-side environment variables
│   ├── data/               # Static marketing datasets and documentation content
│   │   └── products/       # Specifications for MongoDB, PostgreSQL, and Qdrant
│   └── lib/                # Core library utilities & services
│       ├── api/            # Typed REST API client modules & mappers
│       ├── auth/           # Auth context, route guards, token storage
│       ├── demo/           # In-browser simulated mock backend (Demo Mode)
│       ├── firebase/       # Firebase Client SDK for Google OAuth
│       └── validation/     # Zod form validation schemas
├── .env.example            # Template for required environment variables
├── .env.local              # Local environment variables
├── AGENTS.md               # Agent guidelines
├── BACKEND_ASSUMPTIONS.md  # Backend integration assumptions & contracts
├── DEMO_MODE.md            # In-browser demo mode guide & removal instructions
├── ENDPOINTS.md            # Complete list of 40 endpoints & specifications
└── PROJECT_CONTEXT.md      # Ground-truth platform architecture rules
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Verify Endpoints
Validate that all 40 required endpoints are configured in `.env.local`:
```bash
npm run check:endpoints
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Demo Mode

To run and test the frontend without spinning up a live backend server:
1. In `.env.local`, set:
   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_DEMO_EMAIL=demo@dbaas.local
   NEXT_PUBLIC_DEMO_PASSWORD=demo1234
   ```
2. Navigate to `/login` and sign in using the demo credentials.
3. Requests are intercepted in-browser by `src/lib/demo/server.ts` and saved to `localStorage`.
4. Click your user avatar in the dashboard top navigation bar to access **Demo Tools** (simulate latency, errors, or reset demo database).
5. For full details or to remove demo mode entirely, see [`DEMO_MODE.md`](file:///home/keyurkachariya/Projects/dbaas/DEMO_MODE.md).

---

## 🛠 Available Scripts

- `npm run dev` — Starts Next.js development server
- `npm run build` — Builds production bundle (validates TypeScript & routes)
- `npm run start` — Starts production server
- `npm run lint` — Runs ESLint checks
- `npm run check:endpoints` — Validates environment endpoint definitions

---

## 🔒 Security & Architecture Guarantees

- **No Direct Database Connections**: All traffic flows strictly through the control-plane gateway.
- **Role-Based Access Control (RBAC)**: Enforced per-project with `Owner`, `Admin`, and `Member` privileges.
- **Platform Admin Guard**: Global administration pages (`/dashboard/admin/*`) require `isPlatformAdmin: true`.
- **Bearer Token Auth**: Supports both backend JWT tokens with automatic 401 refresh queues and Firebase OAuth.
