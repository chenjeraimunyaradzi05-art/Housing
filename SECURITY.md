# Security Policy

## VÖR Platform Security Overview

VÖR is a women-centered real estate and generational wealth platform that handles sensitive financial and personal data. We take security seriously and have implemented comprehensive measures to protect our users.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We appreciate the security research community's efforts in helping keep VÖR and our users safe.

### How to Report

1. **Email**: Send security reports to security@vor.io
2. **Subject**: Use `[SECURITY]` prefix in your email subject
3. **PGP**: For sensitive reports, use our PGP key (available at vor.io/security-pgp.txt)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Any suggested remediation
- Your contact information for follow-up

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Resolution Target**: 
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### Responsible Disclosure

We request that you:
- Give us reasonable time to fix issues before public disclosure
- Avoid accessing or modifying other users' data
- Act in good faith to avoid privacy violations

We commit to:
- Not pursue legal action against researchers acting in good faith
- Acknowledge security researchers in our Hall of Fame (with permission)
- Provide updates on remediation progress

## Security Measures

### Authentication & Access Control

- **Password Security**: bcrypt hashing with appropriate cost factor
- **JWT Tokens**: Short-lived access tokens (15 min) with refresh token rotation
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA using Google Authenticator compatible apps
- **Rate Limiting**: Protection against brute force attacks
  - Auth endpoints: 5 requests/15 minutes
  - Password reset: 3 requests/hour
  - Standard API: 100 requests/15 minutes
- **Session Management**: Secure session handling with automatic timeout

### Data Protection

- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Database Security**: PostgreSQL with encrypted connections
- **PII Protection**: Sensitive fields are hashed or encrypted

### API Security

- **Helmet.js**: Comprehensive security headers
  - Content Security Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security
- **CORS**: Configured for specific origins only
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Protection**: Parameterized queries via Prisma ORM

### Infrastructure Security

- **WAF**: Web Application Firewall protection
- **DDoS Protection**: Cloudflare DDoS mitigation
- **Secrets Management**: Environment variables and secure vaults
- **Network Segmentation**: Isolated database networks

### Monitoring & Auditing

- **Audit Logging**: All significant actions are logged
  - Authentication events
  - Data access
  - Administrative actions
  - Financial transactions
- **Sentry Integration**: Error tracking and monitoring
- **Security Alerts**: Real-time alerts for suspicious activity

## Compliance

### KYC (Know Your Customer)

- Identity verification for investors
- Document verification
- Address verification
- Ongoing monitoring

### AML (Anti-Money Laundering)

- Transaction monitoring
- Suspicious activity detection
- Large transaction reporting
- Pattern analysis

### GDPR Compliance

- **Data Portability**: Users can export their data
- **Right to Erasure**: Account deletion with 30-day cooling period
- **Consent Management**: Granular consent controls
- **Data Minimization**: Only necessary data is collected

### Financial Regulations

- Secure handling of financial data
- PCI DSS compliance for payment processing (via Stripe)
- Bank-level encryption for financial connections (via Plaid)

## Security Headers

Our API responds with the following security headers:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Dependency Security

- **Dependabot**: Automated dependency updates
- **npm audit**: Regular security audits
- **License Compliance**: Only approved licenses

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Active exploitation, data breach | Immediate (24/7) |
| High | Exploitable vulnerability | 4 hours |
| Medium | Limited impact vulnerability | 24 hours |
| Low | Minor security concern | 72 hours |

### Response Process

1. **Detection**: Automated monitoring or report
2. **Assessment**: Severity and impact analysis
3. **Containment**: Immediate mitigation
4. **Eradication**: Root cause fix
5. **Recovery**: System restoration
6. **Lessons Learned**: Post-incident review

## Security Contacts

- **Security Team**: security@vor.io
- **Bug Bounty**: bounty@vor.io
- **Compliance**: compliance@vor.io

## Security Updates

Subscribe to security announcements:
- GitHub Security Advisories
- Email newsletter (security-updates@vor.io)

---

Last updated: January 2026

© 2026 VÖR Platform. All rights reserved.
