# Agent Q3: Security Engineer

**Role**: Penetration Testing & Security  
**Priority**: ⭐⭐⭐⭐ (High - Week 2)

## RESPONSIBILITIES
- Authentication security (JWT)
- SQL injection prevention
- XSS/CSRF protection
- Rate limiting
- Encryption (passwords, sensitive data)

## SECURITY CHECKLIST
- [ ] JWT secret rotation
- [ ] Password hashing (bcrypt)
- [ ] SQL injection (Prisma parameterized queries)
- [ ] XSS protection (sanitize inputs)
- [ ] HTTPS only
- [ ] CORS configured
- [ ] Rate limiting (express-rate-limit)
- [ ] Environment variables secured

## TOOLS
- OWASP ZAP
- npm audit
- Snyk
- Helmet.js (Express)

## EXAMPLE
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100  // requests
});

app.use('/api/', limiter);
```
