# Contributing to VÖR Platform

Thank you for your interest in contributing to VÖR! This document provides guidelines and instructions for contributing.

## 🌟 Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and considerate in all interactions.

## 🚀 Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` files to `.env` in each package
4. **Start local services**: `npm run docker:up`
5. **Run migrations**: `npm run db:migrate`
6. **Start development**: `npm run dev`

## 📝 Development Workflow

### Branch Naming Convention

Use the following prefixes for branch names:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/co-invest-dashboard` |
| `fix/` | Bug fixes | `fix/login-validation` |
| `docs/` | Documentation | `docs/api-endpoints` |
| `refactor/` | Code refactoring | `refactor/auth-middleware` |
| `test/` | Adding tests | `test/property-service` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add email verification flow
fix(api): resolve database connection timeout
docs(readme): update installation instructions
```

## 🔍 Code Review Process

1. Create a pull request from your feature branch to `develop`
2. Ensure all CI checks pass (lint, tests, build)
3. Request review from at least one team member
4. Address any feedback and make necessary changes
5. Once approved, squash and merge

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm run test

# Run API tests
npm run test:api

# Run web tests
npm run test:web

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for all new functions and utilities
- Write integration tests for API endpoints
- Aim for 80%+ code coverage on new code
- Use descriptive test names that explain the expected behavior

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` type - use proper typing
- Use interfaces for object shapes
- Export types from dedicated files

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Variables | camelCase | `userName` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Enums | PascalCase | `UserStatus` |

### Code Style

- Use Prettier for formatting: `npm run format`
- Use ESLint for linting: `npm run lint`
- Maximum line length: 100 characters
- Use single quotes for strings
- Use trailing commas in arrays and objects

## 📁 Project Structure

```
vor-platform/
├── api/                    # Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── lib/            # Shared libraries (prisma, sentry)
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── prisma/             # Database schema & migrations
├── web/                    # Next.js frontend
│   └── src/
│       ├── app/            # App Router pages
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utilities and API client
│       └── styles/         # Global styles
├── mobile/                 # React Native Expo app
└── shared/                 # Shared types and constants
```

## 🔒 Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for all secrets
- Validate all user input
- Sanitize data before database queries
- Follow OWASP security best practices

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments to public functions
- Document API endpoints with examples
- Keep CHANGELOG.md updated

## ❓ Questions?

If you have questions, please:
1. Check existing issues and documentation
2. Create a new issue with the `question` label
3. Reach out to the team on Slack

---

Thank you for contributing to VÖR! 💜
