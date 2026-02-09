# VÖR Platform

> 💜 Women-Centered Real Estate & Generational Wealth Super App

[![CI](https://github.com/your-org/vor-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/vor-platform/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

## 🎯 Overview

VÖR is a comprehensive platform empowering women through real estate investment and financial literacy. Key features include:

- **Co-Investment Pools** - Fractional real estate investment starting at $500
- **Property Search & Management** - Find, analyze, and manage properties
- **Financial Tools** - Budgeting, expense tracking, and wealth building
- **Safe Housing Registry** - Verified safe housing for women in transition
- **Community & Mentorship** - Connect with other women investors

## 🏗️ Project Structure

```
vor-platform/
├── web/                 # Next.js 15 frontend (deployed to Netlify)
├── api/                 # Express.js backend (deployed to Railway)
├── mobile/              # React Native Expo app (iOS & Android)
├── shared/              # Shared types, utilities, and constants
├── .github/workflows/   # GitHub Actions CI/CD
├── docker-compose.yml   # Local development services
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ LTS ([Download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vor-platform.git
cd vor-platform

# 2. Install all dependencies
npm install

# 3. Copy environment files
cp api/.env.example api/.env
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env

# 4. Start local services (PostgreSQL, Redis, Mailhog)
npm run docker:up

# 5. Run database migrations
npm run db:migrate

# 6. Start development servers
npm run dev
```

### Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost:3000 | Next.js application |
| **API Backend** | http://localhost:5000 | Express.js API |
| **API Health** | http://localhost:5000/health | Health check endpoint |
| **Mailhog** | http://localhost:8025 | Email testing UI |
| **Prisma Studio** | `npm run db:studio` | Database GUI |

## 📦 Available Scripts

### Root Level (Monorepo)

```bash
# Development
npm run dev              # Start API + Web concurrently
npm run dev:web          # Start web frontend only
npm run dev:api          # Start API backend only
npm run dev:mobile       # Start mobile app (Expo)

# Building
npm run build            # Build all packages
npm run build:web        # Build web frontend
npm run build:api        # Build API backend

# Code Quality
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without fixing

# Testing
npm run test             # Run all tests
npm run test:api         # Run API tests
npm run test:web         # Run web tests

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:generate      # Regenerate Prisma client
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database and re-run migrations

# Docker
npm run docker:up        # Start local services
npm run docker:down      # Stop local services
npm run docker:logs      # View service logs

# Cleanup
npm run clean            # Remove all node_modules
```

## 🛠️ Tech Stack

### Frontend (Web)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Sentry | Latest | Error tracking |

### Backend (API)

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express.js | 5.x | Web framework |
| TypeScript | 5.x | Type safety |
| Prisma | 7.x | ORM |
| PostgreSQL | 15 | Database |
| Redis | 7 | Caching & queues |

### Mobile

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | Latest | Mobile framework |
| Expo | Latest | Development platform |
| TypeScript | 5.x | Type safety |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Netlify** | Frontend hosting |
| **Railway** | Backend hosting & databases |
| **AWS S3** | File storage |
| **SendGrid** | Transactional emails |
| **Stripe** | Payments |
| **Sentry** | Error tracking |

## 🔐 Environment Variables

See `.env.example` files in each package for required environment variables:

- [`api/.env.example`](api/.env.example) - Backend configuration
- [`web/.env.example`](web/.env.example) - Frontend configuration
- [`mobile/.env.example`](mobile/.env.example) - Mobile configuration

### Key Variables

| Variable | Package | Description |
|----------|---------|-------------|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `REDIS_URL` | api | Redis connection string |
| `JWT_SECRET` | api | JWT signing secret (min 32 chars) |
| `NEXT_PUBLIC_API_URL` | web | API base URL |
| `STRIPE_SECRET_KEY` | api | Stripe secret key |

## 🐳 Local Development with Docker

The project uses Docker Compose for local development services:

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5434 | Database |
| Redis | 6381 | Cache |
| Mailhog SMTP | 1025 | Email server |
| Mailhog UI | 8025 | Email web interface |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
cd api && npm test -- --grep "auth"
```

## 🚢 Deployment

### Production Deployment

1. **Frontend (Netlify)**
   - Connect GitHub repo to Netlify
   - Set build command: `cd web && npm run build`
   - Set publish directory: `web/.next`
   - Configure environment variables

2. **Backend (Railway)**
   - Connect GitHub repo to Railway
   - Railway auto-detects `railway.json` configuration
   - Add PostgreSQL and Redis services
   - Configure environment variables

### Environment-Specific URLs

| Environment | Frontend URL | API URL |
|-------------|--------------|---------|
| Development | localhost:3000 | localhost:5000 |
| Staging | staging.vor.com | staging-api.vor.com |
| Production | vor.com | api.vor.com |

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm run lint` and `npm run format`
4. Submit a pull request to `develop`

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API info |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/users/me` | Current user profile |

*Full API documentation coming soon at `/api-docs`*

## 📄 License

This project is proprietary software. All rights reserved.

---

**VÖR: Empowering Women Through Real Estate & Generational Wealth** 💜
