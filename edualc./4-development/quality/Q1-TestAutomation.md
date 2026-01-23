# Agent Q1: Test Automation Engineer

**Role**: Jest/Vitest Testing Specialist  
**Priority**: ⭐⭐⭐⭐ (High - Week 1)  
**Dependencies**: B1 (API), F1 (Components)  
**Coordinates with**: CQ1 (Code Review)

---

## RESPONSIBILITIES

### Test Coverage
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Component tests (React Testing Library)

### Test Files
- Backend: `backend/src/**/__tests__/*.test.ts`
- Frontend: `frontend/src/**/__tests__/*.test.tsx`
- E2E: `frontend/e2e/*.spec.ts`

### CI Integration
- GitHub Actions testing
- Pre-commit hooks
- Coverage reports

---

## CONTEXT

**Backend**: Vitest + Supertest  
**Frontend**: Jest + React Testing Library  
**E2E**: Playwright  
**Goal**: 80%+ code coverage

---

## CURRENT TASKS (Week 1)

### Priority 1: API Tests
```typescript
// backend/src/routes/__tests__/properties.test.ts
import request from 'supertest';
import { app } from '../../app';

describe('GET /api/properties', () => {
  it('should return properties list', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({ city: 'Bangalore' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.properties).toBeInstanceOf(Array);
  });
  
  it('should filter by price range', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({ minPrice: 5000000, maxPrice: 10000000 });
    
    expect(res.body.data.properties.every(
      p => p.price >= 5000000 && p.price <= 10000000
    )).toBe(true);
  });
});
```

### Priority 2: Component Tests
```typescript
// frontend/src/components/__tests__/PropertyCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    title: 'Test Villa',
    price: 8500000,
    city: 'Bangalore',
    bedrooms: 4,
    bathrooms: 3.5
  };
  
  it('should render property details', () => {
    render(<PropertyCard property={mockProperty} />);
    
    expect(screen.getByText('Test Villa')).toBeInTheDocument();
    expect(screen.getByText('₹85,00,000')).toBeInTheDocument();
    expect(screen.getByText('4 BHK')).toBeInTheDocument();
  });
});
```

### Priority 3: E2E Tests
```typescript
// frontend/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test('property search flow', async ({ page }) => {
  await page.goto('http://localhost:3000/estate');
  
  // Search
  await page.fill('[data-testid="search-input"]', 'Bangalore');
  await page.click('[data-testid="search-button"]');
  
  // Verify results
  await expect(page.locator('.property-card')).toHaveCount(20);
  
  // Click property
  await page.click('.property-card:first-child');
  await expect(page).toHaveURL(/\/estate\/property\/.+/);
});
```

---

## TEST STRUCTURE

**Backend Tests**:
```
backend/src/
├── routes/
│   ├── __tests__/
│   │   ├── properties.test.ts
│   │   ├── auth.test.ts
│   │   └── agents.test.ts
```

**Frontend Tests**:
```
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── PropertyCard.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   └── DebatePanel.test.tsx
```

---

## COVERAGE GOALS

**Week 1 Targets**:
- API routes: 80%+
- React components: 70%+
- Critical paths: 100%

**Commands**:
```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage

# E2E
cd frontend && npm run test:e2e
```

---

## HANDOFF PROTOCOLS

### From @B1 (API):
```markdown
READY FOR TESTING: Property search endpoint
- URL: GET /api/properties
- Test cases needed: search, filters, pagination, errors
```

### To @CQ1 (Code Review):
```markdown
TESTS COMPLETE: Property API
- Coverage: 85%
- All edge cases tested
- PR ready for review
```

---

## CURRENT STATUS

**This Week**:
- [ ] Write property API tests
- [ ] Write component tests (PropertyCard, SearchBar)
- [ ] Set up E2E test suite
- [ ] Configure GitHub Actions CI

**Blocked By**: Waiting for @B1 API endpoints  
**Next**: Agent swarm tests
