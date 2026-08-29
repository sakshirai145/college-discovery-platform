# CollegeHub — College Discovery Platform

A full-stack web application for discovering, comparing, and saving colleges across Uttar Pradesh, India. Built with Next.js, PostgreSQL, Prisma, and Auth.js.

CollegeHub lets users search and filter a database-backed college catalog, view detailed institution profiles with courses and placement data, compare colleges side by side, and save favourites to their account.

## Features

### 1. College Listing + Search

- Full-text search across college names and locations
- Location filtering (text-based, case-insensitive)
- Maximum fee filtering
- Minimum rating filtering (3.0+ through 4.5+)
- Sorting by rating, fees, or name (ascending/descending)
- Paginated results (9 per page by default)
- Loading skeleton, empty state, and reset functionality

### 2. College Detail Page

- Dynamic route at `/colleges/[id]`
- Overview: name, location, established year, rating, description, optional image
- Courses table: name, duration, annual fees
- Placement cards: year, average package, highest package, placement rate
- Reviews: user name, rating, title, comment
- Custom 404 page for non-existent college IDs
- Loading skeleton state

### 3. Compare Colleges

- Compare 2–3 colleges side by side in a responsive table
- URL-based selection state (shareable via query params)
- Add/remove colleges from the listing page
- Comparison shows: rating, fees, established year, location, latest placement, courses offered
- Validation prevents comparison with fewer than 2 or more than 3 colleges
- Save comparison for later (requires authentication)

### 4. Authentication + Saved Items

- Email/password signup and login via Auth.js (NextAuth v5) credentials provider
- JWT-based session handling
- Server-side session validation on all protected routes
- Save/unsave colleges from the listing or detail page
- Saved colleges page with pagination
- Save, delete, and reopen comparisons from a dedicated saved comparisons page
- Ownership enforcement: users can only access their own saved data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.3.3 (App Router) |
| UI Library | React 19.2.8 |
| Language | TypeScript 5 |
| Styling | TailwindCSS 4 |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL |
| ORM | Prisma 6.19.3 |
| Authentication | Auth.js / NextAuth v5 (credentials provider) |
| Validation | Zod 4 |
| Password Hashing | bcryptjs 3 |
| Deployment | Render |

## Architecture

```
Browser
  |
  v
Next.js Frontend (port 3000)
  |  - Server Components fetch backend directly via BACKEND_URL
  |  - Client Components use /api rewrite (next.config.ts rewrites)
  |
  v
Next.js Backend API (port 4000)
  |  - API route handlers
  |  - Auth.js middleware (session validation)
  |  - Zod input validation
  |
  v
Service Layer (lib/services/)
  |  - college-service.ts (listing, detail, compare)
  |  - saved-service.ts (save/unsave, comparisons)
  |
  v
Prisma ORM
  |
  v
PostgreSQL
```

Key architectural boundaries:

- **Frontend never accesses Prisma or PostgreSQL directly.** All data flows through backend API routes.
- **Authentication is server-side.** Auth.js validates JWT sessions; protected routes check `session.user.id` before any database operation.
- **Authorization is enforced in the service layer.** All saved-item queries filter by the authenticated user's ID.
- **Shared types** in `shared/` define the contract between frontend and backend for college data structures.

## Project Structure

```
college-discovery-platform/
├── frontend/                    # Next.js frontend (port 3000)
│   ├── app/                     # Page routes
│   │   ├── page.tsx             # Home / college listing
│   │   ├── colleges/[id]/       # College detail page
│   │   ├── compare/             # Compare colleges page
│   │   ├── login/               # Login page
│   │   ├── signup/              # Signup page
│   │   ├── saved/               # Saved colleges page
│   │   │   └── comparisons/     # Saved comparisons page
│   │   └── not-found.tsx        # Global 404 page
│   ├── components/              # React components (14 files)
│   ├── lib/
│   │   ├── api-client.ts        # Server-side API calls
│   │   ├── saved-client.ts      # Client-side saved/auth APIs
│   │   └── format.ts            # Currency and rating formatters
│   ├── proxy.ts                 # Next.js 16 middleware (404 pre-check)
│   └── next.config.ts           # API rewrites to backend
│
├── backend/                     # Next.js backend API (port 4000)
│   ├── app/api/
│   │   ├── colleges/            # College CRUD + compare
│   │   ├── auth/                # Auth.js routes + custom login/signup/logout/me
│   │   └── saved/               # Saved colleges + comparisons
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── validations.ts       # Zod schemas
│   │   └── services/            # Business logic layer
│   │       ├── college-service.ts
│   │       └── saved-service.ts
│   ├── auth.ts                  # Auth.js configuration
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # 2 migrations
│   │   └── seed.ts              # Seed script (85 colleges)
│   └── next.config.ts           # CORS headers
│
├── shared/                      # Shared TypeScript types
│   └── index.ts                 # College, comparison, saved-item types
│
└── package.json                 # Workspace root (npm workspaces)
```

## Database

PostgreSQL with Prisma ORM. The schema defines 8 models:

| Model | Purpose |
|---|---|
| **User** | Accounts with email, name, bcrypt password hash |
| **College** | Institution records with name, location, fees, rating, description |
| **Course** | Programs offered by each college (name, duration, fees) |
| **Placement** | Yearly placement statistics (avg package, highest package, rate) |
| **Review** | User-submitted reviews with ratings, tied to users and colleges |
| **SavedCollege** | User-college save relationships (unique per user) |
| **SavedComparison** | Saved comparison sets with optional title |
| **SavedComparisonCollege** | Junction table linking comparisons to colleges with position ordering |

Relationships use `onDelete: Cascade` throughout. Indexes are defined on frequently queried columns (name, location, rating, fees, userId, collegeId). Unique constraints prevent duplicate saves and duplicate reviews per user per college.

### Seed Data

The seed script populates **85 colleges** across **20 cities** in Uttar Pradesh, India, covering institutions in Lucknow, Kanpur, Varanasi, Prayagraj, Gorakhpur, Agra, Meerut, Noida, and other cities. College types include IITs, IIMs, NITs, state universities, private engineering colleges, medical colleges, law universities, agriculture universities, language universities, Sanskrit universities, and degree colleges.

Placement data is included where representative data is available; colleges without placement data have empty placement arrays. Reviews are generated from curated templates with disclosure markers.

## API

### College APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/colleges` | List colleges with search, filters, sorting, pagination |
| GET | `/api/colleges/[id]` | Get college detail with courses, placements, reviews |
| GET | `/api/colleges/compare?ids=a,b` | Compare 2–3 colleges side by side |

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new account |
| POST | `/api/auth/login` | Sign in with email/password |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Get current user (authenticated) |
| GET/POST | `/api/auth/[...nextauth]` | Auth.js session handlers |

### Saved Items APIs (authenticated)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/saved/colleges` | List saved colleges (paginated) |
| POST | `/api/saved/colleges` | Save a college |
| DELETE | `/api/saved/colleges?collegeId=...` | Remove saved college |
| GET | `/api/saved/colleges/status?ids=a,b` | Check save status for multiple colleges |
| GET | `/api/saved/comparisons` | List saved comparisons |
| POST | `/api/saved/comparisons` | Save a comparison (2–3 college IDs) |
| DELETE | `/api/saved/comparisons?id=...` | Delete a saved comparison |
| GET | `/api/saved/comparisons/[id]` | Get a single saved comparison |

All input is validated with Zod. Protected routes use Auth.js `auth()` wrapper for session validation. Error responses use consistent `{ error: string }` format with appropriate HTTP status codes.

## Data

The college dataset is database-backed and contains researched information about institutions in Uttar Pradesh. Institution names, locations, establishment years, and course structures reflect publicly available information where available.

Placement figures, ratings, and reviews are illustrative sample data prepared for demonstration purposes. They are not verified official statistics. All college descriptions include a disclosure note about the demo nature of the data.

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (local install or cloud provider like Neon)
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/sakshirai145/college-discovery-platform.git
cd college-discovery-platform

# Install all dependencies (npm workspaces)
npm install
```

### Environment Variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/college_discovery"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
```

Create the frontend environment file (optional — defaults to localhost):

```bash
cp frontend/.env.example frontend/.env.local
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database with 85 colleges
npm run db:seed
```

### Running Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or run individually:
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
```

### Useful Scripts

```bash
npm run lint           # Run ESLint on both frontend and backend
npm run build          # Build both frontend and backend
npm run db:studio      # Open Prisma Studio (visual database browser)
npm run db:migrate:status  # Check migration status
```

## Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | backend | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | backend | Yes | JWT signing secret for Auth.js |
| `CORS_ORIGIN` | backend | No | Allowed CORS origin (defaults to `http://localhost:3000`) |
| `BACKEND_URL` | frontend | No | Backend API URL (defaults to `http://localhost:4000`) |

Environment files (`backend/.env`, `frontend/.env.local`) are gitignored and must not be committed.

## Deployment

The application is deployed on **Render** as two separate services:

### Backend Service

- **Build command:** `npm install && npm run db:generate && npm run build --workspace=@collegehub/backend`
- **Start command:** `npm run start --workspace=@collegehub/backend` (runs on port 4000)
- **Environment variables:** `DATABASE_URL`, `AUTH_SECRET`, `CORS_ORIGIN`

### Frontend Service

- **Build command:** `npm install && npm run build --workspace=@collegehub/frontend`
- **Start command:** `npm run start --workspace=@collegehub/frontend` (runs on port 3000)
- **Environment variables:** `BACKEND_URL` (set to the backend service's internal/external URL)

### Database

A PostgreSQL database (e.g., Neon, Render PostgreSQL, or Supabase) must be provisioned separately. Run `npm run db:migrate` and `npm run db:seed` against it before the first use.

### Post-Deploy Checklist

1. Run Prisma migrations against the production database
2. Seed the database (or import college data)
3. Set `BACKEND_URL` on the frontend service to point to the backend service URL
4. Set `CORS_ORIGIN` on the backend service to match the frontend's public URL

## Security

- Passwords are hashed with bcryptjs (10 salt rounds) — never stored in plaintext
- Auth.js manages JWT sessions; the `passwordHash` field is never exposed to the frontend
- All protected API routes validate the session server-side via Auth.js `auth()` wrapper
- Saved-item operations use `session.user.id` for ownership enforcement — never client-supplied IDs
- All input is validated with Zod before processing
- Environment secrets (`.env` files) are gitignored and excluded from the repository
- Error responses return generic messages; raw database errors are logged server-side only

## Verification

The following checks have been run against the current codebase:

- **TypeScript:** Both frontend and backend compile with zero errors under strict mode
- **ESLint:** Both frontend and backend pass linting with zero warnings
- **Production builds:** Both `next build` commands succeed
- **API smoke tests:** All 12 API routes return correct responses for valid and invalid inputs
- **Prisma:** Schema is valid, client generates, migrations are in sync, seed completes successfully

## Engineering Highlights

- **Clear frontend/backend separation** with a dedicated service layer for business logic
- **Relational data modeling** with proper foreign keys, cascading deletes, unique constraints, and performance indexes
- **URL-driven comparison state** — college selections for comparison are stored in query parameters, making comparisons shareable via URL
- **Batch save-status checking** — the listing page batches save-status requests to avoid N+1 API calls
- **Idempotent save operations** — saving an already-saved college returns the existing record instead of failing
- **Dedicated comparison deduplication** — saving the same set of colleges twice returns the existing comparison
- **Responsive comparison table** — horizontal scrolling with sticky labels for mobile viewports
- **Loading skeletons on every page** — each route has a matching loading.tsx with appropriate skeleton UI
- **Middleware-based 404 pre-check** — proxy.ts validates college IDs before the page renders, returning 404 early

## Assessment Context

This project was built as a Full Stack Engineer technical assessment for the College Discovery Platform track (Track A).

## Links

- **Repository:** https://github.com/sakshirai145/college-discovery-platform
- **Live Demo:** [Add Render deployment URL]
